/** Scoped mechanical definition/source inventory; never exports rulebook effects. */
import { readFileSync, writeFileSync } from 'node:fs';
import { parseRulesPack } from '../../../src/storage/rulesStore.ts';
import { parseOraclePack } from '../../../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../../../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../../../src/domain/references.ts';
import { unresolvedReferenceDefinitions } from '../../../src/domain/referenceDefinitions.ts';
import { unresolvedOracleSources } from '../../../src/validation/oracleSourceIntegrity.ts';
import { REFERENCE_SEARCH_ALIASES } from '../../../src/domain/referenceSearchAliases.ts';
const bundle = JSON.parse(
  readFileSync(
    process.env.AUDIT_PRIVATE_BUNDLE || 'outputs/morkborg-private-data.json',
    'utf8',
  ),
);
const rules = parseRulesPack(bundle.library),
  registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const index = buildReferenceRegistry(registry, rules),
  defs = index.entries.flatMap((e) => (e.definition ? [e.definition] : []));
const definitions = defs.map((d) => ({
  id: d.id,
  title: d.title,
  kind: d.kind,
  effectPresent: d.blocks.some((b) => !!b.text.trim()),
  sourceRefs: d.sourceRefs,
  canonicalIds: d.canonicalIds,
  exactNameTopId: searchReferences(index, d.title)[0]?.id,
}));
const counts = Object.fromEntries(
  [...new Set(defs.map((d) => d.kind))].map((kind) => [
    kind,
    defs.filter((d) => d.kind === kind).length,
  ]),
);
const problems = {
  definitions: unresolvedReferenceDefinitions(defs, registry),
  oracleSources: unresolvedOracleSources(registry),
};
if (Object.values(problems).some((p) => p.length))
  throw Error(JSON.stringify(problems));
writeFileSync(
  'docs/pdf-remediation-batch-1/catalog-inventory.json',
  JSON.stringify(
    {
      applicationBase: '71c59c7bfd5d09f2c670dd3d9e650c2e8d8784e3',
      auditHead: '479cbd765b4168eeaeee27f921bf4b0a6615c51b',
      referenceEntries: index.entries.length,
      canonicalTables: registry.tables.length,
      definitionCount: defs.length,
      counts,
      aliases: {
        entries: Object.keys(REFERENCE_SEARCH_ALIASES).length,
        ko: Object.values(REFERENCE_SEARCH_ALIASES).flatMap((a) => a.ko).length,
        en: Object.values(REFERENCE_SEARCH_ALIASES).flatMap((a) => a.en).length,
      },
      unresolved: problems,
      definitions,
    },
    null,
    2,
  ) + '\n',
);
console.log({
  referenceEntries: index.entries.length,
  canonicalTables: registry.tables.length,
  counts,
  unresolved: problems,
});
