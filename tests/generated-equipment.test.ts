import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { physicalOracleRoll } from '../src/domain/manualReferenceRoll.ts';
import {
  containerAlternatives,
  equipmentScrollTable,
  readingWithEquipmentScrolls,
} from '../src/domain/generatedEquipment.ts';
import {
  createInlineChildResults,
  retainInlineChild,
  copyReadingWithInlineChildren,
} from '../src/domain/inlineReadingContinuity.ts';
import { objectFromReading } from '../src/domain/savedObjects.ts';
import {
  oracleReadingText,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(fixture.library);
setOraclePack(fixture.oracles);
const registry = buildOracleRegistry(getRules()!, getOraclePack());
const table = (id: string) => registry.tables.find((table) => table.id === id)!;

test('The container choice lists exactly the preceding canonical rows only for the donkey result', () => {
  const source = table('core.containers');
  const donkey = physicalOracleRoll(source, '6', registry);
  assert.deepEqual(
    containerAlternatives(source, donkey),
    source.entries.filter((row) => row.max < 6),
  );
  assert.ok(containerAlternatives(source, donkey).length > 0);
  assert.deepEqual(
    containerAlternatives(source, physicalOracleRoll(source, '2', registry)),
    [],
  );
});

for (const [id, face, childId] of [
  ['core.gearA', '5', 'core.unclean'],
  ['core.gearB', '2', 'core.sacred'],
]) {
  test(`${id}: inline scroll replaces the equipment value, preserves its effect/source and cannot survive a new parent`, (t) => {
    t.mock.method(globalThis.crypto, 'getRandomValues', () => {
      throw new Error('No incidental RNG');
    });
    const parent = physicalOracleRoll(table(id), face, registry);
    const other = physicalOracleRoll(table('core.weapons'), '1', registry);
    assert.equal(equipmentScrollTable(parent), childId);
    const rolled = physicalOracleRoll(table(childId), '1', registry);
    const child = {
      ...rolled,
      metadata: {
        ...rolled.metadata,
        parentEntryId: parent.entryId,
        parentOracleId: parent.oracleId,
      },
    };
    const reading: ReferenceReading = {
      title: 'Character',
      blocks: [parent, other].map((roll) => ({
        title: roll.title,
        text: roll.text,
      })),
      sourceRefs: [],
      oracle: {
        id: 'test-character',
        title: 'Character',
        rolls: [parent, other],
      },
    };
    const before = structuredClone(reading);
    const children = createInlineChildResults();
    assert.equal(retainInlineChild(children, parent, rolled), false);
    assert.equal(retainInlineChild(children, parent, child), true);
    const resolved = readingWithEquipmentScrolls(reading, children);
    assert.equal(resolved.blocks[0].text, oracleReadingText(child));
    assert.equal(resolved.blocks[1], reading.blocks[1]);
    assert.equal(resolved.oracle, reading.oracle);
    assert.ok(resolved.sourceRefs.some((ref) => ref.tableId === childId));
    assert.deepEqual(reading, before);
    const copy = copyReadingWithInlineChildren(reading, children, true);
    assert.ok(copy.includes(oracleReadingText(child)));
    assert.ok(!copy.includes(parent.text));
    const saved = objectFromReading(
      'procedure:character.core-classless',
      reading,
      children,
    );
    assert.ok(saved.text.includes(child.text));
    assert.ok(saved.sourceText.includes(oracleReadingText(child)));
    assert.ok(!saved.text.includes(parent.text));
    const nextParent = physicalOracleRoll(table(id), face, registry);
    const next = {
      ...reading,
      oracle: { ...reading.oracle!, rolls: [nextParent, other] },
    };
    assert.equal(readingWithEquipmentScrolls(next, children), next);
    assert.ok(
      copyReadingWithInlineChildren(next, children).includes(parent.text),
    );
    assert.equal(retainInlineChild(children, other, child), false);
    const rerolled = {
      ...child,
      ...physicalOracleRoll(table(childId), '2', registry),
      metadata: child.metadata,
    };
    retainInlineChild(children, parent, rerolled);
    assert.ok(
      copyReadingWithInlineChildren(reading, children).includes(rerolled.text),
    );
    assert.ok(
      !copyReadingWithInlineChildren(reading, children).includes(child.text),
    );
  });
}
