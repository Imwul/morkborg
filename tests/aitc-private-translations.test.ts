import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { setRules, parseRulesPack } from '../src/storage/rulesStore.ts';
import { setOraclePack, parseOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { translateGeneratedText } from '../src/generators/translation.ts';
import { ReferenceReadingText } from '../src/components/ReferenceReadingText.tsx';
import { oracleReadingText } from '../src/domain/referenceReading.ts';
import {
  mergeOracleTranslations,
  mergePrivateLibraryUpdate,
} from '../src/storage/privateUpdates.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { CITY_REFERENCE_GROUPS } from '../src/domain/cityCrawlWorkspace.ts';
import { PLAY_REFERENCE_RULES } from '../src/domain/playReferenceRules.ts';
import { enrichAitcTranslations } from '../scripts/enrich-aitc-translations.mjs';

const path =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8'))
  : null;
const local = (name: string, fn: () => void) =>
  test(name, { skip: !fixture }, fn);
const names = new Set([
  'aitc.settlement-name-prefix',
  'aitc.settlement-name-suffix',
]);
const load = () => {
  setRules(fixture.library);
  setOraclePack(fixture.oracles);
  return buildOracleRegistry(
    parseRulesPack(fixture.library),
    parseOraclePack(fixture.oracles),
  );
};
const dice = (text: string) =>
  (text.match(/\d*d\d+(?:[+]\d+)?/gi) ?? []).sort();

local(
  'Every actual AITC non-name source row has a separate complete Korean helper; source text and selectors are unchanged',
  () => {
    const registry = load();
    const tables = fixture.oracles.tables.filter((t: { id: string }) =>
      t.id.startsWith('aitc.'),
    );
    assert.equal(tables.length, 59);
    assert.equal(
      createHash('sha256')
        .update(
          JSON.stringify(
            tables.map((t: any) => [
              t.id,
              t.dice,
              t.entries.map((e: any) => [e.id, e.min, e.max, e.text]),
            ]),
          ),
        )
        .digest('hex'),
      '55c8e6bfbf503071cb49f52f2fcef25634fdf2da124f2b4d4ff14bd3cd931b7e',
    );
    let translated = 0,
      preservedNames = 0,
      guidance = 0,
      descriptions = 0;
    for (const table of tables) {
      assert.equal(
        registry.tables.find((candidate) => candidate.id === table.id)
          ?.sourceStatus,
        'VERIFIED',
        table.id,
      );
      if (table.description) {
        assert.match(
          translateGeneratedText(table.description),
          /[가-힣]/u,
          table.id,
        );
        descriptions++;
      }
      for (const entry of table.entries) {
        if (names.has(table.id)) {
          assert.equal(entry.metadata.translation.properNamePreserved, true);
          assert.equal(entry.metadata.ko, undefined);
          preservedNames++;
          continue;
        }
        assert.match(entry.metadata.ko, /[가-힣]/u, entry.id);
        assert.match(translateGeneratedText(entry.text), /[가-힣]/u, entry.id);
        assert.notEqual(entry.text, entry.metadata.ko, entry.id);
        assert.deepEqual(dice(entry.metadata.ko), dice(entry.text), entry.id);
        assert.equal(entry.metadata.translation.origin, 'app');
        translated++;
        for (const field of [
          'conditional',
          'condition',
          'effectRule',
          'procedureNote',
        ]) {
          if (!entry.metadata[field]) continue;
          assert.match(
            entry.metadata.translation.guidance[field],
            /[가-힣]/u,
            `${entry.id}:${field}`,
          );
          assert.match(
            translateGeneratedText(entry.metadata[field]),
            /[가-힣]/u,
            `${entry.id}:${field}`,
          );
          guidance++;
        }
      }
    }
    assert.deepEqual(
      { translated, preservedNames, guidance, descriptions },
      { translated: 364, preservedNames: 72, guidance: 29, descriptions: 42 },
    );
  },
);

local(
  'Actual City street, prayer, stash and NPC encounter prompts render English plus Korean including conditions',
  () => {
    const registry = load();
    for (const id of [
      'aitc.street-adjective',
      'aitc.street-type',
      'aitc.street-exits',
      'aitc.street-contents',
      'aitc.directions-reaction',
      'aitc.pray-strong',
      'aitc.pray-failure',
      'aitc.stash-weak',
      'aitc.npc-encounters',
      'aitc.taverns',
      'aitc.notable-artefact-type',
    ]) {
      const table = registry.tables.find((candidate) => candidate.id === id)!;
      for (const entry of table.entries) {
        const html = renderToStaticMarkup(
          createElement(ReferenceReadingText, {
            text: oracleReadingText(entry),
            source: entry,
          }),
        );
        assert.match(html, /lang="ko"/u, entry.id);
        assert.ok(html.includes(entry.metadata!.ko as string), entry.id);
      }
    }
  },
);

local(
  'Fill-missing private update preserves existing English, user translations, selectors and guidance',
  () => {
    const incoming = parseOraclePack(fixture.oracles);
    const current = structuredClone(incoming);
    const table = current.tables.find((t) => t.id === 'aitc.street-contents')!;
    const entry = table.entries[4];
    entry.metadata = {
      ...entry.metadata,
      ko: '사용자가 다듬은 번역',
      translation: { guidance: { conditional: '사용자 조건 안내' } },
    };
    table.entries[0].text = 'User revised original';
    table.entries[0].metadata = { ko: '직접 쓴 인물 설정' };
    const before = structuredClone(current);
    const merged = mergeOracleTranslations(current, incoming);
    const result = merged.tables.find((t) => t.id === table.id)!;
    assert.equal(result.entries[4].metadata!.ko, '사용자가 다듬은 번역');
    assert.equal(
      (result.entries[4].metadata!.translation as any).guidance.conditional,
      '사용자 조건 안내',
    );
    assert.deepEqual(
      result.entries[0],
      before.tables.find((t) => t.id === table.id)!.entries[0],
    );
    assert.deepEqual(
      result.entries.map((e) => [e.id, e.text, e.min, e.max]),
      table.entries.map((e) => [e.id, e.text, e.min, e.max]),
    );
    const originalRules = parseRulesPack(fixture.library);
    originalRules.notes.translations = {
      private: '직접 쓴 사전',
      [table.description!]: '사용자 절차 안내',
    };
    const enrichedRules = mergePrivateLibraryUpdate(
      originalRules,
      parseRulesPack(fixture.library),
    );
    assert.equal(
      (enrichedRules.notes.translations as any)[table.description!],
      '사용자 절차 안내',
    );
    assert.equal(
      (enrichedRules.notes.translations as any).private,
      '직접 쓴 사전',
    );
    assert.deepEqual(enrichedRules.tables, originalRules.tables);
  },
);

local(
  'Every grouped City tool resolves; Grey Galth gambling opens a source-only rule with exact pages',
  () => {
    const registry = load();
    const references = buildReferenceRegistry(
      registry,
      parseRulesPack(fixture.library),
    );
    for (const group of CITY_REFERENCE_GROUPS)
      for (const id of group.ids) assert.ok(references.byId[id], id);
    const rule = PLAY_REFERENCE_RULES.find(
      (entry) => entry.id === 'feretory.three-dead-skulls',
    )!;
    assert.deepEqual(rule.pages, [56, 57]);
    assert.equal(rule.printedPage, '54–55');
    assert.equal(rule.seeFullRule, true);
    const ref = references.entries.find(
      (entry) => entry.id === `rule:${rule.id}`,
    )!;
    assert.equal(ref.action?.kind, 'rule');
    assert.match(rule.summary, /자동 실행하지 않습니다/);
  },
);
local(
  'Guidance translations bind only to the matching English condition and keep user guidance',
  () => {
    const incoming = parseOraclePack(fixture.oracles);
    const incomingTable = incoming.tables.find((table) =>
      table.entries.some(
        (entry) =>
          typeof (entry.metadata?.translation as any)?.guidance?.conditional ===
          'string',
      ),
    )!;
    const incomingEntry = incomingTable.entries.find(
      (entry) =>
        typeof (entry.metadata?.translation as any)?.guidance?.conditional ===
        'string',
    )!;
    const expectedHelper = (incomingEntry.metadata!.translation as any).guidance
      .conditional;
    const mergeCase = (conditional: string, userHelper?: string) => {
      const current = structuredClone(incoming);
      const entry = current.tables
        .find((table) => table.id === incomingTable.id)!
        .entries.find((entry) => entry.id === incomingEntry.id)!;
      entry.metadata = {
        ...entry.metadata,
        conditional,
        translation: userHelper
          ? { guidance: { conditional: userHelper } }
          : {},
      };
      const snapshot = structuredClone(current);
      const merged = mergeOracleTranslations(current, incoming);
      assert.deepEqual(current, snapshot);
      return {
        merged,
        entry: merged.tables
          .find((table) => table.id === incomingTable.id)!
          .entries.find((entry) => entry.id === incomingEntry.id)!,
      };
    };
    const customEnglish = 'User changed condition to require DR20 every hour';
    const altered = mergeCase(customEnglish);
    assert.equal(altered.entry.metadata!.conditional, customEnglish);
    assert.equal(
      (altered.entry.metadata!.translation as any).guidance.conditional,
      undefined,
    );
    setRules(fixture.library);
    setOraclePack(altered.merged);
    assert.equal(
      translateGeneratedText(customEnglish),
      '',
      'A source helper must not be attached to different English',
    );
    const unchanged = mergeCase(incomingEntry.metadata!.conditional as string);
    assert.equal(
      (unchanged.entry.metadata!.translation as any).guidance.conditional,
      expectedHelper,
    );
    const manual = mergeCase(customEnglish, '사용자가 수정한 조건 안내');
    assert.equal(manual.entry.metadata!.conditional, customEnglish);
    assert.equal(
      (manual.entry.metadata!.translation as any).guidance.conditional,
      '사용자가 수정한 조건 안내',
    );
    setOraclePack(manual.merged);
    assert.equal(
      translateGeneratedText(customEnglish),
      '사용자가 수정한 조건 안내',
    );
  },
);

test('Proper-name protection suppresses dictionary guesses but retains an explicit user Korean helper', () => {
  const source = {
    text: 'MyProperName',
    metadata: {
      ko: '사용자가 적은 발음 안내',
      translation: { properNamePreserved: true },
    },
  };
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, { text: source.text, source }),
  );
  assert.match(html, /MyProperName/);
  assert.match(html, /lang="ko"/);
  assert.match(html, /사용자가 적은 발음 안내/);
  const withoutHelper = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: source.text,
      source: {
        ...source,
        metadata: { translation: { properNamePreserved: true } },
      },
    }),
  );
  assert.doesNotMatch(withoutHelper, /lang="ko"/);
});

test('Private translation enrichment refuses stale source mappings without modifying input', () => {
  const source = {
    oracles: {
      tables: [
        {
          id: 'aitc.test',
          dice: 'd1',
          entries: [
            { id: 'aitc.test:1', text: 'Synthetic test only', min: 1, max: 1 },
          ],
        },
      ],
    },
    library: { notes: {} },
  };
  const original = structuredClone(source);
  assert.throws(
    () =>
      enrichAitcTranslations(source, [{ 'aitc.test:1': '시험 전용' }], {
        'aitc.test:1': 'wrong-hash',
      }),
    /Private source changed/,
  );
  assert.deepEqual(source, original);
});

local(
  'AITC proper-name components remain English even when a generic dictionary could translate the same word',
  () => {
    const registry = load();
    for (const table of registry.tables.filter((candidate) =>
      names.has(candidate.id),
    ))
      for (const entry of table.entries) {
        const html = renderToStaticMarkup(
          createElement(ReferenceReadingText, {
            text: entry.text,
            source: entry,
          }),
        );
        assert.doesNotMatch(html, /lang="ko"/u, entry.id);
      }
  },
);
