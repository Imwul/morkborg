import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { createEncounter, rerollEncounter } from '../src/generators/content.ts';
import { encounterCardTitle } from '../src/domain/encounterDisplay.ts';
const path = 'outputs/morkborg-private-data.json';
const fixture = existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8'))
  : null;
const registry = buildOracleRegistry(
  fixture ? parseRulesPack(fixture.library) : null,
  fixture ? parseOraclePack(fixture.oracles) : null,
);
const local = (name: string, run: () => void) =>
  test(name, { skip: !fixture }, run);
function generated() {
  const table = registry.tables.find(
    (candidate) => candidate.id === 'depths.region.sarkash.monsters',
  )!;
  const row = table.entries.find(
    (entry) => entry.metadata?.name === 'Skelelks',
  )!;
  const encounter = createEncounter(
    'qa',
    'sarkash',
    'common',
    10,
    true,
    registry,
  );
  rerollEncounter(encounter, registry, () => (row.min - 1) / 6);
  return encounter;
}
local(
  'Encounter cards show exact canonical identity and unrolled quantity while retaining complete source text',
  () => {
    const encounter = generated();
    const original = structuredClone(encounter);
    assert.equal(encounterCardTitle(encounter, registry), 'd2 Skelelks');
    assert.match(encounter.text, /Feretory p\./);
    assert.deepEqual(encounter, original);
  },
);
local(
  'Manual names and edited encounter text always take precedence over the compact source projection',
  () => {
    const encounter = generated();
    encounter.name = 'Manual (Feretory p. 13)';
    assert.equal(encounterCardTitle(encounter, registry), encounter.name);
    encounter.name = '';
    encounter.fieldProvenance!.text.origin = 'source-edited';
    assert.equal(encounterCardTitle(encounter, registry), encounter.text);
    encounter.fieldProvenance!.text.origin = 'source';
    encounter.text += ' Manual addition.';
    assert.equal(encounterCardTitle(encounter, registry), encounter.text);
  },
);
local(
  'Missing source data or legacy provenance preserves the literal saved encounter without guessing its identity',
  () => {
    const encounter = generated();
    assert.equal(
      encounterCardTitle(encounter, { books: [], tables: [], procedures: [] }),
      encounter.text,
    );
    delete encounter.fieldProvenance;
    assert.equal(encounterCardTitle(encounter, registry), encounter.text);
  },
);
