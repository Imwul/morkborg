// Legacy prose is kept intact: separators can be part of an item's rules.
export function upgradeCampaignCharacters(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const c = structuredClone(input) as Record<string, unknown>;
  const upgrade = (raw: unknown) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
    const ch = raw as Record<string, unknown>;
    if ('className' in ch) return ch;
    if (typeof ch.archetype !== 'string' || typeof ch.hp !== 'number')
      return ch;
    const sources =
      ch.sources && typeof ch.sources === 'object'
        ? (ch.sources as Record<string, string>)
        : {};
    const items = (value: unknown, source?: string, weapon = false) =>
      typeof value === 'string'
        ? value
          ? [
              {
                id: crypto.randomUUID(),
                text: value,
                slot: 'legacy',
                source: source ?? '이전 저장 원문',
                ...(weapon ? { damage: '' } : {}),
              },
            ]
          : []
        : value;
    const { archetype, ...rest } = ch;
    return {
      ...rest,
      campaignId: c.id,
      className: archetype,
      classSource: sources.archetype,
      maxHp: Math.max(1, ch.hp),
      weapons: items(ch.weapons, sources.weapons, true),
      equipment: items(ch.equipment, sources.equipment),
      traits: [],
      status:
        ch.status === 'Alive'
          ? 'alive'
          : ch.status === 'Dead'
            ? 'dead'
            : ch.status,
      sources: {
        ...sources,
        className: sources.archetype ?? '이전 저장 원문',
        maxHp:
          '이전 저장에 최대 HP 없음 · 기존 HP로 임시 초기화, 직접 확인 필요',
      },
    };
  };
  if (!('characters' in c)) c.characters = [];
  if (Array.isArray(c.characters)) c.characters = c.characters.map(upgrade);
  if (c.drafts && typeof c.drafts === 'object') {
    const drafts = c.drafts as Record<string, unknown>;
    drafts.characters = drafts.characters ? upgrade(drafts.characters) : null;
  }
  return c;
}
