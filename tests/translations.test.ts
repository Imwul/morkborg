import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  getRules,
  setRules,
  type RuleEntry,
} from '../src/storage/rulesStore.ts';
import { getOraclePack, setOraclePack } from '../src/storage/oracleStore.ts';
import { translateGeneratedText as ko } from '../src/generators/translation.ts';
import { regions } from '../src/data/regions.ts';
import {
  hasRuleTranslations,
  mergeRuleTranslations,
} from '../src/storage/ruleTranslations.ts';
const available =
  existsSync('public/rules/library.json') &&
  existsSync('public/rules/oracles.json');
if (available) {
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
  setOraclePack(JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')));
}
const privateData = {
  skip: !available || !getRules()?.notes.translationEdition,
};
test(
  'every private table and nested followup has a Korean translation or preserved proper name',
  privateData,
  () => {
    let count = 0;
    const check = (entries: RuleEntry[]) => {
      for (const e of entries) {
        assert.equal(typeof e.meta.ko, 'string', e.text);
        if (e.text) assert.ok(e.meta.ko, e.text);
        count++;
        if (e.followup) check(e.followup);
      }
    };
    Object.values(getRules()!.tables).forEach((t) => check(t.entries));
    for (const t of getOraclePack()!.tables)
      for (const e of t.entries) {
        assert.equal(typeof e.metadata?.ko, 'string', t.id + ':' + e.text);
        if (e.text) assert.ok(e.metadata?.ko);
        count++;
      }
    assert.ok(count > 11000);
  },
);
test('untranslated sentences never masquerade as Korean after replacing one or two terms', () => {
  assert.equal(
    ko(
      'An unlisted device alters attack rolls but leaves defence rolls untouched.',
    ),
    '',
  );
  assert.equal(ko('Some unknown sentence about Toughness and Agility.'), '');
  assert.equal(ko('Bite — Attack DR10'), '물기 — 공격 DR10');
});
test(
  'entry metadata and nested followups translate without the auxiliary dictionary',
  privateData,
  () => {
    const before = getRules()!;
    const pack = structuredClone(before);
    pack.notes = {};
    pack.tables['core.sparks'].entries[0] = {
      text: 'A test-only signal',
      weight: 1,
      meta: { ko: '시험용 신호' },
      followup: [
        {
          text: 'A nested test-only signal',
          weight: 1,
          meta: { ko: '중첩 시험용 신호' },
        },
      ],
    };
    try {
      setRules(pack);
      assert.equal(ko('A test-only signal'), '시험용 신호');
      assert.equal(ko('A nested test-only signal'), '중첩 시험용 신호');
    } finally {
      setRules(before);
    }
  },
);
test(
  'legacy translation upgrade preserves all original rules, weights and private additions',
  privateData,
  () => {
    const latest = getRules()!;
    const old = structuredClone(latest);
    old.notes = { customNote: 'keep this' };
    const strip = (rows: RuleEntry[]) =>
      rows.forEach((row) => {
        delete row.meta.ko;
        if (row.followup) strip(row.followup);
      });
    Object.values(old.tables).forEach((table) => strip(table.entries));
    old.tables['core.sparks'].entries[0].weight = 7;
    old.tables['core.sparks'].entries.push({
      text: 'My own signal',
      weight: 3,
      meta: {},
    });
    assert.equal(hasRuleTranslations(old), false);
    const upgraded = mergeRuleTranslations(old, latest);
    assert.equal(upgraded.notes.customNote, 'keep this');
    assert.equal(upgraded.tables['core.sparks'].entries[0].weight, 7);
    assert.equal(
      typeof upgraded.tables['core.sparks'].entries[0].meta.ko,
      'string',
    );
    assert.deepEqual(
      upgraded.tables['core.sparks'].entries.at(-1),
      old.tables['core.sparks'].entries.at(-1),
    );
    assert.equal(old.tables['core.sparks'].entries[0].meta.ko, undefined);
    const removeTranslations = (pack: typeof old) => {
      const copy = structuredClone(pack);
      delete copy.notes.translationEdition;
      delete copy.notes.translations;
      Object.values(copy.tables).forEach((table) => strip(table.entries));
      return copy;
    };
    assert.deepEqual(removeTranslations(upgraded), removeTranslations(old));
  },
);
test(
  'a legacy loaded pack displays full translations immediately after a current import',
  privateData,
  () => {
    const latest = getRules()!,
      oracle = getOraclePack()!;
    const old = structuredClone(latest);
    old.notes = {};
    const strip = (rows: RuleEntry[]) =>
      rows.forEach((row) => {
        delete row.meta.ko;
        if (row.followup) strip(row.followup);
      });
    Object.values(old.tables).forEach((table) => strip(table.entries));
    try {
      setOraclePack({
        schemaVersion: 1,
        books: [],
        tables: [],
        procedures: [],
      });
      setRules(old);
      const savedValue = 'Thirteen priests are missing';
      assert.equal(ko(savedValue), '');
      setRules(mergeRuleTranslations(old, latest));
      assert.equal(ko(savedValue), '사제 열셋이 실종되었다');
      assert.equal(savedValue, 'Thirteen priests are missing');
    } finally {
      setRules(latest);
      setOraclePack(oracle);
    }
  },
);
test(
  'generated compounds, rolled quantities and mechanical text translate without changing dice',
  privateData,
  () => {
    assert.match(
      ko(
        'crawling like liquid; long, wispy hair; spasmodically skittering close.',
      ),
      /[가-힣]/,
    );
    assert.match(ko('Light armor −d2'), /경갑.*d2/);
    assert.equal(ko('4 days of food'), '4일치 식량');
    assert.equal(
      ko('Decoctions: 3 doses total · 24h'),
      '탕약: 총 3회분 · 24시간',
    );
    assert.match(
      ko('A pet monkey [3 creature(s); HP: 4, 5, 6]'),
      /3 마리; HP: 4, 5, 6/,
    );
    assert.equal(ko('The Qzxqv Urrqz'), '');
    assert.match(ko('Bite — Attack DR10'), /물기.*공격 DR10/);
  },
);
test(
  'specified regional proper nouns remain atomic with accents intact',
  privateData,
  () => {
    for (const r of regions) assert.equal(ko(r.name), r.name);
    assert.equal(ko('Jila Migle'), 'Jila Migle');
    assert.equal(ko('Sigfúm'), 'Sigfúm');
  },
);
