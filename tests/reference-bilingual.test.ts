import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceReadingText } from '../src/components/ReferenceReadingText.tsx';
import { ReferenceTable } from '../src/components/ReferenceTable.tsx';
import { parseRulesPack, setRules } from '../src/storage/rulesStore.ts';
import { parseOraclePack, setOraclePack } from '../src/storage/oracleStore.ts';
import { mergeOracleTranslations } from '../src/storage/privateUpdates.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { translateGeneratedText } from '../src/generators/translation.ts';
import {
  drawRareMonster,
  checkEncounterLevel,
} from '../src/domain/depthsProcedures.ts';
import { enrichReferenceTranslations } from '../scripts/enrich-reference-translations.mjs';

const path = 'outputs/morkborg-private-data.json';
const bundle = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
const local = (name: string, fn: () => void) =>
  test(name, { skip: !bundle }, fn);
const load = () => {
  setRules(bundle.library);
  setOraclePack(bundle.oracles);
  const registry = buildOracleRegistry(
    parseRulesPack(bundle.library),
    parseOraclePack(bundle.oracles),
  );
  return {
    registry,
    index: buildReferenceRegistry(registry, parseRulesPack(bundle.library)),
  };
};
const dice = (text: string) =>
  (text.match(/(?<![A-Za-z])\d*d\d+(?:[+]\d+)?/gi) ?? []).sort();

local(
  'All 55 Batch 2 definitions render complete English plus reviewed Korean, with dice and source preserved',
  () => {
    const { index, registry } = load();
    const entries = index.entries.filter((e) =>
      e.definition?.canonicalIds.some((id) =>
        [
          'reclvse.playReferences',
          'sd.playReferences',
          'depths.playReferences',
          'heretic.blackpowder',
          'mythic2.playReferences',
        ].includes(id),
      ),
    );
    assert.equal(entries.length, 55);
    let blocks = 0,
      headings = 0;
    for (const entry of entries)
      for (const block of entry.definition!.blocks) {
        const ko = block.translation?.ko;
        assert.ok(ko && /[가-힣]/u.test(ko), entry.id);
        assert.deepEqual(dice(ko), dice(block.text), entry.id);
        assert.deepEqual(
          ko.match(/DR\d+/g),
          block.text.match(/DR\d+/g),
          entry.id,
        );
        const html = renderToStaticMarkup(
          createElement(ReferenceReadingText, {
            text: block.text,
            translation: ko,
          }),
        );
        assert.match(html, /lang="ko"/);
        assert.ok(
          html.includes(
            ko
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;'),
          ),
          entry.id,
        );
        if (block.title) {
          assert.match(block.translation!.titleKo!, /[가-힣]/u);
          headings++;
        }
        blocks++;
      }
    assert.deepEqual({ blocks, headings }, { blocks: 149, headings: 117 });
    assert.deepEqual(unresolvedOracleSources(registry), []);
  },
);

local(
  'Translation-only private enrichment retains every canonical English entry, selector and die',
  () => {
    const rows = bundle.oracles.tables.map((t: any) => [
      t.id,
      t.dice,
      t.entries.map((e: any) => [e.id, e.min, e.max, e.text]),
    ]);
    assert.equal(
      createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
      'eed78fb00895c295f02942485588cfda90c0e92ec78a39edcf04842f11f0f2e3',
    );
  },
);

local(
  'Existing cached rules gain paragraph helpers without replacing manually edited blocks or translations',
  () => {
    const incoming = parseOraclePack(bundle.oracles),
      current = structuredClone(incoming);
    const t = current.tables.find((t) => t.id === 'reclvse.playReferences')!;
    for (const e of t.entries)
      for (const b of e.metadata!.blocks as any[]) delete b.translation;
    const blocks = t.entries
      .slice(0, 3)
      .map((e) => (e.metadata!.blocks as any[])[0]);
    blocks[1].translation = { ko: '사용자가 직접 다듬은 번역' };
    blocks[2].text = 'A manually changed rule.';
    const merged = mergeOracleTranslations(current, incoming).tables.find(
      (t) => t.id === 'reclvse.playReferences',
    )!;
    assert.match(
      (merged.entries[0].metadata!.blocks as any[])[0].translation.ko,
      /[가-힣]/u,
    );
    assert.equal(
      (merged.entries[1].metadata!.blocks as any[])[0].translation.ko,
      '사용자가 직접 다듬은 번역',
    );
    assert.equal(
      (merged.entries[2].metadata!.blocks as any[])[0].translation,
      undefined,
    );
    assert.equal(
      (merged.entries[2].metadata!.blocks as any[])[0].text,
      'A manually changed rule.',
    );
    assert.equal(
      blocks[0].translation,
      undefined,
      'input cache must not mutate',
    );
  },
);

