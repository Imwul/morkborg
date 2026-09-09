import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoomPacket } from '../src/components/RoomPacket.tsx';
import { createDungeon } from '../src/generators/index.ts';
import type { DungeonRoom } from '../src/domain/types.ts';
import type { GeneratedValueProvenance } from '../src/domain/generationProvenance.ts';
import { editedProvenance } from '../src/domain/generationProvenance.ts';

const source = (): GeneratedValueProvenance => ({
  classification: 'SOURCE_VERBATIM',
  origin: 'source',
  status: 'VERIFIED',
  sourceRefs: [{ bookId: 'fixture', tableId: 'fixture.table', pdfPage: 1 }],
});
function genericRoom(): DungeonRoom {
  return {
    id: 'fixture-room',
    kind: 'generic',
    name: 'Descriptor A · Descriptor B',
    description: 'Contents fixture',
    feature: 'Exits 1',
    danger: '',
    treasure: '',
    encounter: '',
    notes: '',
    monsterIds: [],
    npcIds: [],
    encounterIds: [],
    sources: {},
    fieldProvenance: {
      name: { ...source(), classification: 'SOURCE_COMPOSED' },
    },
    components: [
      {
        key: 'adjective',
        label: 'ADJECTIVE',
        sourceText: 'Descriptor A',
        provenance: source(),
      },
      {
        key: 'type',
        label: 'TYPE',
        sourceText: 'Descriptor B',
        provenance: source(),
      },
      {
        key: 'contents',
        label: 'CONTENTS',
        sourceText: 'Contents fixture',
        provenance: source(),
      },
      {
        key: 'exits',
        label: 'EXITS',
        sourceText: '1',
        provenance: { ...source(), classification: 'APP_DERIVED' },
      },
    ],
  };
}
function renderPacket(room: DungeonRoom, ready = false, expanded = false) {
  return renderToStaticMarkup(
    createElement(RoomPacket, {
      dungeon: createDungeon(
        'fixture-campaign',
        'Manual fixture',
        'sarkash',
        true,
      ),
      room,
      index: 0,
      ready,
      expanded,
      update: () => {},
    }),
  );
}
function renderPreview(room: DungeonRoom) {
  return renderPacket(room).split('</summary>')[0];
}

