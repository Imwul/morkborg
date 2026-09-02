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
