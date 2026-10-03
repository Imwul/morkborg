import { readFileSync, writeFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles';
import { oracleSourceFingerprint } from '../src/data/oracles/sourceEvidence';
import { setRules, type RulesPack } from '../src/storage/rulesStore';
import type { OraclePack } from '../src/domain/oracle';
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
) as { library: RulesPack; oracles: OraclePack };
setRules(bundle.library);
const registry = buildOracleRegistry(bundle.library, bundle.oracles);
const changed = JSON.parse(
  readFileSync('outputs/rule-fidelity-changed-tables.json', 'utf8'),
) as string[];
const target = 'src/data/oracles/sourceEvidence.json';
const attestations = JSON.parse(readFileSync(target, 'utf8'));
for (const tableId of changed) {
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table) throw new Error(`Missing inspected table ${tableId}`);
  const prior = attestations[tableId];
  attestations[tableId] = {
    fingerprint: oracleSourceFingerprint(table),
    partialEntryIds: prior?.partialEntryIds ?? [],
    composedEntryIds: prior?.composedEntryIds ?? table.entries.map((e) => e.id),
    derivedEntryIds: prior?.derivedEntryIds ?? [],
  };
}
writeFileSync(target, JSON.stringify(attestations) + '\n');
console.log(`Attested ${changed.length} inspected private projections.`);
// Only the statblock inspected in Core Full PDF 79 (printed III) is added.
const creatureTarget = 'src/generators/creatureSourceEvidence.json';
const creatureEvidence = JSON.parse(readFileSync(creatureTarget, 'utf8')) as {
  records: Record<string, string[]>;
  sourceFields: string[];
};
const creature = bundle.library.creatures.find(
  (c) => c.id === 'core-full.rotblack.nesting-death',
);
if (!creature) throw new Error('Missing inspected Nesting Death statblock');
const text = JSON.stringify(
  Object.fromEntries(
    creatureEvidence.sourceFields
      .filter((f) => f in creature)
      .map((f) => [f, creature[f]]),
  ),
);
let fingerprint = 2166136261;
for (let i = 0; i < text.length; i++)
  fingerprint = Math.imul(fingerprint ^ text.charCodeAt(i), 16777619) >>> 0;
creatureEvidence.records['core-full:79:Nesting Death'] = [
  fingerprint.toString(16).padStart(8, '0'),
];
writeFileSync(creatureTarget, JSON.stringify(creatureEvidence, null, 2) + '\n');
