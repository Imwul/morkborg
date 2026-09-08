import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
  contextReferences,
} from '../src/domain/references.ts';
import { CORE_PLAY_RULES } from '../src/domain/corePlayRules.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../src/domain/referenceDefinitions.ts';
const pack = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(pack.library);
const oracles = buildOracleRegistry(rules, parseOraclePack(pack.oracles));
const index = buildReferenceRegistry(oracles, rules);
const rule = (id: string) => index.byId['rule:core.' + id];
const top = (q: string) => searchReferences(index, q)[0]?.id;

test('Batch 3 DR lookup preserves the complete seven-step source ladder and creature tests', () => {
  const text = rule('tests').summary;
  for (const dr of [6, 8, 10, 12, 14, 16, 18])
    assert.match(text, new RegExp(`(?:DR\\s*)?${dr}\\b`));
  for (const word of [
    'so simple people laugh at you for failing',
    'routine but some chance of failure',
    'pretty simple but not simple enough to not roll',
    'normal',
    'difficult',
    'really hard',
    'should not be possible',
  ])
    assert.ok(text.includes(word), word);
  assert.match(text, /d20/);
  assert.match(text, /creature/i);
});
test('Core round and movement stay abstract, with one action plus room traversal and usual ten rounds per minute', () => {
  const r = rule('round');
  assert.match(r.summary, /10|ten/);
  assert.match(r.summary, /minute/);
  assert.match(r.summary, /attack.*Power|Power.*attack/s);
  assert.match(r.summary, /room/);
  assert.doesNotMatch(r.summary, /\b(?:30|6|9) (?:metres|meters|feet)\b/);
  assert.equal(r.sourceRefs[0].bookId, 'core');
  assert.deepEqual(r.sourceRefs[0].pdfPage, [31]);
});
test('Core rest differentiates food/water recovery, two-day food deprivation and daily infection damage', () => {
  const text = rule('rest').summary;
  assert.match(text, /d4 HP/);
  assert.match(text, /d6 HP/);
  assert.match(text, /food.*drink/s);
  assert.match(text, /two days|2 days/);
  assert.match(text, /infection|infected/i);
  assert.doesNotMatch(text, /d4.*thirst|water.*(?:two|2) days.*d4/s);
});
test('Carrying and advancement preserve ability-based capacity and source dice without new tracking', () => {
  assert.match(rule('carrying').summary, /Strength.*8/);
  assert.match(rule('carrying').summary, /\+2/);
  assert.match(rule('carrying').summary, /twice|double/);
  const advancement = rule('improvement').summary;
  assert.match(advancement, /6d10/);
  assert.match(advancement, /d6/);
  assert.match(advancement, /[−-]3/);
  assert.match(advancement, /\+6/);
  assert.ok(
    rule('improvement').canonicalIds.includes('core.gettingBetterDebris'),
  );
});
test('Core Broken threshold has one consistent canonical answer and retains its existing outcome table', () => {
  const text = rule('broken').summary;
  assert.match(text, /0.*Broken|Broken.*0/s);
  assert.match(text, /negative|below zero/i);
  assert.ok(rule('broken').canonicalIds.includes('core.broken'));
  for (const q of ['Broken', 'HP 0', 'negative HP', '음수 HP', '죽음'])
    assert.equal(top(q), 'rule:core.broken', q);
});
test('Unqualified Core play terms rank Core while explicitly named SD and RECLVSE variants remain separate', () => {
  const cases: Record<string, string[]> = {
    tests: ['DR', 'difficulty', '난이도', '어려움'],
    round: ['round', 'round duration', 'movement', '턴', '라운드', '몇 미터'],
    rest: [
      'starvation',
      'thirst',
      'infection',
      '굶주림',
      '식량 없음',
      '갈증',
      '감염',
      'healing',
      '회복',
    ],
    flee: ['flee', '도망', '도주'],
    'crit-fumble': ['critical', 'fumble', '치명타'],
  };
  for (const [id, queries] of Object.entries(cases))
    for (const q of queries) assert.equal(top(q), 'rule:core.' + id, q);
  assert.equal(top('SD flee'), 'rule:sd.flee-combat');
  assert.equal(top('RECLVSE Morale'), 'rule:reclvse.morale');
  assert.equal(top('RCL Infection'), 'rule:reclvse.infection');
});
test('Core flee reference explains the actual ability and keeps the solo Move an optional separate reference', () => {
  assert.match(rule('flee').summary, /Agility/);
  assert.doesNotMatch(rule('flee').summary, /DR11|2d20|1[01]\s*\+/);
  assert.ok(
    relatedReferences(index, rule('flee').id).some(
      (e) => e.id === 'rule:sd.flee-combat',
    ),
  );
  assert.ok(
    relatedReferences(index, rule('reaction-morale').id).some(
      (e) => e.id === 'rule:core.flee',
    ),
  );
});
test('Daily Power uses are restored in casting and the Priest exception points to the canonical class', () => {
  assert.match(rule('casting').summary, /Presence.*d4/);
  assert.match(rule('casting').summary, /morning/);
  assert.match(rule('casting').summary, /DR12/);
  assert.match(rule('casting').summary, /d2 HP/);
  const priest = index.entries.find(
    (e) => e.definition?.kind === 'Class' && e.title === 'Heretical Priest',
  )!;
  for (const id of ['casting', 'armor-shield'])
    assert.ok(
      relatedReferences(index, rule(id).id, 30).some((e) => e.id === priest.id),
      id,
    );
  assert.match(rule('armor-shield').summary, /Heretical Priest/);
});
test('Service lookup retains both repair costs, original-tier cap and source ammunition quantities', () => {
  const text = rule('services').summary;
  for (const price of [
    '3s',
    '1s',
    '2s',
    '20–40s',
    '30–60s',
    '5–15s',
    '25s',
    '40s',
  ])
    assert.ok(text.includes(price), price);
  assert.match(text, /20 arrows.*10s/);
  assert.match(text, /10 bolts.*10s/);
  assert.match(text, /original tier/i);
  assert.ok(rule('services').authority?.some((a) => a.kind === 'APP_POLICY'));
  assert.deepEqual(rule('services').sourceRefs[0].pdfPage, [25, 26, 31]);
});
test('Character context promotes carrying and casting without increasing quick-tool count', () => {
  const refs = contextReferences(index, 'character');
  assert.equal(refs.length, 6);
  assert.ok(refs.some((e) => e.id === 'rule:core.carrying'));
  assert.ok(refs.some((e) => e.id === 'rule:core.casting'));
  assert.ok(!refs.some((e) => e.id === 'oracle:core.corpsePlundering'));
});
test('Each modified Core reminder keeps separate Korean, verified pages and one canonical ID', () => {
  for (const seed of CORE_PLAY_RULES) {
    const r = index.byId['rule:' + seed.id];
    assert.ok(r);
    assert.equal(index.entries.filter((e) => e.id === r.id).length, 1);
    assert.match(r.summaryTranslationKo!, /[가-힣]/);
    assert.doesNotMatch(r.summary, /[가-힣]/);
    for (const s of r.sourceRefs) {
      assert.ok(oracles.books.some((b) => b.id === s.bookId));
      assert.ok(s.pdfPage);
      assert.equal(s.status, 'VERIFIED');
    }
  }
});
test('Batch 3 source integrity preserves all canonical table attestations and resolves new definitions', () => {
  assert.deepEqual(unresolvedOracleSources(oracles), []);
  assert.deepEqual(
    unresolvedReferenceDefinitions(
      buildReferenceDefinitions(oracles, rules),
      oracles,
    ),
    [],
  );
  assert.ok(
    index.entries.every(
      (e) => !e.sourceRefs.some((s) => s.status === ('UNSOURCED' as never)),
    ),
  );
});

test('An unspecified Core Scroll offers source-table choices without inventing or changing its identity', () => {
  const scroll = index.entries.find(
    (e) => e.definition?.kind === 'Equipment' && e.title === 'Scroll',
  )!;
  assert.ok(scroll);
  const next = relatedReferences(index, scroll.id, 10).map((e) => e.id);
  for (const id of [
    'rule:core.casting',
    'oracle:core.sacred',
    'oracle:core.unclean',
  ])
    assert.ok(next.includes(id));
  assert.ok(
    !scroll.definition!.blocks.some((b) =>
      /Daemon of Capillaries/.test(b.text),
    ),
  );
});
