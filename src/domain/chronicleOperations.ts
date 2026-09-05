import type { Campaign } from './types';
import type { OracleResult } from './oracle';
import type {
  ObjectLink,
  ObjectKind,
  Session,
  TimelineEvent,
  CampaignThread,
  Rumor,
  Relic,
  JournalNote,
  DungeonPlayState,
  RoomPlayState,
  PlacementPlayState,
  SessionEncounter,
  ChronicleRecord,
} from './chronicle';
import { id, now } from '../generators/random';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const stamp = () => {
  const time = now();
  return { id: id(), createdAt: time, updatedAt: time };
};
export const objectLinkKey = (link: ObjectLink): string =>
  `${link.kind}:${link.dungeonId ?? ''}:${link.id}`;
const same = (a: ObjectLink, b: ObjectLink) =>
  objectLinkKey(a) === objectLinkKey(b);
const collection = (c: Campaign, kind: ObjectKind) => {
  switch (kind) {
    case 'character':
      return c.characters;
    case 'dungeon':
      return c.dungeons;
    case 'monster':
      return c.monsters;
    case 'npc':
      return c.npcs;
    case 'encounter':
      return c.encounters;
    case 'session':
      return c.sessions;
    case 'thread':
      return c.threads;
    case 'rumor':
      return c.rumors;
    case 'relic':
      return c.relics;
    case 'note':
      return c.journalNotes;
    case 'event':
      return c.timeline;
    case 'room':
      return c.dungeons.flatMap((d) => d.rooms);
  }
};
export function validObjectLink(c: Campaign, link: ObjectLink): boolean {
  if (link.kind === 'room')
    return (
      !!link.dungeonId &&
      !!c.dungeons
        .find((d) => d.id === link.dungeonId)
        ?.rooms.some((r) => r.id === link.id)
    );
  return (
    !link.dungeonId && collection(c, link.kind).some((e) => e.id === link.id)
  );
}
export function objectLabel(c: Campaign, link: ObjectLink): string {
  if (link.kind === 'room') {
    const d = c.dungeons.find((d) => d.id === link.dungeonId),
      index = d?.rooms.findIndex((r) => r.id === link.id) ?? -1;
    return d && index >= 0
      ? `${d.title} / ${String(index + 1).padStart(2, '0')} · ${d.rooms[index].name}`
      : 'Deleted room';
  }
  const e = collection(c, link.kind).find((e) => e.id === link.id);
  return e ? ('title' in e ? e.title : e.name) || 'Untitled' : 'Deleted record';
}
export function objectLinks(
  c: Campaign,
): { link: ObjectLink; label: string }[] {
  const result: { link: ObjectLink; label: string }[] = [];
  for (const kind of [
    'character',
    'dungeon',
    'monster',
    'npc',
    'encounter',
    'session',
    'thread',
    'rumor',
    'relic',
    'note',
    'event',
  ] as const)
    for (const e of collection(c, kind)) {
      const link = { kind, id: e.id };
      result.push({ link, label: objectLabel(c, link) });
    }
  for (const d of c.dungeons)
    for (const room of d.rooms) {
      const link: ObjectLink = { kind: 'room', id: room.id, dungeonId: d.id };
      result.push({ link, label: objectLabel(c, link) });
    }
  return result;
}
function requireLink(c: Campaign, link: ObjectLink): void {
  if (!validObjectLink(c, link))
    throw new Error('The linked object does not belong to this campaign.');
}
function pushLink(links: ObjectLink[], link: ObjectLink): void {
  const previous = links.find(
    (entry) => same(entry, link) && entry.relation === link.relation,
  );
  if (!previous) links.push(structuredClone(link));
  else if (link.quantity !== undefined) previous.quantity = link.quantity;
}
export function linkToSession(
  c: Campaign,
  sessionId: string,
  link: ObjectLink,
): void {
  const session = c.sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session does not exist.');
  requireLink(c, link);
  if (link.kind === 'session' && link.id === sessionId) return;
  pushLink(session.links, link);
  if (link.kind === 'character' && !session.characterIds.includes(link.id))
    session.characterIds.push(link.id);
  session.updatedAt = now();
}
export type EventInput = Partial<
  Omit<TimelineEvent, 'id' | 'createdAt' | 'updatedAt'>
