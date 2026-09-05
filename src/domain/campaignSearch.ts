import type { Campaign, Workspace } from './types';
import { regionById } from '../data/regions';
import { objectLinks } from './chronicleOperations';
import { objectWorkspace } from '../components/ChronicleLinks';
export interface SearchResult {
  title: string;
  detail: string;
  patch: Partial<Workspace>;
}
export function searchCampaign(c: Campaign, q: string): SearchResult[] {
  if (!q.trim()) return [];
  const query = q.toLowerCase();
  const results: SearchResult[] = [];
  const matches = (...s: string[]) => s.join(' ').toLowerCase().includes(query);
  for (const d of c.dungeons) {
    if (matches(d.title, d.premise, d.inhabitants))
      results.push({
        title: d.title,
        detail: `던전 · ${regionById(d.region).name}`,
        patch: {
          section: 'dungeons',
          dungeonId: d.id,
          roomId: null,
          dungeonTab: 'overview',
        },
      });
    if (d.notes && matches(d.notes))
      results.push({
        title: d.title,
        detail: '던전 노트',
        patch: {
          section: 'dungeons',
          dungeonId: d.id,
          roomId: null,
          dungeonTab: 'notes',
        },
      });
    for (const r of d.rooms)
      if (
        matches(
          r.name,
          `Room ${d.rooms.indexOf(r) + 1} Room ${String(d.rooms.indexOf(r) + 1).padStart(2, '0')} 방 ${d.rooms.indexOf(r) + 1}`,
          r.notes,
          r.description,
          r.encounter,
          r.feature,
          r.danger,
          r.treasure,
        )
      )
        results.push({
          title: r.name || '이름 없는 방',
          detail: `방 ${d.rooms.indexOf(r) + 1} · ${d.title}`,
          patch: {
            section: 'dungeons',
            dungeonId: d.id,
            roomId: r.id,
            dungeonTab: 'rooms',
          },
        });
  }
  for (const kind of ['characters', 'monsters', 'npcs', 'encounters'] as const)
    for (const e of c[kind])
      if (
        matches(
          ...Object.values(e).filter((v): v is string => typeof v === 'string'),
          ...('attacks' in e
            ? [
                ...e.attacks.map(
                  (a) => `${a.name} ${a.damage} ${a.description}`,
                ),
                ...e.special.map((s) => s.text),
                ...e.weakness.map((s) => s.text),
                ...e.loot.map((s) => s.text),
              ]
            : []),
          ...('weapons' in e
            ? [...e.weapons, ...e.equipment, ...e.traits].map(
                (item) => item.text,
              )
            : []),
        )
      )
        results.push({
          title: e.name || 'Untitled',
          detail: {
            npcs: 'NPC',
            characters: '캐릭터',
            monsters: '몬스터',
            encounters: '조우',
          }[kind],
          patch: {
            section: kind,
            stockingKind: kind === 'npcs' ? 'npcs' : 'encounters',
            selected: { ...c.workspace.selected, [kind]: e.id },
          },
        });
  if (matches(c.notes))
    results.push({
      title: '캠페인 노트',
      detail: c.title,
      patch: { section: 'notes' },
    });
  for (const { link, label } of objectLinks(c)) {
    if (
      !['session', 'thread', 'rumor', 'relic', 'note', 'event'].includes(
        link.kind,
      )
    )
      continue;
    const record = (
      link.kind === 'session'
        ? c.sessions
        : link.kind === 'thread'
          ? c.threads
          : link.kind === 'rumor'
            ? c.rumors
            : link.kind === 'relic'
              ? c.relics
              : link.kind === 'event'
                ? c.timeline
                : c.journalNotes
    ).find((e) => e.id === link.id);
    if (
      record &&
      matches(
        label,
        ...Object.values(record).filter(
          (v): v is string => typeof v === 'string',
        ),
      )
    )
      results.push({
        title: label,
        detail: (
          {
            session: '세션',
            thread: '실마리',
            rumor: '소문',
            relic: '유물',
            note: '기록',
            event: '사건',
          } as Record<string, string>
        )[link.kind],
        patch: objectWorkspace(c, link),
      });
  }
  return results;
}
