import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../src/domain/referenceDefinitions.ts';
import {
  generatedSourceReference,
  referenceTextSegments,
} from '../src/domain/generatedReferenceLinks.ts';
import { parseRulesPack, setRules } from '../src/storage/rulesStore.ts';
import { parseOraclePack, setOraclePack } from '../src/storage/oracleStore.ts';
import {
  rollEquipmentSlot,
  generateCharacter,
} from '../src/generators/character.ts';
import { createCampaign } from '../src/generators/index.ts';
import { Characters } from '../src/components/Characters.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';

const path = 'outputs/morkborg-private-data.json';
const bundle = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
const rules = bundle ? parseRulesPack(bundle.library) : null;
const registry = buildOracleRegistry(
  rules,
  bundle ? parseOraclePack(bundle.oracles) : null,
);
const index = buildReferenceRegistry(registry, rules);
const cases = [
  {
    tableId: 'core.gearA',
    entryId: 'core.gearA:10-10',
    name: 'bomb',
    row: 10,
    required: /sealed bottle, d10 damage/,
  },
  {
    tableId: 'core.gearB',
    entryId: 'core.gearB:1-1',
    name: 'life elixir',
    row: 1,
    required: /heals d6 HP and removes infection/,
  },
  {
    tableId: 'core.gearB',
    entryId: 'core.gearB:3-3',
    name: 'small but vicious dog',
    row: 3,
    required: /d6\+2 HP, bite d4, only obeys you/,
  },
  {
    tableId: 'core.gearB',
    entryId: 'core.gearB:4-4',
    name: 'monkeys',
    row: 4,
    required: /d4\+2 HP, punch\/bite d4/,
  },
];
for (const item of cases)
  test(
    `Batch 3 ${item.name} lookup retains its complete canonical starting effect, Korean and source`,
    { skip: !bundle },
    () => {
      const entry = searchReferences(index, item.name)[0];
      assert.equal(entry.id, `definition:${item.entryId}`);
      const row = registry.tables
        .find((t) => t.id === item.tableId)!
        .entries.find((e) => e.id === item.entryId)!;
      assert.equal(entry.definition!.blocks[0].text, row.text);
      assert.match(entry.summary, item.required);
      assert.equal(
        entry.definition!.blocks[0].translation?.ko,
        row.metadata!.ko,
      );
      assert.match(entry.definition!.blocks[0].translation!.ko!, /[가-힣]/);
      assert.deepEqual(entry.definition!.tableEntry, {
        tableId: item.tableId,
        entryId: item.entryId,
      });
      assert.equal(entry.sourceRefs[0].bookId, 'core');
      assert.equal(entry.sourceRefs[0].pdfPage, 22);
      assert.equal(entry.sourceRefs[0].printedPage, 22);
      assert.equal(entry.sourceRefs[0].status, 'VERIFIED');
      assert.ok(entry.relatedIds.includes(`oracle:${item.tableId}`));
      assert.doesNotMatch(entry.summary, /\d+s\b|silver|은화/);
    },
  );

test(
  'Generated starting doses and companion HP link by canonical provenance without altering saved values',
  { skip: !bundle },
  (t) => {
    setRules(bundle.library);
    setOraclePack(bundle.oracles);
    for (const item of cases) {
      const random = t.mock.method(
        globalThis.crypto,
        'getRandomValues',
        (array: Uint32Array) => {
          array.fill(Math.floor(((item.row - 0.5) / 12) * 4294967296));
          return array;
        },
      );
      const generated = rollEquipmentSlot(
        item.tableId === 'core.gearA' ? 'gearA' : 'gearB',
        { presence: 0 },
      );
      random.mock.restore();
      const before = JSON.stringify(generated);
      assert.equal(
        generatedSourceReference(
          index.entries,
          generated.text,
          generated.provenance,
        )?.id,
        `definition:${item.entryId}`,
      );
      assert.equal(JSON.stringify(generated), before);
      assert.ok(
        generated.provenance!.sourceRefs.some(
          (s) => s.entryId === item.entryId,
        ),
      );
      if (item.name === 'life elixir') {
        assert.doesNotMatch(generated.text, /d4 doses/);
        assert.match(generated.text, /\d doses/);
      }
      if (item.name === 'monkeys')
        assert.match(generated.text, /creature\(s\); HP:/);
    }
  },
);

test(
  'Room and Encounter text can link starting equipment without changing text or merging blackpowder identity',
  { skip: !bundle },
  () => {
    const text =
      'A bomb, 1 life elixir 3 doses, small but vicious dog and d4 monkeys.';
    const segments = referenceTextSegments(index.entries, text);
    assert.equal(segments.map((s) => s.text).join(''), text);
    assert.deepEqual(
      new Set(segments.filter((s) => s.id).map((s) => s.id)),
      new Set(cases.map((c) => `definition:${c.entryId}`)),
    );
    const firearmBomb = referenceTextSegments(
      index.entries,
      'Blackpowder Bomb',
    );
    assert.ok(
      firearmBomb.some((s) => s.id && s.id !== 'definition:core.gearA:10-10'),
    );
    assert.ok(firearmBomb.every((s) => s.id !== 'definition:core.gearA:10-10'));
  },
);

test(
  'Manually replaced equipment is not assigned an obsolete source definition; unavailable source rows create no fallback',
  { skip: !bundle },
  () => {
    const provenance = {
      classification: 'USER_AUTHORED' as const,
      origin: 'source-edited' as const,
      status: 'VERIFIED' as const,
      sourceRefs: [
        {
          bookId: 'core',
          tableId: 'core.gearB',
          entryId: 'core.gearB:1-1',
          pdfPage: 22,
        },
      ],
    };
    assert.equal(
      generatedSourceReference(
        index.entries,
        'My hand-written keepsake',
        provenance,
      ),
      undefined,
    );
    const without = {
      ...registry,
      tables: registry.tables.map((t) =>
        ['core.gearA', 'core.gearB'].includes(t.id)
          ? { ...t, sourceVerified: false }
          : t,
      ),
    };
    assert.ok(
      buildReferenceDefinitions(without, rules).every(
        (d) => !cases.some((c) => d.id === `definition:${c.entryId}`),
      ),
    );
    assert.deepEqual(
      unresolvedReferenceDefinitions(
        buildReferenceDefinitions(registry, rules),
        registry,
      ),
      [],
    );
  },
);

test(
  'Character reading links equipment to carrying and daily Power uses to casting, without replacing HP editing',
  { skip: !bundle },
  () => {
    setRules(bundle.library);
    setOraclePack(bundle.oracles);
    const campaign = createCampaign('Batch 3 component QA');
    const character = generateCharacter(campaign.id);
    campaign.characters.push(character);
    campaign.workspace.selected.characters = character.id;
    const desk: DeskContext = {
      entries: index.entries,
      byId: index.byId,
      activate() {},
      openSearch() {},
      search: (q) => searchReferences(index, q),
      contextual: () => [],
      pinnedIds: [],
      recentIds: [],
      touch() {},
      togglePin() {},
    };
    const html = renderToStaticMarkup(
      createElement(
        ReferenceContext.Provider,
        { value: desk },
        createElement(Characters, { campaign, confirm() {}, notify() {} }),
      ),
    );
    assert.match(html, /aria-label="장비 · 소지 한도 reference"/);
    assert.match(html, /aria-label="Powers · 하루 사용 횟수 reference"/);
    assert.match(html, /aria-label="현재 HP 편집"/);
    assert.match(html, /aria-label="현재 HP 1 감소"/);
  },
);