> & {
  title: string;
};
export function recordEvent(c: Campaign, input: EventInput): TimelineEvent {
  const targetSession = c.sessions.find(
    (s) =>
      s.id ===
      (input.sessionId !== undefined ? input.sessionId : c.currentSessionId),
  );
  const event: TimelineEvent = {
    ...stamp(),
    type: 'custom',
    description: '',
    date: today(),
    inWorldDate: targetSession?.inWorldDate || `Day ${c.campaignDay}`,
    sessionId: c.currentSessionId,
    links: [],
    sourceRefs: [],
    ...structuredClone(input),
  };
  if (event.sessionId && !c.sessions.some((s) => s.id === event.sessionId))
    throw new Error('Event session does not exist.');
  event.links.forEach((link) => requireLink(c, link));
  // Oracle results are a durable snapshot owned by this event, independent of rolling history.
  if (event.oracle) event.oracle.id = id();
  c.timeline.push(event);
  if (event.sessionId)
    for (const link of event.links) linkToSession(c, event.sessionId, link);
  return event;
}
export function createSession(
  c: Campaign,
  input: Partial<Omit<Session, 'id' | 'createdAt' | 'updatedAt'>> = {},
): Session {
  const number = Math.max(0, ...c.sessions.map((s) => s.number ?? 0)) + 1;
  const session: Session = {
    ...stamp(),
    title: `Session ${String(number).padStart(2, '0')}`,
    number,
    date: today(),
    inWorldDate: `Day ${c.campaignDay}`,
    characterIds: [],
    summary: '',
    notes: '',
    status: 'planned',
    links: [],
    encounters: [],
    ...structuredClone(input),
  };
  if (session.status === 'active' && c.currentSessionId)
    throw new Error('End the current Session before starting another.');
  c.sessions.push(session);
  if (session.status === 'active') c.currentSessionId = session.id;
  recordEvent(c, {
    type: 'session',
    title: session.title,
    date: session.date,
    inWorldDate: session.inWorldDate,
    sessionId: session.id,
    links: [{ kind: 'session', id: session.id }],
  });
  return session;
}
export function startSession(c: Campaign, sessionId: string): void {
  const session = c.sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session does not exist.');
  if (c.currentSessionId && c.currentSessionId !== sessionId)
    throw new Error('End the current Session before starting another.');
  session.status = 'active';
  session.updatedAt = now();
  c.currentSessionId = sessionId;
}
export function endSession(
  c: Campaign,
  sessionId: string,
  summary?: string,
): void {
  const session = c.sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error('Session does not exist.');
  if (summary !== undefined) session.summary = summary;
  const wasEnded = session.status === 'ended';
  session.status = 'ended';
  session.updatedAt = now();
  if (!wasEnded)
    recordEvent(c, {
      type: 'session',
      title: `${session.title} — ended`,
      description: session.summary,
      sessionId,
      links: [{ kind: 'session', id: sessionId }],
    });
  if (c.currentSessionId === sessionId) c.currentSessionId = null;
}
const recordBase = (title: string): ChronicleRecord => ({
  ...stamp(),
  title,
  notes: '',
  links: [],
});
export function createThread(
  c: Campaign,
  input: Partial<Omit<CampaignThread, 'id' | 'createdAt' | 'updatedAt'>> & {
    title: string;
  },
  eventContext: Partial<EventInput> = {},
): CampaignThread {
  const record: CampaignThread = {
    ...recordBase(input.title),
    description: '',
    status: 'open',
    ...structuredClone(input),
  };
  record.links.forEach((link) => requireLink(c, link));
  c.threads.push(record);
  recordEvent(c, {
    type: 'thread',
    title: `Thread opened: ${record.title}`,
    links: [{ kind: 'thread', id: record.id }, ...record.links],
    ...structuredClone(eventContext),
  });
  return record;
}
export function createRumor(
  c: Campaign,
  input: Partial<Omit<Rumor, 'id' | 'createdAt' | 'updatedAt'>> & {
    title: string;
  },
  eventContext: Partial<EventInput> = {},
): Rumor {
  const record: Rumor = {
    ...recordBase(input.title),
    description: '',
    status: 'unknown',
    visibility: 'gm',
    ...structuredClone(input),
  };
  record.links.forEach((link) => requireLink(c, link));
  c.rumors.push(record);
  recordEvent(c, {
    type: 'rumor',
    title: `Rumor: ${record.title}`,
    links: [{ kind: 'rumor', id: record.id }, ...record.links],
    ...structuredClone(eventContext),
  });
  return record;
}
export function createRelic(
  c: Campaign,
  input: Partial<Omit<Relic, 'id' | 'createdAt' | 'updatedAt'>> & {
    title: string;
  },
  eventContext: Partial<EventInput> = {},
): Relic {
  const record: Relic = {
    ...recordBase(input.title),
    description: '',
    holder: null,
    origin: null,
    ...structuredClone(input),
  };
  [
    ...record.links,
    ...(record.holder ? [record.holder] : []),
    ...(record.origin ? [record.origin] : []),
  ].forEach((link) => requireLink(c, link));
  c.relics.push(record);
  recordEvent(c, {
    type: 'relic-acquired',
    title: `Relic recorded: ${record.title}`,
    links: [
      { kind: 'relic', id: record.id },
      ...record.links,
      ...(record.holder ? [record.holder] : []),
      ...(record.origin ? [record.origin] : []),
    ],
    ...structuredClone(eventContext),
  });
  return record;
}
export function assignRelic(
  c: Campaign,
  relicId: string,
  holder: ObjectLink | null,
): void {
  const relic = c.relics.find((r) => r.id === relicId);
  if (!relic) throw new Error('Relic does not exist.');
  if (holder) requireLink(c, holder);
  if (
    (!holder && !relic.holder) ||
    (holder && relic.holder && same(holder, relic.holder))
  )
    return;
  relic.holder = holder ? structuredClone(holder) : null;
  relic.updatedAt = now();
  recordEvent(c, {
    type: 'relic-acquired',
    title: holder
      ? `${relic.title} → ${objectLabel(c, holder)}`
      : `${relic.title} — no current keeper`,
    links: [
      { kind: 'relic', id: relic.id },
      ...(holder ? [{ ...holder, relation: 'carried by' }] : []),
    ],
  });
}
export function createJournalNote(
  c: Campaign,
  input: Partial<Omit<JournalNote, 'id' | 'createdAt' | 'updatedAt'>> & {
    title: string;
  },
  eventContext: Partial<EventInput> = {},
): JournalNote {
  const record: JournalNote = {
    ...recordBase(input.title),
    text: '',
    visibility: 'gm',
    ...structuredClone(input),
  };
  record.links.forEach((link) => requireLink(c, link));
  c.journalNotes.push(record);
  recordEvent(c, {
    type: 'note',
    title: record.title,
    links: [{ kind: 'note', id: record.id }, ...record.links],
    ...structuredClone(eventContext),
  });
  return record;
}
export function saveOracleEvent(
  c: Campaign,
  result: OracleResult,
): TimelineEvent {
  if (!result.rolls.length) throw new Error('Roll an Oracle first.');
  return recordEvent(c, {
    type: 'oracle',
    title: result.title,
    description: result.rolls
      .map((r) => `${r.title}: ${r.text} [${r.dice}: ${r.roll}]`)
      .join('\n'),
    oracle: result,
    sourceRefs: result.rolls.map((r) => ({
      tableId: r.oracleId,
      tableTitle: r.title,
      note: r.source,
      roll: r.roll,
      entryId: r.entryId,
    })),
  });
}
export function setDungeonState(
  c: Campaign,
  dungeonId: string,
  state: DungeonPlayState,
): void {
  const dungeon = c.dungeons.find((d) => d.id === dungeonId);
  if (!dungeon) throw new Error('Dungeon does not exist.');
  if (dungeon.playState === state) return;
  dungeon.playState = state;
  dungeon.updatedAt = now();
  recordEvent(c, {
    type: 'dungeon-discovery',
    title: `${dungeon.title} — ${state}`,
    links: [{ kind: 'dungeon', id: dungeonId, relation: state }],
  });
}
export function setRoomState(
  c: Campaign,
  dungeonId: string,
  roomId: string,
  state: RoomPlayState,
): void {
  const dungeon = c.dungeons.find((d) => d.id === dungeonId),
    room = dungeon?.rooms.find((r) => r.id === roomId);
  if (!dungeon || !room)
    throw new Error('Room does not belong to this Dungeon.');
  if (room.playState === state) return;
  room.playState = state;
  dungeon.updatedAt = now();
  if (
    state !== 'hidden' &&
    (!dungeon.playState || dungeon.playState === 'unknown')
  )
    dungeon.playState = 'discovered';
  const link: ObjectLink = {
    kind: 'room',
    id: roomId,
    dungeonId,
    relation: state,
  };
  recordEvent(c, {
    type: 'room-discovery',
    title: `${objectLabel(c, link)} — ${state}`,
    links: [link, { kind: 'dungeon', id: dungeonId, relation: 'visited' }],
  });
}
export function setPlacementState(
  c: Campaign,
  kind: 'monster' | 'npc' | 'encounter',
  placementId: string,
  state: PlacementPlayState,
): void {
  const placement = (
    kind === 'monster'
      ? c.monsterPlacements
      : kind === 'npc'
        ? c.npcPlacements
        : c.encounterPlacements
  ).find((p) => p.id === placementId);
  if (!placement) throw new Error('Placement does not exist.');
  if (placement.playState === state) return;
  placement.playState = state;
  const link: ObjectLink = {
    kind,
    id: 'monsterId' in placement ? placement.monsterId : placement.entityId,
    quantity: placement.quantity,
    relation: state,
  };
  const location: ObjectLink = placement.roomId
    ? { kind: 'room', id: placement.roomId, dungeonId: placement.dungeonId }
    : { kind: 'dungeon', id: placement.dungeonId };
  recordEvent(c, {
    type: 'placement-state',
    title: `${objectLabel(c, link)} ×${placement.quantity} — ${state}`,
    links: [link, location],
  });
}
export function recordDeath(
  c: Campaign,
  kind: 'character' | 'npc',
  entityId: string,
  eventContext: Partial<EventInput> = {},
): void {
  const entity = (kind === 'character' ? c.characters : c.npcs).find(
    (e) => e.id === entityId,
  );
  if (!entity) throw new Error('Character or NPC does not exist.');
  if (entity.status === 'dead') return;
  entity.status = 'dead';
  entity.updatedAt = now();
  if (kind === 'npc')
    for (const p of c.npcPlacements)
      if (p.entityId === entityId) p.playState = 'dead';
  const links = [...(eventContext.links ?? [])];
  if (!links.some((link) => link.kind === kind && link.id === entityId))
    links.unshift({ kind, id: entityId, relation: 'died' });
  recordEvent(c, {
    ...eventContext,
    type: kind === 'character' ? 'character-death' : 'npc-death',
    title: eventContext.title ?? `${entity.name} died`,
    links,
  });
}
export function startSessionEncounter(
  c: Campaign,
  sessionId: string,
  placementId: string,
): SessionEncounter {
  const session = c.sessions.find((s) => s.id === sessionId),
    placement = c.monsterPlacements.find((p) => p.id === placementId);
  const monster =
    placement && c.monsters.find((m) => m.id === placement.monsterId);
  if (!session || !placement || !monster)
    throw new Error('Session, placement or Monster does not exist.');
  const existing = session.encounters.find(
    (e) => e.placementId === placementId && e.state === 'encountered',
  );
  if (existing) return existing;
  const instance: SessionEncounter = {
    id: id(),
    monsterId: monster.id,
    placementId,
    quantity: placement.quantity,
    remaining: placement.quantity,
    morale: monster.morale,
    notes: '',
    state: 'encountered',
  };
  session.encounters.push(instance);
  session.updatedAt = now();
  linkToSession(c, sessionId, {
    kind: 'monster',
    id: monster.id,
    relation: 'encountered',
    quantity: placement.quantity,
  });
  placement.playState = 'encountered';
  recordEvent(c, {
    type: 'placement-state',
    title: `${monster.name} ×${placement.quantity} — encountered`,
    sessionId,
    links: [
      {
        kind: 'monster',
        id: monster.id,
        relation: 'encountered',
        quantity: placement.quantity,
      },
      placement.roomId
        ? { kind: 'room', id: placement.roomId, dungeonId: placement.dungeonId }
        : { kind: 'dungeon', id: placement.dungeonId },
    ],
  });
  return instance;
}
export function updateSessionEncounter(
  c: Campaign,
  sessionId: string,
  instanceId: string,
  patch: Partial<
    Pick<SessionEncounter, 'remaining' | 'morale' | 'notes' | 'state'>
  >,
): void {
  const session = c.sessions.find((s) => s.id === sessionId),
    instance = session?.encounters.find((e) => e.id === instanceId);
  if (!session || !instance)
    throw new Error('Session encounter does not exist.');
  if (
    patch.remaining !== undefined &&
    (!Number.isInteger(patch.remaining) ||
      patch.remaining < 0 ||
      patch.remaining > instance.quantity)
  )
    throw new Error(
      'Remaining creatures must be between zero and the original quantity.',
    );
  const previousState = instance.state;
  Object.assign(instance, patch);
  session.updatedAt = now();
  if (patch.remaining === 0 && !patch.state) instance.state = 'defeated';
  if (instance.state !== previousState) {
    const placement = c.monsterPlacements.find(
      (p) => p.id === instance.placementId,
    );
    if (placement) placement.playState = instance.state;
    recordEvent(c, {
      type: 'placement-state',
      title: `${objectLabel(c, { kind: 'monster', id: instance.monsterId })} — ${instance.state}`,
      sessionId,
      links: [
        {
          kind: 'monster',
          id: instance.monsterId,
          relation: instance.state,
          quantity: instance.quantity,
        },
      ],
    });
  }
}
export function backlinks(
  c: Campaign,
  target: ObjectLink,
): { link: ObjectLink; label: string; detail: string }[] {
  const found: { link: ObjectLink; label: string; detail: string }[] = [];
  const add = (link: ObjectLink, detail: string) => {
    if (!same(link, target))
      found.push({ link, label: objectLabel(c, link), detail });
  };
  for (const session of c.sessions) {
    const related = session.links.filter((link) => same(link, target));
    if (
      related.length ||
      (target.kind === 'character' && session.characterIds.includes(target.id))
    )
      add(
        { kind: 'session', id: session.id },
        related.map((l) => l.relation ?? 'linked').join(', ') || 'participant',
      );
  }
  for (const [kind, records] of [
    ['thread', c.threads],
    ['rumor', c.rumors],
    ['relic', c.relics],
    ['note', c.journalNotes],
  ] as const)
    for (const record of records) {
      const links = [
        ...record.links,
        ...('holder' in record && record.holder
          ? [{ ...record.holder, relation: 'current keeper' }]
          : []),
        ...('origin' in record && record.origin
          ? [{ ...record.origin, relation: 'origin' }]
          : []),
      ].filter((l) => same(l, target));
      if (links.length)
        add(
          { kind, id: record.id },
          links.map((l) => l.relation ?? 'linked').join(', '),
        );
    }
  const addSession = (sessionId: string, detail: string) => {
    if (
      !found.some(
        (entry) => entry.link.kind === 'session' && entry.link.id === sessionId,
      )
    )
      add({ kind: 'session', id: sessionId }, detail);
  };
  for (const event of c.timeline) {
    if (
      event.links.some((link) => same(link, target)) ||
      (target.kind === 'session' && event.sessionId === target.id)
    ) {
      // One entry per source event, even when multiple typed relations point here.
      add({ kind: 'event', id: event.id }, `${event.date} · ${event.type}`);
      if (event.sessionId) addSession(event.sessionId, event.title);
    }
    if (target.kind === 'event' && event.id === target.id && event.sessionId)
      addSession(event.sessionId, 'recorded in this Session');
  }
  if (
    target.kind === 'monster' ||
    target.kind === 'npc' ||
    target.kind === 'encounter'
  ) {
    const placements =
      target.kind === 'monster'
        ? c.monsterPlacements
        : target.kind === 'npc'
          ? c.npcPlacements
          : c.encounterPlacements;
    for (const p of placements)
      if (('monsterId' in p ? p.monsterId : p.entityId) === target.id)
        add(
          p.roomId
            ? { kind: 'room', id: p.roomId, dungeonId: p.dungeonId }
            : { kind: 'dungeon', id: p.dungeonId },
          `×${p.quantity}${p.playState ? ' · ' + p.playState : ''}`,
        );
  }
  if (target.kind === 'npc' || target.kind === 'monster')
    for (const encounter of c.encounters)
      for (const p of encounter.participants)
        if (p.kind === target.kind && p.entityId === target.id)
          add({ kind: 'encounter', id: encounter.id }, `×${p.quantity}`);
  return found;
}
export function chronicleIds(c: Campaign): string[] {
  return [
    ...c.sessions.flatMap((s) => [s.id, ...s.encounters.map((e) => e.id)]),
    ...c.timeline.flatMap((e) => [e.id, ...(e.oracle ? [e.oracle.id] : [])]),
    ...c.threads.map((e) => e.id),
    ...c.rumors.map((e) => e.id),
    ...c.relics.map((e) => e.id),
    ...c.journalNotes.map((e) => e.id),
    ...c.miseries.map((e) => e.id),
    ...(c.mythic?.history ?? []).flatMap((r) => [
      r.id,
      ...(r.event ? [r.event.id] : []),
    ]),
  ];
}
export function chronicleRelationIssues(c: Campaign): string[] {
  const issues: string[] = [];
  const check = (links: ObjectLink[], label: string) => {
    for (const link of links)
      if (!validObjectLink(c, link))
        issues.push(`${label}: missing ${link.kind} reference.`);
  };
  const active = c.sessions.filter((s) => s.status === 'active');
  if (
    active.length > 1 ||
    (c.currentSessionId
      ? active.length !== 1 || active[0].id !== c.currentSessionId
      : active.length !== 0)
  )
    issues.push('Current Session and active status disagree.');
  for (const session of c.sessions) {
    check(session.links, 'Session');
    if (new Set(session.characterIds).size !== session.characterIds.length)
      issues.push('Duplicate Session participant.');
    for (const characterId of session.characterIds)
      if (!c.characters.some((ch) => ch.id === characterId))
        issues.push('Session Character does not exist.');
    for (const instance of session.encounters) {
      if (!c.monsters.some((m) => m.id === instance.monsterId))
        issues.push('Session Monster does not exist.');
      if (
        instance.placementId &&
        !c.monsterPlacements.some(
          (p) =>
            p.id === instance.placementId && p.monsterId === instance.monsterId,
        )
      )
        issues.push('Session encounter placement does not match its Monster.');
    }
  }
  for (const event of c.timeline) {
    check(event.links, 'Timeline');
    if (event.sessionId && !c.sessions.some((s) => s.id === event.sessionId))
      issues.push('Timeline Session does not exist.');
  }
  for (const record of [
    ...c.threads,
    ...c.rumors,
    ...c.relics,
    ...c.journalNotes,
  ])
    check(record.links, 'Record');
  const relicTargets = new Set<ObjectKind>([
    'character',
    'dungeon',
    'room',
    'npc',
    'session',
  ]);
  for (const relic of c.relics)
    for (const link of [relic.holder, relic.origin])
      if (link) {
        check([link], 'Relic');
        if (!relicTargets.has(link.kind))
          issues.push(
            'Relic keeper/origin must be a Character, Dungeon, Room, NPC or Session.',
          );
      }
  const rolls = c.miseries.flatMap((m) => (m.roll === null ? [] : [m.roll]));
  if (new Set(rolls).size !== rolls.length)
    issues.push('A Misery cannot repeat.');
  c.miseries.forEach((m, index) => {
    if (m.sessionId && !c.sessions.some((s) => s.id === m.sessionId))
      issues.push('Misery Session does not exist.');
    if (
      m.terminal !== (index === 6) ||
      (index === 6 ? m.roll !== 77 : m.roll === 77)
    )
      issues.push('Only the seventh Misery is terminal 7:7.');
  });
  const w = c.workspace;
  if (w.sessionId && !c.sessions.some((s) => s.id === w.sessionId))
    issues.push('Selected Session does not exist.');
  if (
    w.chronicleId &&
    ![
      ...c.sessions,
      ...c.timeline,
      ...c.threads,
      ...c.rumors,
      ...c.relics,
      ...c.journalNotes,
    ].some((e) => e.id === w.chronicleId)
  )
    issues.push('Selected chronicle record does not exist.');
  if (w.playDungeonId && !c.dungeons.some((d) => d.id === w.playDungeonId))
    issues.push('Play Dungeon does not exist.');
  if (
    w.playRoomId &&
    !c.dungeons
      .find((d) => d.id === w.playDungeonId)
      ?.rooms.some((r) => r.id === w.playRoomId)
  )
    issues.push('Play Room does not belong to the Play Dungeon.');
  return issues;
}
/** Explicit deletion removes references while retaining the written historical event itself. */
export function pruneChronicleReferences(c: Campaign): void {
  const prune = (links: ObjectLink[]) =>
    links.filter((link) => validObjectLink(c, link));
  for (const session of c.sessions) {
    session.links = prune(session.links);
    session.characterIds = session.characterIds.filter((id) =>
      c.characters.some((ch) => ch.id === id),
    );
    session.encounters = session.encounters.filter((e) =>
      c.monsters.some((m) => m.id === e.monsterId),
    );
    for (const instance of session.encounters)
      if (!c.monsterPlacements.some((p) => p.id === instance.placementId))
        instance.placementId = null;
  }
  for (const event of c.timeline) {
    event.links = prune(event.links);
    if (!c.sessions.some((s) => s.id === event.sessionId))
      event.sessionId = null;
  }
  for (const record of [
    ...c.threads,
    ...c.rumors,
    ...c.relics,
    ...c.journalNotes,
  ])
    record.links = prune(record.links);
  for (const relic of c.relics) {
    if (relic.holder && !validObjectLink(c, relic.holder)) relic.holder = null;
    if (relic.origin && !validObjectLink(c, relic.origin)) relic.origin = null;
  }
  for (const misery of c.miseries)
    if (!c.sessions.some((s) => s.id === misery.sessionId))
      misery.sessionId = null;
  if (!c.sessions.some((s) => s.id === c.currentSessionId))
    c.currentSessionId = null;
  const w = c.workspace;
  if (!c.sessions.some((s) => s.id === w.sessionId)) w.sessionId = null;
  if (
    ![
      ...c.sessions,
      ...c.timeline,
      ...c.threads,
      ...c.rumors,
      ...c.relics,
      ...c.journalNotes,
    ].some((e) => e.id === w.chronicleId)
  )
    w.chronicleId = null;
  if (!c.dungeons.some((d) => d.id === w.playDungeonId)) w.playDungeonId = null;
  if (
    !c.dungeons
      .find((d) => d.id === w.playDungeonId)
      ?.rooms.some((r) => r.id === w.playRoomId)
  )
    w.playRoomId = null;
}
export function deleteChronicleRecord(
  c: Campaign,
  kind: 'session' | 'thread' | 'rumor' | 'relic' | 'note' | 'event',
  recordId: string,
): void {
  if (kind === 'session')
    c.sessions = c.sessions.filter((s) => s.id !== recordId);
  else if (kind === 'thread')
    c.threads = c.threads.filter((s) => s.id !== recordId);
  else if (kind === 'rumor')
    c.rumors = c.rumors.filter((s) => s.id !== recordId);
  else if (kind === 'relic')
    c.relics = c.relics.filter((s) => s.id !== recordId);
  else if (kind === 'note')
    c.journalNotes = c.journalNotes.filter((s) => s.id !== recordId);
  else c.timeline = c.timeline.filter((s) => s.id !== recordId);
  pruneChronicleReferences(c);
}
export function remapChronicle(
  c: Campaign,
  replace: (old: string) => string,
): void {
  const remapLink = (link: ObjectLink) => {
    link.id = replace(link.id);
    if (link.dungeonId) link.dungeonId = replace(link.dungeonId);
  };
  for (const session of c.sessions) {
    session.id = replace(session.id);
    session.characterIds = session.characterIds.map(replace);
    session.links.forEach(remapLink);
    for (const e of session.encounters) {
      e.id = replace(e.id);
      e.monsterId = replace(e.monsterId);
      if (e.placementId) e.placementId = replace(e.placementId);
    }
  }
  for (const event of c.timeline) {
    event.id = replace(event.id);
    event.links.forEach(remapLink);
    if (event.sessionId) event.sessionId = replace(event.sessionId);
    if (event.oracle) event.oracle.id = replace(event.oracle.id);
  }
  for (const record of [
    ...c.threads,
    ...c.rumors,
    ...c.relics,
    ...c.journalNotes,
  ]) {
    record.id = replace(record.id);
    record.links.forEach(remapLink);
  }
  for (const relic of c.relics) {
    if (relic.holder) remapLink(relic.holder);
    if (relic.origin) remapLink(relic.origin);
  }
  for (const misery of c.miseries) {
    misery.id = replace(misery.id);
    if (misery.sessionId) misery.sessionId = replace(misery.sessionId);
  }
  if (c.currentSessionId) c.currentSessionId = replace(c.currentSessionId);
  for (const key of [
    'sessionId',
    'chronicleId',
    'playDungeonId',
    'playRoomId',
  ] as const)
    if (c.workspace[key]) c.workspace[key] = replace(c.workspace[key]!);
}
