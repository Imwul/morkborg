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
      '세계에 남은 가장 거대한 도시. 대사제 Jila Migle가 다스리며 Cathedral of the Two-Headed Basilisks가 자리합니다.',
    tags: ['cathedral', 'urban', 'cult', 'sewer', 'authority'],
  },
  {
    id: 'sarkash',
    name: 'Sarkash',
    description:
      '뒤엉킨 가시덤불과 치명적인 생물로 가득한, 사악하고 무성하며 위험한 숲.',
    tags: ['forest', 'root', 'beast', 'overgrowth', 'isolation'],
  },
  {
    id: 'graven-tosk',
    name: 'Graven-Tosk',
    description:
      '죽어 가는 나무와 무겁고 숨 막히는 공기에 둘러싸인 오래된 묘지이자 집단 무덤.',
    tags: ['tomb', 'corpse', 'grave', 'funerary', 'suffocation'],
  },
  {
    id: 'grift',
    name: 'Grift',
    description:
      '동쪽 반도의 폐허가 된 우울한 도시국가. 조롱받는 왕 Sigfúm the Kind가 다스립니다.',
    tags: ['ruin', 'coast', 'melancholy', 'nobility', 'abandoned'],
  },
  {
    id: 'kergus',
    name: 'Kergüs',
    description:
      '피의 백작부인 Anthelia가 다스리는 북쪽의 얼어붙은 황무지. 검은 유리와 흑요석으로 된 첨탑 도시가 솟아 있습니다.',
    tags: ['frost', 'ice', 'blood', 'isolation', 'glass'],
  },
  {
    id: 'wastland',
    name: 'Wästland',
    description:
      '왕 Fathu the Ninth가 다스리는 서쪽의 지역이자 왕국. Lake Onda와 식인 무리로 알려져 있습니다.',
    tags: ['lake', 'wilderness', 'cannibal', 'settlement'],
  },
  {
    id: 'valley-undead',
    name: 'The Valley of the Unfortunate Undead',
    description:
      '안식하지 못하는 시체와 좀비가 들끓는다는 소문이 도는 음산한 계곡.',
    tags: ['undead', 'corpse', 'plague', 'battlefield', 'necromancy'],
  },
];
export const regionById = (id: RegionId): Region =>
  regions.find((r) => r.id === id)!;
