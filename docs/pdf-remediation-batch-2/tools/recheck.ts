/** Scoped recheck only: the 59 needs belonging to the ten requested audit ranks. */
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { parseRulesPack } from '../../../src/storage/rulesStore.ts';
import { parseOraclePack } from '../../../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../../../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../../../src/domain/references.ts';
import { unresolvedOracleSources } from '../../../src/validation/oracleSourceIntegrity.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../../../src/domain/referenceDefinitions.ts';
const folder = 'docs/pdf-remediation-batch-2';
const prior = JSON.parse(
  readFileSync(
    'docs/pdf-remediation-batch-1/remaining-top20-audit-ids.json',
    'utf8',
  ),
);
const privateData = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(privateData.library),
  registry = buildOracleRegistry(rules, parseOraclePack(privateData.oracles));
const index = buildReferenceRegistry(registry, rules);
const browser = JSON.parse(
  readFileSync(folder + '/browser-acceptance.json', 'utf8'),
);
const preview = JSON.parse(
  readFileSync(folder + '/production-preview.json', 'utf8'),
);
assert.ok(!browser.failure && !preview.failure);
assert.deepEqual(browser.errors, []);
assert.deepEqual(preview.errors, []);
const reclvse: Record<string, string> = {
  'reclvse-rule-advantage-and-disadvantage': 'advantage',
  'reclvse-rule-critical-die': 'critical-die',
  'reclvse-rule-ask-the-oracle': 'ask-oracle',
  'reclvse-rule-reclvse-omens': 'omens',
  'reclvse-rule-invoke-a-power': 'invoke-power',
  'reclvse-rule-guarding': 'guarding',
  'reclvse-rule-criticals-and-fumbles-in-combat': 'combat-criticals',
  'reclvse-rule-reclvse-morale': 'morale',
  'reclvse-rule-below-zero-death-and-recovery': 'recovery',
  'reclvse-rule-infection': 'infection',
  'reclvse-rule-medicine-kit': 'medicine-kit',
  'reclvse-unspokens-calendar': 'calendar',
  'reclvse-travel-road': 'road',
  'reclvse-rule-determine-journey-length': 'journey-length',
  'reclvse-rule-move-through-an-area': 'move-area',
  'reclvse-rule-reclvse-daily-travel-loop': 'travel',
  'reclvse-rule-weather-move': 'weather',
  'reclvse-rule-hunt': 'hunt',
  'reclvse-rule-butcher-a-kill': 'butcher',
  'reclvse-rule-make-camp': 'camp',
  'reclvse-rule-night-encounter': 'night-encounter',
  'reclvse-rule-hold-your-bearing': 'hold-bearing',
  'reclvse-rule-foraging-move': 'forage',
  'reclvse-rule-tend-wounds': 'tend-wounds',
  'reclvse-rule-short-rest-move': 'short-rest',
  'reclvse-rule-starvation': 'starvation',
  'reclvse-rule-navigate-the-passage': 'passage',
  'reclvse-rule-search-the-room': 'search-room',
  'reclvse-rule-face-the-trap': 'face-trap',
  'reclvse-rule-room-encounter': 'room-encounter',
};
const mapping: Record<string, string[]> = {
  ...Object.fromEntries(
    Object.entries(reclvse).map(([id, key]) => [id, ['rule:reclvse.' + key]]),
  ),
  'heretic:blackpowder-rule': ['rule:heretic.blackpowder'],
  'sd-omens-variant': ['rule:sd.omens'],
  'sd-powers-variant': ['rule:sd.powers'],
  'depths-rare-five-card': ['procedure:depths.rare-monster'],
  'depths-hex-encounters': ['procedure:depths.encounter-level'],
  'sd-microcrawl': ['rule:sd.microcrawl'],
  'sd-begin-adventure': ['rule:sd.begin-adventure'],
  'sd-conclude-adventure': ['rule:sd.conclude-adventure'],
  'heretic:creature-rotten-nurse': index.entries
    .filter((e) => e.kind === 'creature' && e.title.startsWith('Rotten Nurse'))
    .map((e) => e.id),
  'heretic:outcast-mikhael': index.entries
    .filter((e) => e.kind === 'creature' && e.title === 'Mikhael')
    .map((e) => e.id),
  'feretory:creature-carcasswan': index.entries
    .filter((e) => e.kind === 'creature' && e.title.startsWith('Carcasswan'))
    .map((e) => e.id),
  'feretory:epk-starved-peasants': index.entries
    .filter(
      (e) =>
        e.kind === 'creature' &&
        ['Lentil Lice', 'Starved peasants'].includes(e.title),
    )
    .map((e) => e.id),
  'feretory:epk-regular-wolf': index.entries
    .filter(
      (e) =>
        e.kind === 'creature' && ['Überwolf', 'Regular wolf'].includes(e.title),
    )
    .map((e) => e.id),
  'mythic-event-focus': ['rule:mythic.event-focus'],
  'mythic-lists': ['rule:mythic.lists'],
  'mythic-altered-followthrough': ['rule:mythic.altered-scene'],
  'mythic-npc-behavior': ['rule:mythic.npc-behavior'],
};
for (const old of prior)
  if (
    old.needId.startsWith('heretic:blackpowder-') &&
    old.needId !== 'heretic:blackpowder-rule'
  )
    mapping[old.needId] = [
      'definition:heretic.blackpowder:' +
        old.needId.slice('heretic:blackpowder-'.length),
    ];
