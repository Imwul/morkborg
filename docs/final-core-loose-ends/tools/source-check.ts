import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { buildOracleRegistry } from '../../../src/data/oracles/index.ts';
import { parseRulesPack } from '../../../src/storage/rulesStore.ts';
import { parseOraclePack } from '../../../src/storage/oracleStore.ts';
import { buildReferenceRegistry } from '../../../src/domain/references.ts';
import {
  buildReferenceDefinitions,
  unresolvedReferenceDefinitions,
} from '../../../src/domain/referenceDefinitions.ts';
import { unresolvedOracleSources } from '../../../src/validation/oracleSourceIntegrity.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library),
  registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const index = buildReferenceRegistry(registry, rules),
  defs = buildReferenceDefinitions(registry, rules);
const inherited = JSON.parse(
  readFileSync('docs/pdf-remediation-batch-3/remaining-audit-ids.json', 'utf8'),
).entries;
const selected: Record<string, string> = {
  'core-outcast-loyalty': 'rule:core.outcasts',
  'core-outcast-wild-wickhead': 'creature:core:65:wild-wickhead',
};
for (const animal of ['dog-trained', 'dog-wild', 'horse', 'mule', 'rat-tame'])
  selected['core-purchase-' + animal] = 'definition:core.beasts:' + animal;
for (let n = 1; n <= 10; n++)
  selected['core-treasure-' + n] = `definition:core.treasures:${n}-${n}`;
for (const [key, name] of Object.entries({
  goblin: 'seth',
  scum: 'bent',
  berserker: 'zukuma',
  wraith: 'wrat',
  'blood-drenched-skeleton': 'belze',
  'undead-weak-necromancer': 'lich',
  troll: 'arbint',
  zombie: 'nodh',
  'undead-doll': 'lady-porcelain',
  grotesque: 'thinx',
  'wickhead-knife-wielder': 'aland',
  wyvern: 'eulotha',
}))
  selected['core-valuation-' + key] =
    'definition:core.creatureValuations:' + name;
const rows = Object.entries(selected).map(([needId, referenceId]) => {
  const prior = inherited.find((r: any) => r.needId === needId);
  assert.ok(prior, needId);
  const entry = index.byId[referenceId];
  assert.ok(entry?.available, referenceId);
  assert.ok(entry.sourceRefs.length);
  for (const s of entry.sourceRefs) assert.equal(s.status, 'VERIFIED');
  return {
    needId,
    before: prior.classification,
    after: 'RESOLVED',
    referenceId,
    title: entry.title,
    sources: entry.sourceRefs.map(
      ({ bookId, pdfPage, printedPage, tableId, entryId, status }) => ({
        bookId,
        pdfPage,
        printedPage,
        tableId,
        entryId,
        status,
      }),
    ),
    evidence:
      'Targeted definition/source tests plus actual browser checks of each workflow. All names/values tested programmatically; browser samples are listed separately.',
  };
});
assert.equal(rows.length, 29);
const unresolved = [
  ...unresolvedOracleSources(registry),
  ...unresolvedReferenceDefinitions(defs, registry),
];
assert.deepEqual(unresolved, []);
writeFileSync(
  'docs/final-core-loose-ends/RECHECK.json',
  JSON.stringify(
    {
      basis:
        'Batch 3 inherited classifications; only these 29 selected IDs rechecked. No inherited supplement pass.',
      rows,
      deferred: [
        {
          needId: 'core-catastrophe-repeat',
          before: 'PARTIAL',
          after: 'PARTIAL',
          decision:
            'DEFER: complete global repeat-result consequences are absent; not a lookup-only repair.',
        },
      ],
    },
    null,
    2,
  ) + '\n',
);
writeFileSync(
  'docs/final-core-loose-ends/SOURCE-INTEGRITY.json',
  JSON.stringify(
    {
      selectedReferences: 29,
      treasureDefinitions: 10,
      animalPurchaseDefinitions: 5,
      valuationDefinitions: 12,
      outcastRule: 1,
      wildWickhead: 1,
      canonicalTables: registry.tables.length,
      unresolved,
      UNSOURCED: 0,
      scope:
        'Newly exposed source-backed references plus existing automated registry validation. This is not a fresh book audit.',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({ selected: rows.length, unresolved, UNSOURCED: 0 }),
);
