/** Read-only current-registry evidence for inherited-ID triage; no source text export. */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseRulesPack } from '../../../src/storage/rulesStore.ts';
import { parseOraclePack } from '../../../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../../../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../../../src/domain/references.ts';
const folder = 'docs/pdf-remediation-batch-3';
const privateData = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(privateData.library);
const registry = buildOracleRegistry(
  rules,
  parseOraclePack(privateData.oracles),
);
const index = buildReferenceRegistry(registry, rules);
const masters = JSON.parse(
  readFileSync('docs/pdf-escape-audit/data/master-rows.json', 'utf8'),
);
const remain = JSON.parse(
  readFileSync('docs/pdf-remediation-batch-2/remaining-audit-ids.json', 'utf8'),
).entries;
const overrides: Record<string, string[]> = {
  'core-difficulty-scale': ['DR', 'difficulty', '난이도'],
  'core-round-duration': ['round', 'movement', '라운드', '몇 미터'],
  'core-starvation': [
    'starvation',
    'thirst',
    'food',
    'water',
    '식량 없음',
    '굶주림',
  ],
  'core-infection': ['infection', '감염'],
  'core-scroll-restrictions': ['scroll restrictions', 'Heretical Priest'],
  'core-ability-creation': ['ability conversion', 'character creation'],
  'core-character-creation': ['character creation'],
  'core-catastrophe-repeat': ['arcane catastrophes'],
  'core-starting-item-bomb': ['Bomb'],
  'core-starting-item-life-elixir': ['Life elixir'],
  'core-starting-item-small-vicious-dog': ['Small vicious dog'],
  'core-starting-item-monkeys': ['Monkeys'],
  'core-purchase-20-arrows': ['20 arrows', 'arrows'],
  'core-purchase-10-bolts': ['10 bolts', 'bolts'],
  'core-outcast-wild-wickhead': ['Wild Wickhead'],
  'core-outcast-loyalty': ['outcast', 'loyalty'],
};
const entries = remain.map((row: any) => {
  const original = masters.find((m: any) => m.needId === row.needId);
  const queries = overrides[row.needId] ?? original?.searchQueries ?? [];
  const ids = [
    ...new Set(
      original?.appPath?.match(
        /(?:rule|oracle|definition|procedure|class|creature):[\w.:-]+/g,
      ) ?? [],
    ),
  ] as string[];
  return {
    needId: row.needId,
    referencedDestinations: ids.map((id) => ({
      id,
      resolves: !!index.byId[id],
      available: index.byId[id]?.available ?? false,
    })),
    queryResults: queries
      .slice(0, 6)
      .map((query: string) => ({
        query,
        top3: searchReferences(index, query, { limit: 3 }).map((e) => ({
          id: e.id,
          title: e.title,
          available: e.available,
          kind: e.kind,
        })),
      })),
    canonicalTableIds: original?.evidence?.tableIds ?? [],
    canonicalTablesAvailable: (original?.evidence?.tableIds ?? []).filter(
      (id: string) =>
        registry.tables.some((t) => t.id === id && t.sourceVerified),
    ),
  };
});
writeFileSync(
  folder + '/tools/triage-probe.json',
  JSON.stringify(
    {
      head: execFileSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      scope:
        'Read-only registry projection and search ranking; NOT browser acceptance or source re-verification.',
      referenceCount: index.entries.length,
      tableCount: registry.tables.length,
      entries,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    rows: entries.length,
    refs: index.entries.length,
    tables: registry.tables.length,
  }),
);
