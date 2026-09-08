import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseRulesPack } from '../../../src/storage/rulesStore.ts';
import { parseOraclePack } from '../../../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../../../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../../../src/domain/references.ts';
import { CORE_PLAY_RULES } from '../../../src/domain/corePlayRules.ts';
import { unresolvedOracleSources } from '../../../src/validation/oracleSourceIntegrity.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../../../src/domain/referenceDefinitions.ts';
const dir = 'docs/pdf-remediation-batch-3';
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const pack = json('outputs/morkborg-private-data.json'),
  rules = parseRulesPack(pack.library),
  oracles = buildOracleRegistry(rules, parseOraclePack(pack.oracles)),
  index = buildReferenceRegistry(oracles, rules);
const prior = json('docs/pdf-remediation-batch-2/remaining-audit-ids.json');
const selection = json(dir + '/selection.json');
const browser = json(dir + '/browser-after.json'),
  scenario = json(dir + '/core-scenario.json'),
  links = json(dir + '/batch3-links-browser.json');
assert.ok(!scenario.failure);
assert.deepEqual(scenario.errors, []);
assert.deepEqual(browser.errors, []);
assert.ok(browser.campaignUnchanged);
const mapping: Record<string, [string, string]> = {
  'core-difficulty-scale': ['rule:core.tests', 'DR'],
  'core-round-duration': ['rule:core.round', 'round duration'],
  'core-starvation': ['rule:core.rest', 'starvation'],
  'core-infection': ['rule:core.rest', 'infection'],
  'core-scroll-restrictions': ['rule:core.armor-shield', 'armor'],
  'core-starting-item-bomb': ['definition:core.gearA:10-10', 'Bomb'],
  'core-starting-item-life-elixir': [
    'definition:core.gearB:1-1',
    'Life elixir',
  ],
  'core-starting-item-small-vicious-dog': [
    'definition:core.gearB:3-3',
    'Small vicious dog',
  ],
  'core-starting-item-monkeys': ['definition:core.gearB:4-4', 'Monkeys'],
};
for (const id of selection.selectedAuditIds)
  if (id.startsWith('core-service-') || id.startsWith('core-purchase-'))
    mapping[id] = [
      'rule:core.services',
      id.endsWith('20-arrows')
        ? '20 arrows'
        : id.endsWith('10-bolts')
          ? '10 bolts'
          : 'armor repair',
    ];
const rows = selection.selectedAuditIds.map((id: string) => {
  const old = prior.entries.find((e: any) => e.needId === id);
  assert.ok(old, id);
  const [referenceId, query] = mapping[id],
    ref = index.byId[referenceId];
  assert.ok(ref?.available, id);
  const check = browser.records.find((e: any) => e.query === query);
  assert.ok(check?.hasReading, id);
  assert.ok(check.sourceClosed, id);
  assert.equal(searchReferences(index, query)[0]?.id, referenceId, query);
  assert.ok(ref.sourceRefs.every((s) => s.status === 'VERIFIED' && s.pdfPage));
  return {
    needId: id,
    book: old.book,
    originalPages: old.pdfPage,
    before: old.classification,
    after: 'RESOLVED',
    referenceId,
    query,
    sourceRefs: ref.sourceRefs,
    evidence: [
      'browser-after.json',
      'core-scenario.json',
      ...(id.startsWith('core-starting') ? ['batch3-links-browser.json'] : []),
    ],
    ...(id.startsWith('core-purchase')
      ? {
          discrepancy:
            'Inherited MISSING was already stale: Batch 1 Bow/Crossbow definition exposes ammunition price. Browser baseline found those entries. Batch 3 adds a direct common price destination; do not claim newly authored ammunition mechanics.',
        }
      : {}),
  };
});
const closed = new Set(rows.map((r: any) => r.needId));
const remaining = prior.entries.filter((r: any) => !closed.has(r.needId));
const count = (es: any[], key: string) =>
  es.reduce(
    (a: Record<string, number>, e) => ((a[e[key]] = (a[e[key]] ?? 0) + 1), a),
    {},
  );
writeFileSync(
  dir + '/remaining-audit-ids.json',
  JSON.stringify(
    {
      basis:
        'Inherited Batch 2 classifications minus 19 Batch 3 browser-verified selected resolutions. Untouched IDs were triaged, not freshly source/browser re-audited; the generic Scroll dependency closes no additional ID.',
      entries: remaining,
    },
    null,
    2,
  ) + '\n',
);
const unresolved = [
  ...unresolvedOracleSources(oracles),
  ...unresolvedReferenceDefinitions(
    buildReferenceDefinitions(oracles, rules),
    oracles,
  ),
];
assert.deepEqual(unresolved, []);
const integrity = {
  canonicalTables: oracles.tables.length,
  referenceEntries: index.entries.length,
  targetedBilingualQuickRules: CORE_PLAY_RULES.length,
  selectedAuditIds: rows.length,
  uniqueNeedsIncludingDependenciesUpperBound:
    selection.totalNeedsIncludingDependenciesUpperBound,
  unresolved,
  UNSOURCED: 0,
  note: '0 unresolved source definitions/attestations in loaded production registry. No generator or source-table data changed. Quick-rule summaries checked against targeted supplied pages; Korean remains separate.',
};
writeFileSync(
  dir + '/integrity-summary.json',
  JSON.stringify(integrity, null, 2) + '\n',
);
writeFileSync(
  dir + '/recheck.json',
  JSON.stringify(
    {
      baselineHead: selection.baselineHead,
      rows,
      beforeCounts: count(rows, 'before'),
      afterCounts: count(rows, 'after'),
      remainingInherited: remaining.length,
      remainingCounts: count(remaining, 'classification'),
      browserQueries: browser.records.length,
      coreScenarioInteractions: scenario.totalInteractions,
    },
    null,
    2,
  ) + '\n',
);
const md = [
  '# Batch 3 — selected recheck',
  '',
  'Only the 19 selected IDs receive new classifications. Source verification and actual browser behavior are both required; inherited classifications elsewhere remain untouched.',
  '',
  '| Audit ID | Inherited before | After | Canonical reference | UI query |',
  '|---|---|---|---|---|',
  ...rows.map(
    (r: any) =>
      `| ${r.needId} | ${r.before} | ${r.after} | ${r.referenceId} | ${r.query} |`,
  ),
  '',
  'Two ammunition rows were stale inherited MISSING findings: their prices already appeared in Batch 1 Bow/Crossbow definitions. They count as newly verified closures, not newly written rules.',
  '',
  `Remaining inherited classifications: ${JSON.stringify(count(remaining, 'classification'))}; total ${remaining.length}.`,
  '',
  'The daily Powers-use regression and generic Scroll continuation are documented dependencies, not extra audit closures.',
];
writeFileSync(dir + '/RECHECK.md', md.join('\n') + '\n');
console.log(integrity);