test('generic packet preview avoids repeating an untouched composed title and labels numeric exits', () => {
  const room = genericRoom(),
    snapshot = structuredClone(room);
  const html = renderPreview(room);
  assert.match(html, /aria-label="Room 1"/);
  assert.doesNotMatch(html, /aria-label="Special Room/);
  assert.doesNotMatch(html, /<strong>Descriptor A · Descriptor B<\/strong>/);
  assert.equal((html.match(/Descriptor A/g) ?? []).length, 1);
  assert.equal((html.match(/Descriptor B/g) ?? []).length, 1);
  assert.match(html, /room-component-exits">EXITS 1<\/span>/);
  assert.deepEqual(room, snapshot);
});

test('manual and source-edited names remain visible even when equal to generated descriptors or structural labels', () => {
  for (const origin of ['manual', 'source-edited'] as const) {
    const room = genericRoom();
    room.fieldProvenance!.name = {
      ...source(),
      classification: 'USER_AUTHORED',
      origin,
    };
    assert.match(
      renderPreview(room),
      /<strong>Descriptor A · Descriptor B<\/strong>/,
    );
    room.name = 'ROOM 01';
    assert.match(renderPreview(room), /<strong>ROOM 01<\/strong>/);
  }
});
test('automatic title mirrors stay quiet after a component edit, but a direct title edit restores visibility', () => {
  const room = genericRoom();
  room.components![0].sourceText = 'Manual adjective';
  room.components![0].provenance = editedProvenance(
    room.components![0].provenance,
  );
  room.name = 'Manual adjective · Descriptor B';
  room.fieldProvenance!.name = {
    ...source(),
    origin: 'source-edited',
    classification: 'USER_AUTHORED',
    derivedFrom: ['adjective', 'type'],
  };
  assert.doesNotMatch(
    renderPreview(room),
    /<strong>Manual adjective · Descriptor B<\/strong>/,
  );
  room.fieldProvenance!.name = editedProvenance(room.fieldProvenance!.name);
  assert.match(
    renderPreview(room),
    /<strong>Manual adjective · Descriptor B<\/strong>/,
  );
});

test('Special Room preview retains source fragments and its correct identity without changing stored text', () => {
  const room = genericRoom();
  room.kind = 'special';
  room.name = 'ROOM 01';
  room.fieldProvenance!.name = {
    classification: 'APP_DERIVED',
    origin: 'source',
    status: 'VERIFIED',
    sourceRefs: [],
    procedureId: 'app.structural-identifier',
  };
  room.components = [
    {
      key: 'sample',
      label: 'ROOM',
      sourceText: 'Sample fixture · source fragment',
      provenance: source(),
    },
  ];
  const snapshot = structuredClone(room),
    html = renderPreview(room);
  assert.match(html, /aria-label="Special Room 1"/);
  assert.doesNotMatch(html, /<strong>ROOM 01<\/strong>/);
  assert.match(
    html,
    /room-component-sample">Sample fixture · source fragment<\/span>/,
  );
  assert.deepEqual(room, snapshot);
});

test('expanded Room exposes each independent reroll and one closed Source without entering edit mode', () => {
  const room = genericRoom(),
    snapshot = structuredClone(room),
    html = renderPacket(room, true, true);
  assert.match(html, /<details open="">/);
  for (const label of ['ADJECTIVE', 'TYPE', 'CONTENTS', 'EXITS'])
    assert.match(
      html,
      new RegExp(`class="room-component-reroll" aria-label="${label} 재굴림"`),
    );
  assert.equal((html.match(/class="room-component-reroll"/g) ?? []).length, 4);
  assert.match(html, /aria-pressed="false">편집/);
  assert.doesNotMatch(html, /<(input|textarea)\b/);
  assert.equal(
    (
      html.match(
        /<summary aria-label="출처 · SOURCE"><span aria-hidden="true">ⓘ<\/span> 출처<\/summary>/g,
      ) ?? []
    ).length,
    1,
  );
  assert.match(html, /<details class="sheet-source source-disclosure">/);
  assert.deepEqual(room, snapshot);
});

test('unavailable source data and preserved manual-only components do not expose misleading rerolls', () => {
  const room = genericRoom();
  assert.doesNotMatch(
    renderPacket(room, false, true),
    /class="room-component-reroll"/,
  );
  room.components!.push({
    key: 'manual-detail',
    label: 'MANUAL DETAIL',
    sourceText: 'Preserved user annotation',
    provenance: editedProvenance(source()),
  });
  const html = renderPacket(room, true, true);
  assert.match(html, /Preserved user annotation/);
  assert.doesNotMatch(html, /aria-label="MANUAL DETAIL 재굴림"/);
  assert.equal((html.match(/class="room-component-reroll"/g) ?? []).length, 4);
});

test('Special Room parent reroll communicates its dependent scope without displaying edit controls', () => {
  const room = genericRoom();
  room.kind = 'special';
  room.components = [
    {
      key: 'sample',
      label: 'ROOM',
      sourceText: 'Sample fixture',
      provenance: source(),
    },
  ];
  const html = renderPacket(room, true, true);
  assert.match(
    html,
    /aria-label="ROOM 재굴림" title="방과 표가 지시하는 추가 항목 재굴림 · 수동 수정한 추가 항목은 보존"/,
  );
  assert.match(
    html,
    /<details class="dependent-roll-note"><summary>재굴림 범위<\/summary>/,
  );
  assert.doesNotMatch(html, /<(input|textarea)\b/);
});
