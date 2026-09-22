import type { Character, CharacterItem, CharacterWeapon } from '../domain/types';
import type { ScvmPack } from '../domain/scvmPack';
import { rollScvm, SCVM_URL } from '../domain/scvmPack';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { id, now, random, type RandomSource } from './random';

const provenance = (text: string, homebrew: boolean): GeneratedValueProvenance => ({
  classification: 'APP_DERIVED',
  origin: 'source',
  status: 'PARTIAL',
  sourceRefs: [
    {
      bookTitle: 'SCVMBIRTHER',
      tableTitle: homebrew ? 'SCVMBIRTHER homebrew' : 'SCVMBIRTHER',
      note: SCVM_URL,
    },
  ],
  sourceText: text ? [text] : [],
  transformation:
    'Private SCVMBIRTHER snapshot rendered in the campaign sheet. Not a rulebook page.',
  procedureId: homebrew ? 'scvmbirther-homebrew' : 'scvmbirther',
  authority: [
    {
      kind: 'APP_POLICY',
      id: 'private-scvmbirther',
      description: 'Explicit private-host snapshot of SCVMBIRTHER.',
    },
  ],
});
const line = (text: string, homebrew: boolean): CharacterItem => ({
  id: id(),
  text,
  source: 'SCVMBIRTHER',
  provenance: provenance(text, homebrew),
});

export function generateScvmCharacter(
  campaignId: string,
  pack: ScvmPack,
  homebrew = false,
  rng: RandomSource = random,
): Character {
  const rolled = rollScvm(pack, rng, { homebrew });
  const stamp = provenance(rolled.description, homebrew);
  const time = now();
  const weapon = (text: string): CharacterWeapon => ({
    ...line(text, homebrew),
    damage: text.match(/d\d+(?:\s*\+\s*\d+)?/i)?.[0]?.replace(/\s/g, '') ?? '—',
  });
  return {
    id: id(),
    campaignId,
    name: rolled.name,
    notes: '',
    createdAt: time,
    updatedAt: time,
    className: rolled.className,
    classSource: pack.source.attribution,
    classId: undefined,
    hp: rolled.hp,
    maxHp: Math.max(1, rolled.hp),
    ...rolled.abilities,
    omens: rolled.omens,
    silver: rolled.silver,
    armor: rolled.armor,
    weapons: rolled.weapons.map(weapon),
    equipment: rolled.equipment.map((text) => line(text, homebrew)),
    traits: rolled.traits.map((trait) =>
      line(pack.messages[trait] ? traitText(pack, trait) : trait, homebrew),
    ),
    background: rolled.origin ? [line(rolled.origin, homebrew)] : [],
    classFeatures: rolled.powers.map((power) =>
      line(
        power.description ? `${power.title} — ${power.description}` : power.title,
        homebrew,
      ),
    ),
    description: rolled.description,
    status: 'alive',
    sources: {
      name: pack.source.attribution,
      className: pack.source.attribution,
    },
    fieldProvenance: {
      name: provenance(rolled.name, homebrew),
      className: stamp,
      description: stamp,
    },
    generation: {
      system: homebrew ? 'scvmbirther-homebrew' : 'scvmbirther',
      rolls: { hp: rolled.hp, omens: rolled.omens, silver: rolled.silver },
    },
  };
}
function traitText(pack: ScvmPack, key: string) {
  return pack.messages[key]?.replaceAll('*', '') ?? key;
}
