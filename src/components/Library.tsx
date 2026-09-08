import type { LibraryKind } from '../domain/types';

export type Confirm = (
  title: string,
  description: string,
  action: () => void,
) => void;
export const singular: Record<LibraryKind, string> = {
  characters: '캐릭터',
  monsters: '몬스터',
  npcs: 'NPC',
  encounters: '조우',
};
