import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
import {
  generateMonster,
  loadMonsterPreset,
  rerollMonsterField,
  patchMonsterScalar,
} from '../src/generators/monster.ts';
import {
  createNPC,
  createEncounter,
  rerollNPC,
  rerollEncounter,
} from '../src/generators/content.ts';
import { generateCharacter } from '../src/generators/character.ts';
import {
  buildCharacterProcedures,
  characterClasses,
} from '../src/generators/characterClasses.ts';
import {
  creatureRegistry,
  CREATURE_PROCEDURES,
  creatureRecordStatus,
  rollCreatureTable,
} from '../src/generators/creatureProvenance.ts';
import { creatureReferenceId } from '../src/domain/references.ts';
import { feretoryStats } from '../src/generators/feretory.ts';
import type { GeneratedValueProvenance } from '../src/domain/generationProvenance.ts';
import { loadPreset } from '../src/generators/index.ts';

const fixture = 'outputs/morkborg-private-data.json';
const available = existsSync(fixture);
if (available) {
  const pack = JSON.parse(readFileSync(fixture, 'utf8'));
  setRules(pack.library);
  setOraclePack(pack.oracles);
}
const sourceTest = { skip: !available };
function assertProvenance(provenance: GeneratedValueProvenance) {
  assert.notEqual(provenance.classification, 'UNSOURCED');
  assert.ok(
    provenance.transformation,
    'Transformation or explicit none is documented',
  );
  assert.ok(
    provenance.sourceRefs.length ||
      provenance.procedureId === 'app.structural-identifier',
  );
  const registry = creatureRegistry();
  for (const ref of provenance.sourceRefs) {
    assert.ok(ref.bookId);
    assert.ok(ref.pdfPage);
    if (ref.tableId)
      assert.ok(
        registry.tables.some((t) => t.id === ref.tableId) ||
          [...getRules()!.creatures, ...getRules()!.outcasts].some(
            (record) => creatureReferenceId(record) === ref.tableId,
          ),
        `Missing source ID ${ref.tableId}`,
      );
    if (ref.entryId && ref.tableId && !ref.tableId.startsWith('creature:'))
      assert.ok(
        registry.tables
          .find((t) => t.id === ref.tableId)!
          .entries.some((entry) => entry.id === ref.entryId),
      );
  }
  for (const roll of provenance.rolls ?? []) {
    assert.ok(Number.isFinite(roll.value));
    assert.ok(roll.dice);
  }
}
function walk(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(walk);
    return;
  }
  if ('classification' in value && 'sourceRefs' in value) {
    assertProvenance(value as GeneratedValueProvenance);
    return;
  }
  Object.values(value).forEach(walk);
}
test(
  '10,000 passes each for TMA, NPC and encounter generators resolve provenance and source text',
  sourceTest,
  () => {
    const registry = creatureRegistry();
    const categories = [
      'common',
      'rare',
      'room',
      'hazard',
      'discovery',
    ] as const;
    for (let i = 0; i < 10_000; i++) {
      const monster = generateMonster('integrity');
      assert.equal(monster.name, 'Monster');
      assert.equal(monster.fieldProvenance!.hp.status, 'CONFLICT');
      assert.equal(
        monster.fieldProvenance!.appearance.sourceText!.join('; '),
        monster.appearance,
      );
      assert.equal(
        monster.fieldProvenance!.hp.rolls!.at(-1)!.value * 2,
        monster.hp,
      );
      const npc = createNPC('integrity', 'sarkash', false, registry);
      for (const [field, p] of Object.entries(npc.fieldProvenance!))
        assert.equal(
          p.sourceText!.join(' · '),
          (npc as unknown as Record<string, unknown>)[field],
        );
      const encounter = createEncounter(
        'integrity',
        'sarkash',
        categories[i % categories.length],
        10,
        false,
        registry,
      );
      assert.equal(
        encounter.fieldProvenance!.text.sourceText![0],
        encounter.text,
      );
      [monster, npc, encounter].forEach(walk);
    }
  },
);
test(
  '100 characters across all installed classes and every fixed creature preserve inspectable evidence',
  sourceTest,
  () => {
    const classes = ['classless', ...characterClasses().map((c) => c.id)];
    for (let i = 0; i < 100; i++) {
      const character = generateCharacter(
        'qa',
        false,
        classes[i % classes.length],
      );
      walk(character);
      assert.equal(
        character.background!.filter((b) => b.tableId === 'core.badHabits')
          .length,
        1,
      );
      assert.equal(
        character.background!.filter((b) => b.tableId === 'core.troublingTales')
          .length,
        1,
      );
    }
    for (const record of [...getRules()!.creatures, ...getRules()!.outcasts]) {
      assert.equal(
        creatureRecordStatus(record),
        'VERIFIED',
        String(record.name),
      );
      walk(loadMonsterPreset('qa', record));
    }
    for (const record of getRules()!.outcasts) {
      const npc = loadPreset('npcs', record);
      walk(npc);
      if (record.possession)
        assert.equal('possession' in npc && npc.possession, record.possession);
      if (record.name === 'Wild Wickhead')
        assert.match(
          'specialAbility' in npc ? npc.specialAbility : '',
          /1–2: Walking lightsource/,
        );
    }
  },
);
test(
  'Creature verification detects altered source content even if book and page metadata remain',
  sourceTest,
  () => {
    const record = getRules()!.creatures.find((r) => typeof r.hp === 'number')!;
    assert.equal(creatureRecordStatus(record), 'VERIFIED');
    assert.equal(
      creatureRecordStatus({ ...record, hp: Number(record.hp) + 100 }),
      'PARTIAL',
    );
    assert.equal(
      loadMonsterPreset('qa', { ...record, hp: Number(record.hp) + 100 })
        .fieldProvenance!.hp.status,
      'PARTIAL',
    );
  },
);
test(
  'Field reroll atomically updates provenance and preserves unrelated manual fields',
  sourceTest,
  () => {
    const monster = generateMonster('qa');
    patchMonsterScalar(monster, 'appearance', 'User appearance');
    const original = structuredClone(monster.fieldProvenance!.appearance);
    rerollMonsterField(monster, 'wants');
    assert.equal(monster.appearance, 'User appearance');
    assert.deepEqual(monster.fieldProvenance!.appearance, original);
    assert.equal(original.origin, 'source-edited');
    assert.equal(monster.fieldProvenance!.wants.sourceText![0], monster.wants);
    const npc = createNPC('qa');
    const name = structuredClone(npc.fieldProvenance!.name);
    rerollNPC(npc, 'reaction');
    assert.deepEqual(npc.fieldProvenance!.name, name);
    const encounter = createEncounter('qa');
    rerollEncounter(encounter);
    assert.equal(
      encounter.fieldProvenance!.text.sourceText![0],
      encounter.text,
    );
    for (const object of [monster, npc, encounter])
      assert.deepEqual(JSON.parse(JSON.stringify(object)), object);
  },
);
test(
  'Explicit creature and character procedures contain only installed source table references',
  sourceTest,
  () => {
    const registry = creatureRegistry();
    for (const procedure of [
      ...CREATURE_PROCEDURES,
      ...buildCharacterProcedures(),
    ]) {
      assert.ok(procedure.sourceRefs.length);
      const ids = procedure.steps.map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length, procedure.id);
      for (const step of procedure.steps) {
        assert.ok(step.count > 0);
        if (step.tableId)
          assert.ok(
            registry.tables.some((t) => t.id === step.tableId),
            step.tableId,
          );
        for (const dependency of step.dependsOn ?? [])
          assert.ok(ids.includes(dependency));
      }
    }
  },
);
test(
  'Missing or explicitly unverified source tables cannot invoke a creature fallback',
  sourceTest,
  () => {
    const registry = creatureRegistry();
    assert.throws(() => rollCreatureTable('missing.table'), /UNAVAILABLE/);
    assert.throws(
      () =>
        rollCreatureTable('feretory.A', undefined, {
          ...registry,
          tables: registry.tables.map((table) =>
            table.id === 'feretory.A'
              ? { ...table, sourceVerified: false }
              : table,
          ),
        }),
      /UNAVAILABLE/,
    );
  },
);
test('FERETORY refuses invalid dice before deriving any stats', () => {
  for (const value of [0, 13, NaN, Infinity, 1.5])
    assert.throws(() => feretoryStats({ A: value, B: 4, C: 7 }), /Invalid/);
});
