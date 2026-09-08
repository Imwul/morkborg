import type { Dungeon, DungeonRoom } from '../domain/types';
import type {
  GeneratedValueProvenance,
  RoomComponent,
} from '../domain/generationProvenance';
import { editedProvenance } from '../domain/generationProvenance';
import { getCanonicalRuleTable } from '../data/oracles';
import { sourceCitation, type RuleEntry } from '../storage/rulesStore';
import { id, random, rollDie, type RandomSource } from './random';
import { rollTable, sourceEntryRange, sourceReferenceFor } from './tables';
import { DUNGEON_PROCEDURES } from './dungeonProcedures';

const procedure = DUNGEON_PROCEDURES.find(
  (item) => item.id === 'core.sample-room',
)!;
function emptyRoom(index: number): DungeonRoom {
  return {
    id: id(),
    kind: 'special',
    name: `ROOM ${String(index + 1).padStart(2, '0')}`,
    description: '',
    feature: '',
    danger: '',
    treasure: '',
    encounter: '',
    notes: '',
    monsterIds: [],
    npcIds: [],
    encounterIds: [],
    sources: {},
    fieldProvenance: {
      name: {
        classification: 'APP_DERIVED',
        origin: 'source',
        status: 'VERIFIED',
        sourceRefs: [],
        procedureId: 'app.structural-identifier',
        transformation:
          'Neutral structural identifier: ROOM + one-based preparation slot; not fictional source text.',
      },
    },
  };
}
function component(
  key: string,
  label: string,
  entry: RuleEntry,
  provenance: GeneratedValueProvenance,
): RoomComponent {
  return {
    key,
    label,
    sourceText: entry.text,
    ...(typeof entry.meta.ko === 'string'
      ? { translationKo: entry.meta.ko }
      : {}),
    provenance: {
      ...provenance,
      classification: 'SOURCE_VERBATIM',
      sourceText: [entry.text],
    },
  };
}
function generateComponents(rng: RandomSource): RoomComponent[] {
  const result = rollTable('core.rooms', undefined, rng);
  const provenance = result.provenance!;
  provenance.procedureId = procedure.id;
  provenance.sourceRefs.push(
    ...procedure.sourceRefs.filter((ref) => ref.role === 'routing'),
  );
  const rootRoll = provenance.rolls![0];
  const entry = getCanonicalRuleTable('core.rooms')!.entries.find(
    (entry, index) => {
      const [min, max] = sourceEntryRange(entry, index);
      return rootRoll.value >= min && rootRoll.value <= max;
    },
  )!;
  const resultComponents = [
    component('sample', 'ROOM', entry, { ...provenance, rolls: [rootRoll] }),
  ];
  if (entry.followup?.length) {
    const followupRoll = provenance.rolls![1];
    const followup = entry.followup.find((entry, index) => {
      const [min, max] = sourceEntryRange(entry, index);
      return followupRoll.value >= min && followupRoll.value <= max;
    })!;
    resultComponents.push(
      component(
        'detail',
        rootRoll.value === 11
          ? 'MOTIF'
          : rootRoll.value === 33
            ? 'CONTENTS'
            : 'ALTAR',
        followup,
        provenance,
      ),
    );
  }
  return resultComponents;
}
function combinedStatus(
  components: RoomComponent[],
): GeneratedValueProvenance['status'] {
  const statuses = components.map((item) => item.provenance.status);
  return (
    (['CONFLICT', 'UNAVAILABLE', 'PARTIAL'] as const).find((status) =>
      statuses.includes(status),
    ) ?? 'VERIFIED'
  );
}
/** Compatibility fields remain readable in old screens/exports; components are authoritative. */
export function syncRoomComponents(room: DungeonRoom): void {
  if (!room.components) return;
  const components = room.components;
  if (room.kind === 'generic') {
    const descriptors = components.filter((item) =>
      ['adjective', 'type'].includes(item.key),
    );
    const contents = components.find((item) => item.key === 'contents');
    const exits = components.find((item) => item.key === 'exits');
    const preserveName =
      !!room.name &&
      !!room.fieldProvenance?.name &&
      room.fieldProvenance.name.origin !== 'source';
    if (!preserveName)
      room.name = descriptors.map((item) => item.sourceText).join(' · ');
    room.description = contents?.sourceText ?? '';
    if (exits) {
      room.feature = `Exits ${exits.sourceText}`;
      const value = Number(exits.sourceText);
      if (Number.isInteger(value) && value >= 0) room.exits = value;
    }
    room.fieldProvenance = {
      ...room.fieldProvenance,
      ...(!preserveName
        ? {
            name: {
              classification: descriptors.some(
                (item) => item.provenance.origin !== 'source',
              )
                ? 'USER_AUTHORED'
                : 'SOURCE_COMPOSED',
              origin: descriptors.some(
                (item) => item.provenance.origin !== 'source',
              )
                ? 'source-edited'
                : 'source',
              status: combinedStatus(descriptors),
              sourceRefs: descriptors.flatMap(
                (item) => item.provenance.sourceRefs,
              ),
              sourceText: descriptors.flatMap(
                (item) => item.provenance.sourceText ?? [],
              ),
              rolls: descriptors.flatMap((item) => item.provenance.rolls ?? []),
              procedureId: 'sd.generic-room',
              transformation:
                'Display two independent source descriptor fragments with ·.',
            },
          }
        : {}),
      ...(contents ? { description: contents.provenance } : {}),
      ...(exits ? { feature: exits.provenance } : {}),
    };
    return;
  }
  room.description = components
    .map((item) => item.sourceText)
    .filter(Boolean)
    .join(' · ');
  room.fieldProvenance = {
    ...room.fieldProvenance,
    description: {
      classification: components.some(
        (item) => item.provenance.origin !== 'source',
      )
        ? 'USER_AUTHORED'
        : components.length > 1
          ? 'SOURCE_COMPOSED'
          : 'SOURCE_VERBATIM',
      origin: components.some((item) => item.provenance.origin !== 'source')
        ? 'source-edited'
        : 'source',
      status: combinedStatus(components),
      sourceRefs: components.flatMap((item) => item.provenance.sourceRefs),
      sourceText: components.flatMap(
        (item) => item.provenance.sourceText ?? [],
      ),
      rolls: components
        .flatMap((item) => item.provenance.rolls ?? [])
        .filter(
          (roll, i, all) =>
            all.findIndex(
              (other) =>
                other.tableId === roll.tableId &&
                other.entryId === roll.entryId &&
                other.value === roll.value,
            ) === i,
        ),
      procedureId: procedure.id,
      transformation:
        'Display source components separated by ·. No connective prose.',
      datasetVersion: components[0]?.provenance.datasetVersion,
    },
  };
  room.sources = { ...room.sources, description: sourceCitation('core.rooms') };
  room.specialDetailIds = components
    .filter((item) => item.key === 'sample')
    .map((item) => item.provenance.rolls![0].entryId!);
}
function specialRoom(index: number, rng: RandomSource): DungeonRoom {
  const room = emptyRoom(index);
  room.components = generateComponents(rng);
  syncRoomComponents(room);
  return room;
}
export function prepareSpecialRooms(
  _d: Dungeon,
  blank = false,
  rng: RandomSource = random,
): DungeonRoom[] {
  return Array.from({ length: 4 }, (_, index) =>
    blank ? emptyRoom(index) : specialRoom(index, rng),
  );
}
export function rerollSpecialRoom(
  d: Dungeon,
  room: DungeonRoom,
  rng: RandomSource = random,
): void {
  const index = Math.max(
    0,
    d.rooms
      .filter((item) => item.kind === 'special')
      .findIndex((item) => item.id === room.id),
  );
  const replacement = specialRoom(index, rng);
  if (!room.components && room.description)
    room.legacyDescription ??= room.description;
  room.components = replacement.components;
  // Full content reroll does not change an independently edited name, notes or assignments.
  syncRoomComponents(room);
  room.kind = 'special';
}
export function editRoomComponent(
  room: DungeonRoom,
  key: string,
  text: string,
): void {
  const target = room.components?.find((item) => item.key === key);
  if (!target) throw new Error(`Unknown room component: ${key}`);
  target.provenance = editedProvenance(target.provenance);
  target.sourceText = text;
  delete target.translationKo;
  syncRoomComponents(room);
}
export function rerollRoomComponent(
  _d: Dungeon,
  room: DungeonRoom,
  key: string,
  rng: RandomSource = random,
): void {
  if (!room.components)
    throw new Error(
      'Legacy room has no verified component mapping; edit its saved text or explicitly regenerate the room.',
    );
  const target = room.components.find((item) => item.key === key);
  if (!target) throw new Error(`Unknown room component: ${key}`);
  if (room.kind === 'generic') {
    if (!['adjective', 'type', 'contents', 'exits'].includes(key))
      throw new Error('No independent source roller.');
    const tableId = `sd.room.${key}`;
    const result = rollTable(tableId, undefined, rng);
    let text = String(result.value);
    const provenance = {
      ...result.provenance!,
      procedureId: 'sd.generic-room',
    };
    const table = getCanonicalRuleTable(tableId)!;
    const roll = provenance.rolls![0];
    const entry = table.entries.find((entry, index) => {
      const [min, max] = sourceEntryRange(entry, index);
      return roll.value >= min && roll.value <= max;
    })!;
    if (key === 'exits') {
      const discovered = room.generation?.rolls.discovered;
      const matrix = entry.meta.bySpecialRoomsUncovered;
      const cell =
        matrix && typeof matrix === 'object'
          ? (matrix as Record<string, { furtherExits?: number }>)[
              String(discovered)
            ]
          : undefined;
      if (!Number.isInteger(cell?.furtherExits))
        throw new Error('Source exit context unavailable.');
      text = String(cell!.furtherExits);
      provenance.classification = 'APP_DERIVED';
      provenance.transformation = `Read source exit matrix at ${discovered} Special Rooms discovered; printed dash = 0.`;
    }
    room.components[room.components.indexOf(target)] = {
      key,
      label: target.label,
      sourceText: text,
      ...(typeof entry.meta.ko === 'string' && key !== 'exits'
        ? { translationKo: entry.meta.ko }
        : {}),
      provenance,
    };
    if (room.generation) room.generation.rolls[key] = roll.value;
    syncRoomComponents(room);
    return;
  }
  if (key === 'sample') {
    // The printed inline subtable depends on the selected parent. UI must disclose this cascade.
    const previousDetail = room.components.find(
      (item) => item.key === 'detail' && item.provenance.origin !== 'source',
    );
    const next = generateComponents(rng);
    if (previousDetail) {
      // A player's edited detail is an independent manual prompt after its parent changes.
      let manualKey = 'manual-detail';
      let suffix = 2;
      while (room.components.some((item) => item.key === manualKey))
        manualKey = `manual-detail-${suffix++}`;
      next.push({
        ...structuredClone(previousDetail),
        key: manualKey,
        label: 'MANUAL',
        provenance: {
          ...structuredClone(previousDetail.provenance),
          transformation:
            'Manual detail retained after its former parent was rerolled.',
        },
      });
    }
    room.components = [
      ...next,
      ...room.components.filter(
        (item) => !['sample', 'detail'].includes(item.key),
      ),
    ];
  } else if (key === 'detail') {
    const parentRoll = room.components.find((item) => item.key === 'sample')
      ?.provenance.rolls?.[0];
    if (!parentRoll) throw new Error('Source parent unavailable.');
    const table = getCanonicalRuleTable('core.rooms');
    const parent = table?.entries.find(
      (entry, index) => sourceEntryRange(entry, index)[0] === parentRoll.value,
    );
    if (!parent?.followup?.length)
      throw new Error('Source has no conditional detail for this result.');
    const sides = parent.followup.reduce((sum, entry) => sum + entry.weight, 0),
      face = rollDie(sides, rng);
    const index = parent.followup.findIndex((entry, i) => {
      const [min, max] = sourceEntryRange(entry, i);
      return face >= min && face <= max;
    });
    const chosen = parent.followup[index];
    const childId = `${parentRoll.entryId}/followup:${sourceEntryRange(chosen, index).join('-')}`;
    const primarySource = sourceReferenceFor(
      'core.rooms',
      parent,
      parentRoll.entryId ?? undefined,
    );
    const provenance: GeneratedValueProvenance = {
      ...target.provenance,
      origin: 'source',
      classification: 'SOURCE_VERBATIM',
      status: primarySource.status ?? 'PARTIAL',
      sourceText: [chosen.text],
      sourceRefs: [
        primarySource,
        ...procedure.sourceRefs.filter((ref) => ref.role === 'routing'),
      ],
      rolls: [
        parentRoll,
        {
          tableId: 'core.rooms',
          dice: `d${sides}`,
          value: face,
          diceValues: [face],
          entryId: childId,
        },
      ],
    };
    room.components[room.components.indexOf(target)] = component(
      'detail',
      target.label,
      chosen,
      provenance,
    );
  } else
    throw new Error('This manual component has no independent source roller.');
  syncRoomComponents(room);
}