local(
  'Source conflict notes and conditional Move branches have their own Korean helpers',
  () => {
    load();
    let notes = 0;
    for (const t of bundle.oracles.tables)
      for (const e of t.entries) {
        if (!t.tags.includes('batch-2') || !e.metadata?.sourceNote) continue;
        assert.match(
          translateGeneratedText(e.metadata.sourceNote),
          /[가-힣]/u,
          e.id,
        );
        assert.match(
          e.metadata.translation.guidance.sourceNote,
          /[가-힣]/u,
          e.id,
        );
        notes++;
      }
    assert.equal(notes, 14);
  },
);

local(
  'Canonical table inspection retains full mechanics and Korean for each blackpowder row',
  () => {
    const { registry } = load(),
      table = registry.tables.find((t) => t.id === 'heretic.blackpowder')!;
    const html = renderToStaticMarkup(
      createElement(ReferenceTable, {
        table,
        currentEntryIds: [],
        onChoose: () => {},
      }),
    );
    for (const entry of table.entries)
      for (const block of entry.metadata!.blocks as any[])
        assert.ok(
          html.includes(
            block.translation.ko
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;'),
          ),
          entry.id,
        );
    assert.match(html, /d6\+2/);
    assert.match(html, /재장전/);
    assert.match(html, /Presence DR14/);
  },
);

local(
  'Rare card components and Encounter Level outcomes translate without changing generated values',
  () => {
    const { registry } = load();
    const reading = drawRareMonster(registry, undefined, () => 0.2);
    for (const component of reading.rareMonster!.components.filter(
      (c) => c.classification !== 'APP_DERIVED',
    ))
      assert.match(
        translateGeneratedText(component.text),
        /[가-힣]/u,
        component.text,
      );
    const html = renderToStaticMarkup(
      createElement(ReferenceReadingText, { text: reading.blocks[0].text }),
    );
    assert.match(html, /사기/);
    assert.match(html, /공격/);
    for (const roll of [0.01, 0.35, 0.7]) {
      const r = checkEncounterLevel(registry, 'sarkash', () => roll);
      for (const block of r.blocks)
        assert.match(
          translateGeneratedText(block.text),
          /[가-힣]/u,
          block.text,
        );
    }
    assert.deepEqual(
      reading,
      drawRareMonster(registry, undefined, () => 0.2),
    );
  },
);

test('The shared reader accepts a full explicit translation without hiding English or duplicating paragraphs', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: 'First paragraph.\n\nSecond paragraph.',
      translation: '첫 문단.\n\n둘째 문단.',
    }),
  );
  assert.match(html, /First paragraph/);
  assert.match(html, /Second paragraph/);
  assert.match(html, /첫 문단/);
  assert.match(html, /둘째 문단/);
  assert.equal((html.match(/lang="ko"/g) ?? []).length, 1);
});

test('Translation enrichment rejects changed source, missing Korean and changed dice', () => {
  const source = 'Roll d6.',
    key = 'entry::block.0';
  const fixture = {
    library: { notes: {} },
    oracles: {
      tables: [
        {
          tags: ['batch-2'],
          entries: [
            {
              id: 'entry',
              metadata: { blocks: [{ title: '', text: source }] },
            },
          ],
        },
      ],
    },
  };
  const valid = {
    sourceHash: createHash('sha256').update(source).digest('hex'),
    ko: 'd6을 굴린다.',
  };
  assert.throws(
    () =>
      enrichReferenceTranslations(fixture, {
        [key]: { ...valid, sourceHash: 'wrong' },
      }),
    /source changed/,
  );
  assert.throws(
    () =>
      enrichReferenceTranslations(fixture, {
        [key]: { ...valid, ko: 'd8을 굴린다.' },
      }),
    /changed dice/,
  );
  assert.throws(
    () =>
      enrichReferenceTranslations(fixture, {
        [key]: { ...valid, ko: 'Roll d6.' },
      }),
    /missing/,
  );
  assert.equal(
    enrichReferenceTranslations(fixture, { [key]: valid }).bundle.oracles
      .tables[0].entries[0].metadata.blocks[0].text,
    source,
  );
  const titled = structuredClone(fixture);
  titled.oracles.tables[0].entries[0].metadata.blocks[0].title = 'INTERRUPT';
  const result = enrichReferenceTranslations(titled, {
    [key]: valid,
    'entry::title.0': {
      sourceHash: createHash('sha256').update('INTERRUPT').digest('hex'),
      ko: '장면 중단',
    },
  });
  assert.equal(
    result.bundle.library.notes.translations.INTERRUPT,
    undefined,
    'A scene-specific heading must not replace an unrelated Oracle word translation.',
  );
});
