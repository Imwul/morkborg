import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceDisclosure } from '../src/components/SourceDisclosure.tsx';
import { GenerationDisclosure } from '../src/components/GenerationDisclosure.tsx';
import {
  appPolicy,
  authoritiesForReading,
  generationAuthorities,
  SPECIAL_ROOM_AUTHORITIES,
} from '../src/domain/generationAuthority.ts';
import {
  editedProvenance,
  type GeneratedValueProvenance,
} from '../src/domain/generationProvenance.ts';
import { generatedValueSchema } from '../src/storage/generationSchema.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { createDungeon } from '../src/generators/index.ts';
import {
  prepareSpecialRooms,
  editRoomComponent,
  rerollRoomComponent,
} from '../src/generators/specialRooms.ts';
import { rollTable } from '../src/generators/tables.ts';
import { DUNGEON_PROCEDURES } from '../src/generators/dungeonProcedures.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { rollOracle } from '../src/generators/oracleRoller.ts';
import { REGION_WEIGHT_TABLES } from '../src/generators/regionWeights.ts';
import {
  createGenerationValidationContext,
  validateGeneratedValue,
} from '../src/validation/generationValidation.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';

const source: GeneratedValueProvenance = {
  classification: 'SOURCE_VERBATIM',
  origin: 'source',
  status: 'VERIFIED',
  procedureId: 'core.sample-room',
  sourceText: ['Test source fragment'],
  sourceRefs: [
    { bookId: 'core', tableId: 'core.rooms', pdfPage: 73, role: 'primary' },
  ],
  authority: structuredClone(SPECIAL_ROOM_AUTHORITIES),
};
test('Source disclosure separates source procedure, app choice and manual edits entirely inside one closed disclosure', () => {
  const value = editedProvenance(source);
  const html = renderToStaticMarkup(
    createElement(SourceDisclosure, { provenance: value }),
  );
  assert.match(html, /SOURCE PROCEDURE/);
  assert.match(html, /APP POLICY/);
  assert.match(html, /MANUAL/);
  assert.match(html, /PRIMARY SOURCE/);
  assert.doesNotMatch(html, /ROUTING SOURCE/);
  assert.match(html, /SD는 네 개의 Special Room 준비 슬롯/);
  assert.match(html, /SD는 이 표를 지정하지 않습니다/);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
  assert.ok(html.indexOf('SOURCE PROCEDURE') > html.indexOf('<summary>'));
  assert.ok(html.indexOf('APP POLICY') < html.lastIndexOf('</details>'));
  assert.doesNotMatch(html, /provenance-warning/);
});
test('Legacy room preparation citation is reclassified for display without rewriting saved provenance', () => {
  const legacy = structuredClone(source);
  delete legacy.authority;
  legacy.sourceRefs.push({
    bookId: 'sd',
    pdfPage: 19,
    printedPage: 17,
    role: 'routing',
  });
  const before = JSON.stringify(legacy);
  const html = renderToStaticMarkup(
    createElement(SourceDisclosure, { provenance: legacy }),
  );
  assert.match(html, /sd.dungeon-preparation/);
  assert.match(html, /app.core-sample-room-slots/);
  assert.doesNotMatch(html, /ROUTING SOURCE/);
  assert.equal(JSON.stringify(legacy), before);
});
test('Grouped results disclose grouping as app presentation while true source routing stays distinct', () => {
  const routed = {
    ...source,
    procedureId: undefined,
    authority: undefined,
    sourceRefs: [
      { bookId: 'feretory', pdfPage: 15, role: 'primary' as const },
      { bookId: 'depths', pdfPage: 25, role: 'routing' as const },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(GenerationDisclosure, { values: { creature: routed } }),
  );
  assert.match(html, /PRIMARY SOURCE/);
  assert.match(html, /ROUTING SOURCE/);
  assert.match(html, /app.result-grouping/);
  assert.doesNotMatch(html, /app.region-weighting|app.core-sample-room-slots/);
});
test('Authority metadata survives validation and source edits without changing original source text', () => {
  const edited = editedProvenance(source);
  const parsed = generatedValueSchema.parse(JSON.parse(JSON.stringify(edited)));
  assert.deepEqual(parsed, edited);
  assert.deepEqual(parsed.sourceText, source.sourceText);
  assert.deepEqual(parsed.authority, source.authority);
  assert.equal(parsed.origin, 'source-edited');
  const legacy = { ...source };
  delete legacy.authority;
  assert.deepEqual(generatedValueSchema.parse(legacy), legacy);
});
test('Unknown legacy procedure is never silently promoted to a source-defined procedure', () => {
  const value = {
    ...source,
    authority: undefined,
    procedureId: 'unknown.legacy-prose',
  };
  assert.deepEqual(generationAuthorities(value), []);
  const html = renderToStaticMarkup(
    createElement(SourceDisclosure, { provenance: value }),
  );
  assert.match(html, /PROCEDURE AUTHORITY UNAVAILABLE/);
  assert.doesNotMatch(html, /aria-label="SOURCE PROCEDURE"/);
  assert.throws(() => appPolicy('unregistered-policy'), /Unknown application/);
});
const path =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8'))
  : null;
const local = (name: string, fn: () => void) =>
  test(name, { skip: !fixture }, () => {
    setRules(fixture.library);
    setOraclePack(fixture.oracles);
    fn();
  });
local(
  'Actual four Special Rooms distinguish SD slot count, Core sample procedure and app table assignment across rerolls',
  () => {
    const dungeon = createDungeon('test', 'Manual dungeon', 'sarkash', true);
    dungeon.rooms = prepareSpecialRooms(dungeon, false, () => 0.4);
    assert.equal(dungeon.rooms.length, 4);
    assert.equal(
      DUNGEON_PROCEDURES.find(
        (p) => p.id === 'core.sample-room',
      )!.sourceRefs.some((ref) => ref.bookId === 'sd'),
      false,
    );
    for (const room of dungeon.rooms) {
      assert.equal(room.fieldProvenance!.name.authority![0].kind, 'APP_POLICY');
      assert.deepEqual(
        room.components![0].provenance.authority,
        SPECIAL_ROOM_AUTHORITIES,
      );
      assert.ok(
        room.components![0].provenance.sourceRefs.every(
          (ref) => ref.role !== 'routing',
        ),
      );
    }
    const room = dungeon.rooms[0];
    editRoomComponent(room, 'sample', 'Manual interpretation');
    const copy = generatedValueSchema.parse(
      JSON.parse(JSON.stringify(room.components![0].provenance)),
    );
    assert.equal(copy.origin, 'source-edited');
    assert.deepEqual(copy.authority, SPECIAL_ROOM_AUTHORITIES);
    rerollRoomComponent(dungeon, room, 'sample', () => 0.7);
    assert.equal(room.components![0].provenance.origin, 'source');
    assert.deepEqual(
      room.components![0].provenance.authority,
      SPECIAL_ROOM_AUTHORITIES,
    );
  },
);
local(
  'Region weighting is app policy only when actually applied, while canonical rolls have source authority',
  () => {
    const weighted = [...REGION_WEIGHT_TABLES]
      .map((id) => rollTable(id, 'sarkash', () => 0.25).provenance!)
      .find((value) => value.regionWeighting);
    assert.ok(weighted);
    assert.ok(
      weighted.authority!.some(
        (item) =>
          item.kind === 'APP_POLICY' && item.id === 'app.region-weighting',
      ),
    );
    assert.ok(
      generationAuthorities(weighted)
        .find((item) => item.id === 'app.region-weighting')!
        .description!.includes('sarkash'),
    );
    const plain = rollTable('core.rooms', undefined, () => 0.5).provenance!;
    assert.ok(
      !generationAuthorities(plain).some((item) => item.kind === 'APP_POLICY'),
    );
    const registry = buildOracleRegistry(getRules(), getOraclePack());
    const table = registry.tables.find((item) => item.id === 'core.reaction')!;
    const roll = rollOracle(table, registry, () => 0.5);
    const authorities = authoritiesForReading({
      title: 'Reaction',
      blocks: [],
      sourceRefs: [],
      oracle: { id: 'test', title: 'Reaction', rolls: [roll] },
    });
    assert.ok(
      authorities.some(
        (item) =>
          item.kind === 'SOURCE_PROCEDURE' &&
          item.id === 'oracle:core.reaction' &&
          item.sourceRefs?.length,
      ),
    );
    assert.ok(!authorities.some((item) => item.kind === 'APP_POLICY'));
  },
);

local(
  'Development validation rejects an app choice falsely labeled as a source procedure',
  () => {
    const registry = buildOracleRegistry(getRules(), getOraclePack());
    const context = createGenerationValidationContext(
      registry,
      getRules()!,
      DUNGEON_PROCEDURES,
    );
    const roll = rollTable('core.rooms', undefined, () => 0.5);
    const falseClaim = {
      ...roll.provenance!,
      authority: [
        { kind: 'SOURCE_PROCEDURE' as const, id: 'app.region-weighting' },
      ],
    };
    assert.ok(
      validateGeneratedValue(roll.value, falseClaim, context).some(
        (issue) => issue.code === 'app-policy-claimed-as-source',
      ),
    );
    assert.deepEqual(
      validateGeneratedValue(roll.value, roll.provenance, context).filter(
        (issue) => issue.severity === 'error',
      ),
      [],
    );
  },
);

local(
  'Actual regional monster preserves explicit source routing authority ahead of generic Oracle lookup metadata',
  () => {
    const registry = buildOracleRegistry(getRules(), getOraclePack());
    const refs = buildReferenceRegistry(registry, getRules());
    const reading = executeReference(
      refs.byId['rule:regional-monsters:sarkash'],
      {
        registry,
        rules: getRules(),
        region: 'sarkash',
        stockKind: 'common',
        stockDR: 10,
        cityLarge: false,
        cityExits: false,
        rng: () => 0.01,
      },
    )!;
    const authorities = authoritiesForReading(reading);
    const explicit = reading.authority!.find(
      (item) => item.kind === 'SOURCE_PROCEDURE',
    )!;
    assert.deepEqual(
      authorities.find((item) => item.id === explicit.id),
      explicit,
    );
    assert.ok(
      authorities.some(
        (item) =>
          item.kind === 'APP_POLICY' && item.id === 'app.result-grouping',
      ),
    );
    assert.ok(!authorities.some((item) => item.id === 'app.region-weighting'));
    const html = renderToStaticMarkup(
      createElement(SourceDisclosure, {
        refs: reading.sourceRefs,
        evidence: reading.evidence,
        authorities,
      }),
    );
    for (const label of [
      'PRIMARY SOURCE',
      'ROUTING SOURCE',
      'SOURCE PROCEDURE',
      'APP POLICY',
    ])
      assert.ok(html.includes(label), label);
    assert.equal(reading.oracle!.rolls.length, 1);
  },
);
