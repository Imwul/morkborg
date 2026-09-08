import type {
  GeneratorProcedure,
  GeneratorStep,
} from '../domain/generationProvenance';

type DungeonProcedure = GeneratorProcedure & {
  note?: string;
  steps: (GeneratorStep & { follows?: string })[];
};

// This is procedure metadata, never a second copy of source table contents.
export const DUNGEON_PROCEDURES: DungeonProcedure[] = [
  {
    id: 'core.dungeon-title',
    title: 'Dungeon title',
    sourceRefs: [
      { bookId: 'core', tableId: 'core.titleA', pdfPage: 71, printedPage: 71 },
    ],
    steps: [
      {
        id: 'first',
        tableId: 'core.titleA',
        dice: 'd12',
        count: 1,
        follows: 'second',
      },
      {
        id: 'second',
        tableId: 'core.titleB',
        dice: 'd12',
        count: 1,
        derived: 'Printed prefix The + first column + second column.',
      },
    ],
  },
  {
    id: 'core.dungeon-status',
    title: 'Dungeon Status',
    sourceRefs: [
      { bookId: 'core', tableId: 'core.status', pdfPage: 71, printedPage: 71 },
    ],
    steps: [
      { id: 'status', tableId: 'core.status', dice: 'd6', count: 1 },
      {
        id: 'reason',
        tableId: 'core.status',
        dice: 'd4',
        count: 1,
        condition: 'Status 3–6; use the inline reason subtable.',
      },
    ],
    note: 'The fourth reason directs the reader to the Calendar of Nechrubel. Keep that source instruction visible; dungeon preparation does not apply a new campaign Misery automatically.',
  },
  {
    id: 'core.imminent-danger',
    title: 'Imminent Danger',
    sourceRefs: [
      { bookId: 'core', tableId: 'core.danger', pdfPage: 72, printedPage: 72 },
    ],
    steps: [
      { id: 'danger', tableId: 'core.danger', dice: 'd10', count: 1 },
      {
        id: 'flood',
        tableId: 'core.danger',
        dice: 'd4',
        count: 1,
        condition: 'Danger 1; use only its inline flood subtable.',
      },
    ],
  },
  {
    id: 'core.sample-room',
    title: 'Sample Room',
    sourceRefs: [
      {
        bookId: 'core',
        tableId: 'core.rooms',
        pdfPage: [73, 74],
        printedPage: '73–74',
        role: 'primary',
      },
      {
        bookId: 'sd',
        pdfPage: 19,
        printedPage: 17,
        role: 'routing',
        note: 'Four preparation slots. Selecting the Core Sample Rooms table for these slots is an explicit application preparation choice; SD does not mandate this table.',
      },
    ],
    steps: [
      { id: 'sample', tableId: 'core.rooms', dice: 'd4 × d6', count: 1 },
      {
        id: 'motif',
        tableId: 'core.rooms',
        dice: 'd6',
        count: 1,
        condition: 'Sample selector 11; use only its inline motif subtable.',
      },
      {
        id: 'shelves',
        tableId: 'core.rooms',
        dice: 'd4',
        count: 1,
        condition: 'Sample selector 33; use only its inline shelves subtable.',
      },
      {
        id: 'altar',
        tableId: 'core.rooms',
        dice: 'd4',
        count: 1,
        condition: 'Sample selector 43; use only its inline altar subtable.',
      },
    ],
    note: 'One sample result per room. Independent repetitions are valid. No generated role, regional trait, prose, second detail, or uniqueness reroll. Four slots come from SD; no source claim is made for DNGNGEN content.',
  },
  {
    id: 'sd.generic-room',
    title: 'Dungeon Room Descriptors',
    sourceRefs: [{ bookId: 'sd', pdfPage: 15, printedPage: 13 }],
    steps: [
      { id: 'adjective', tableId: 'sd.room.adjective', dice: 'd20', count: 1 },
      { id: 'type', tableId: 'sd.room.type', dice: 'd12', count: 1 },
      { id: 'contents', tableId: 'sd.room.contents', dice: 'd12', count: 1 },
      {
        id: 'exits',
        tableId: 'sd.room.exits',
        dice: 'd4',
        count: 1,
        condition:
          'During a crawl, read the column for the number of Special Rooms discovered.',
        derived: 'A printed dash means zero further exits.',
      },
    ],
    note: 'Keep slash-separated printed alternatives intact. Contents instructions remain instructions; do not automatically resolve alternatives or invent combat stats.',
  },
];

export const VERIFIED_DUNGEON_TABLES: Record<
  string,
  { pdf: number[]; printed: number | string; title: string }
> = {
  'core.titleA': {
    pdf: [71],
    printed: 71,
    title: 'What Is It Called? — First Column',
  },
  'core.titleB': {
    pdf: [71],
    printed: 71,
    title: 'What Is It Called? — Second Column',
  },
  'core.status': { pdf: [71], printed: 71, title: 'Status' },
  'core.danger': { pdf: [72], printed: 72, title: 'Imminent Danger' },
  'core.inhabitants': {
    pdf: [72],
    printed: 72,
    title: 'Who or What Dwells Here Now?',
  },
  'core.feature': { pdf: [73], printed: 73, title: 'Distinctive Feature' },
  'core.rooms': { pdf: [73, 74], printed: '73–74', title: 'Sample Rooms' },
  'core.sparks': { pdf: [69, 70], printed: '69–70', title: 'Adventure Sparks' },
  'core.treasures': { pdf: [3], printed: 3, title: 'Occult Treasures' },
  'core.traps': { pdf: [4], printed: 4, title: 'Traps' },
  'sd.room.adjective': { pdf: [15], printed: 13, title: 'Room Adjective' },
  'sd.room.type': { pdf: [15], printed: 13, title: 'Room Type' },
  'sd.room.contents': { pdf: [15], printed: 13, title: 'Room Contents' },
  'sd.room.exits': { pdf: [15], printed: 13, title: 'Room Exits' },
  'reclvse.dungeonPurposeThen': {
    pdf: [86],
    printed: 86,
    title: 'Dungeon Purpose (Then)',
  },
  'reclvse.dungeonEntrance': {
    pdf: [87],
    printed: 87,
    title: 'Dungeon Entrance',
  },
  'reclvse.entranceState': { pdf: [88], printed: 88, title: 'Entrance State' },
  'reclvse.dressing': { pdf: [92], printed: 92, title: 'Room Dressing' },
  'reclvse.roomLoot': { pdf: [93], printed: 93, title: 'Room Loot' },
  'reclvse.roomEncounter': { pdf: [93], printed: 93, title: 'Room Encounter' },
};