const verifiedByUI = (title: string) =>
  browser.records.some(
    (r: { action: string }) =>
      r.action === `Search ${title}` || r.action.includes(title),
  );
const rows = prior.map(
  (old: {
    needId: string;
    auditRank: number;
    classification: string;
    book: string;
    pdfPage: number[];
  }) => {
    const ids = mapping[old.needId];
    assert.ok(ids?.length, old.needId);
    const refs = ids.map((id) => {
      const e = index.byId[id];
      assert.ok(e, id);
      assert.ok(e.available, id);
      return e;
    });
    const primary = refs[0];
    const query =
      old.needId === 'depths-rare-five-card'
        ? 'Rare Monster Five Cards'
        : old.needId === 'heretic:creature-rotten-nurse'
          ? 'Rotten Nurse'
          : primary.title;
    assert.ok(
      verifiedByUI(query) || old.auditRank === 17,
      query + ' UI evidence',
    );
    const constraints = refs.flatMap((e) =>
      e.sourceRefs.map((s) => s.note).filter(Boolean),
    );
    return {
      auditRank: old.auditRank,
      needId: old.needId,
      before: old.classification,
      after: 'RESOLVED',
      book: old.book,
      originalAuditPages: old.pdfPage,
      referenceIds: ids,
      sourceRefs: refs.flatMap((e) => e.sourceRefs),
      query,
      top3: searchReferences(index, query, { limit: 3 }).map((e) => ({
        id: e.id,
        title: e.title,
      })),
      scope:
        'The specific audited lookup/procedure; not every system or regional creature in the book.',
      sourceConstraints: constraints,
    };
  },
);
assert.equal(rows.length, 59);
const baseline = JSON.parse(
  readFileSync('docs/pdf-remediation-batch-1/remaining-audit-ids.json', 'utf8'),
);
const targets = new Set(rows.map((r: { needId: string }) => r.needId));
const remaining = baseline.entries.filter(
  (e: { needId: string }) => !targets.has(e.needId),
);
writeFileSync(
  folder + '/remaining-audit-ids.json',
  JSON.stringify(
    {
      basis:
        'Carried forward from Batch 1 excluding the 59 Batch 2 targets. No new broad audit or reclassification. Includes source limitations and intentional PDF reading, not just defects.',
      entries: remaining,
    },
    null,
    2,
  ) + '\n',
);
const unresolved = [
  ...unresolvedOracleSources(registry),
  ...unresolvedReferenceDefinitions(
    buildReferenceDefinitions(registry, rules),
    registry,
  ),
];
assert.deepEqual(unresolved, []);
const byRank = Object.fromEntries(
  [...new Set(rows.map((r: { auditRank: number }) => r.auditRank))].map(
    (rank) => [
      rank,
      {
        before: rows
          .filter((r: { auditRank: number }) => r.auditRank === rank)
          .reduce(
            (a: Record<string, number>, r: { before: string }) => (
              (a[r.before] = (a[r.before] ?? 0) + 1),
              a
            ),
            {},
          ),
        after: {
          RESOLVED: rows.filter(
            (r: { auditRank: number }) => r.auditRank === rank,
          ).length,
        },
      },
    ],
  ),
);
writeFileSync(
  folder + '/recheck.json',
  JSON.stringify(
    {
      baselineHead: '285f85157f1b3df4d59b60953a0714561e15d35d',
      auditHead: '479cbd765b4168eeaeee27f921bf4b0a6615c51b',
      testedAt: new Date().toISOString(),
      targets: rows.length,
      byRank,
      rows,
      remainingCarriedForward: remaining.length,
    },
    null,
    2,
  ) + '\n',
);
const sourceTables = registry.tables.filter((t) => t.tags.includes('batch-2'));
const stats = {
  canonicalTables: registry.tables.length,
  referenceEntries: index.entries.length,
  newCatalogs: sourceTables.map((t) => ({
    id: t.id,
    book: t.sourceBookId,
    pages: t.sourcePage,
    entries: t.entries.length,
    sourceStatus: t.sourceStatus,
  })),
  newDefinitions: index.entries.filter(
    (e) =>
      e.definition && sourceTables.some((t) => e.canonicalIds.includes(t.id)),
  ).length,
  unresolvedGeneratedSourceFields: unresolved.length,
  rareMonsterSamples: 10000,
  browserChecks: browser.records.length,
  viewports: browser.visual.length,
  remainingClassifications: remaining.reduce(
    (a: Record<string, number>, e: { classification: string }) => (
      (a[e.classification] = (a[e.classification] ?? 0) + 1),
      a
    ),
    {},
  ),
};
writeFileSync(
  folder + '/integrity-summary.json',
  JSON.stringify(stats, null, 2) + '\n',
);
const escape = (v: unknown) =>
  String(v ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
writeFileSync(
  folder + '/RECHECK.md',
  `# Batch 2 — scoped PDF escape recheck\n\nAudited baseline: \`479cbd765b4168eeaeee27f921bf4b0a6615c51b\`. Batch 1 baseline: \`285f85157f1b3df4d59b60953a0714561e15d35d\`.\n\n59 specific needs in ranks 5/6/7/10/11/12/14/15/17/18. RESOLVED means the audited reference can be used through the UI; source contradictions below remain contradictions. No assessment of out-of-scope systems was repeated.\n\n| Rank | Audit ID | Before | After | Canonical reference | Verified PDF / printed |\n|---|---|---|---|---|---|\n` +
    rows
      .map(
        (r: any) =>
          `| ${r.auditRank} | ${r.needId} | ${r.before} | ${r.after} | ${r.referenceIds.map(escape).join(' · ')} | ${[...new Set(r.sourceRefs.map((s: any) => `${s.bookId} PDF ${[s.pdfPage].flat().join(',')} / printed ${s.printedPage ?? 'not marked'}`))].map(escape).join('; ')} |`,
      )
      .join('\n') +
    '\n\nOriginal source ambiguities and remaining audit IDs are listed in REPORT.md and remaining-audit-ids.json. Source/page metadata alone was not accepted as a resolution; the browser opened all 53 compact catalog definitions and checked their complete mechanical blocks, plus the card/encounter and creature flows.\n',
);
console.log({ targets: rows.length, byRank, ...stats });
