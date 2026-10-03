import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles';
import { buildReferenceRegistry } from '../src/domain/references';
import { setRules, parseRulesPack, type RulesPack } from '../src/storage/rulesStore';
import { parseOraclePack } from '../src/storage/oracleStore';
import type { OraclePack } from '../src/domain/oracle';

// Run after source review and attestation. Only hashes and counts leave private data.
const prior = JSON.parse(
  readFileSync('docs/spatial-oracle/registry-baseline.json', 'utf8'),
) as { files: Record<string, string> };
const paths = Object.keys(prior.files).filter(
  (p) =>
    p.startsWith('src/data/') ||
    p.startsWith('public/rules/') ||
    p === 'outputs/morkborg-private-data.json',
);
const sha = (text: string | Buffer) =>
  createHash('sha256').update(text).digest('hex');
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
) as { library: RulesPack; oracles: OraclePack };
const rules = parseRulesPack(bundle.library);
setRules(rules);
const registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const index = buildReferenceRegistry(registry, rules);
const snapshot = {
  auditDate: '2026-10-03',
  baselineCommit: 'e67fb8d',
  note: 'Reviewed rule-fidelity items 1–21. Source additions and the Mist roll-twice correction are documented in DECISIONS.md; the historical spatial baseline remains untouched.',
  registryHash: sha(JSON.stringify(registry)),
  counts: {
    tables: registry.tables.length,
    procedures: registry.procedures.length,
    references: index.entries.length,
    rows: registry.tables.reduce((n, t) => n + t.entries.length, 0),
    creatures: bundle.library.creatures.length,
  },
  files: Object.fromEntries(paths.map((p) => [p, sha(readFileSync(p))])),
};
mkdirSync('docs/rule-fidelity-2026-10-03', { recursive: true });
writeFileSync(
  'docs/rule-fidelity-2026-10-03/registry-baseline.json',
  JSON.stringify(snapshot, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    registryHash: snapshot.registryHash,
    counts: snapshot.counts,
  }),
);
