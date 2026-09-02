/** No generated values are rolled during migration; original prose stays intact. */
export function upgradeCampaignMonsters(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const c = structuredClone(input) as Record<string, unknown>;
  const upgrade = (raw: unknown) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const m = raw as Record<string, unknown>;
    if ('attacks' in m) return m;
    if (
      typeof m.hp !== 'number' ||
      typeof m.attack !== 'string' ||
      typeof m.damage !== 'string'
    )
      return m;
    const sources =
      m.sources && typeof m.sources === 'object'
        ? (m.sources as Record<string, string>)
        : {};
    const list = (value: unknown, key: string) =>
      typeof value === 'string'
        ? value
          ? [
              {
                id: crypto.randomUUID(),
                text: value,
                source: sources[key] ?? '이전 저장 원문',
                ...(key === 'specialAbility' &&
                /FERETORY/.test(sources[key] ?? '')
                  ? { tableId: 'feretory.trait' }
                  : {}),
              },
            ]
          : []
        : value;
    const { attack, damage, specialAbility, behaviour, ...rest } = m;
    return {
      ...rest,
      campaignId: c.id,
      behavior: behaviour ?? '',
      description: m.description ?? '',
      attacks:
        attack || damage
          ? [
              {
                id: crypto.randomUUID(),
                name: attack,
                damage,
                description: '',
                sources: {
                  name: sources.attack ?? '이전 저장 원문',
                  damage: sources.damage ?? '이전 저장 원문',
                },
                ...(typeof (m.generation as { system?: string })?.system ===
                  'string' &&
                (m.generation as { system: string }).system.startsWith(
                  'feretory',
                )
                  ? { tableId: 'feretory.stats' }
                  : {}),
              },
            ]
          : [],
      special: list(specialAbility, 'specialAbility'),
      weakness: list(m.weakness, 'weakness'),
      loot: list(m.loot, 'loot'),
      sources: { ...sources, behavior: sources.behaviour ?? '이전 저장 원문' },
    };
  };
  if (!('monsters' in c)) c.monsters = [];
  if (Array.isArray(c.monsters)) c.monsters = c.monsters.map(upgrade);
  if (c.drafts && typeof c.drafts === 'object') {
    const drafts = c.drafts as Record<string, unknown>;
    drafts.monsters = drafts.monsters ? upgrade(drafts.monsters) : null;
  }
  if (!('monsterPlacements' in c)) {
    const placements: unknown[] = [];
    if (Array.isArray(c.dungeons))
      for (const d of c.dungeons as Array<Record<string, unknown>>) {
        const rooms = Array.isArray(d.rooms)
          ? (d.rooms as Array<Record<string, unknown>>)
          : [];
        const placed = new Set<string>();
        for (const r of rooms)
          if (Array.isArray(r.monsterIds))
            for (const monsterId of r.monsterIds) {
              placements.push({
                id: crypto.randomUUID(),
                monsterId,
                dungeonId: d.id,
                roomId: r.id,
                quantity: 1,
                notes: '',
              });
              placed.add(monsterId);
            }
        if (Array.isArray(d.monsterIds))
          for (const monsterId of d.monsterIds)
            if (!placed.has(monsterId))
              placements.push({
                id: crypto.randomUUID(),
                monsterId,
                dungeonId: d.id,
                roomId: null,
                quantity: 1,
                notes: '',
              });
      }
    c.monsterPlacements = placements;
  }
  return c;
}
