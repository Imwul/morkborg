import type { RegionId } from '../domain/types';
export interface Region {
  id: RegionId;
  name: string;
  description: string;
  tags: string[];
}
export const regions: Region[] = [
  {
    id: 'galgenbeck',
    name: 'Galgenbeck',
    description:
      'Tveland의 거대한 도시. Cathedral of the Two-Headed Basilisks가 자리하고 있습니다.',
    tags: ['urban', 'cult'],
  },
  {
    id: 'sarkash',
    name: 'Sarkash',
    description: '뒤엉킨 가시덤불과 위험한 생물로 가득한 숲.',
    tags: ['forest', 'roots'],
  },
  {
    id: 'graven-tosk',
    name: 'Graven-Tosk',
    description: '죽어 가는 나무에 둘러싸인 오래된 묘지와 집단 무덤.',
    tags: ['grave', 'corpse'],
  },
  {
    id: 'grift',
    name: 'Grift',
    description: '동쪽 반도의 쇠락한 도시국가. Sigfúm the Kind가 다스립니다.',
    tags: ['coast', 'ruin'],
  },
  {
    id: 'kergus',
    name: 'Kergüs',
    description: 'Anthelia가 다스리는 북쪽의 얼어붙은 땅.',
    tags: ['ice', 'frost'],
  },
  {
    id: 'wastland',
    name: 'Wästland',
    description: 'Lake Onda와 식인 무리가 있는 서쪽의 땅.',
    tags: ['wilderness', 'cannibal'],
  },
  {
    id: 'valley-undead',
    name: 'The Valley of the Unfortunate Undead',
    description: '안식하지 못하는 시체와 언데드가 떠도는 계곡.',
    tags: ['undead', 'plague'],
  },
];
export const regionById = (id: RegionId): Region =>
  regions.find((r) => r.id === id)!;
