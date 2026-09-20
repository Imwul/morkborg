// Reviewed existing helper outputs, NOT translations or aliases. Fingerprints
// guard both source title and output: changed pack text requires a fresh review.
// Per-item source owners and reasons: docs/display-translation-integrity/report.md
// and the private outputs/display-translation-integrity/tier-c-audit.json.
export type ReviewedHelperClass = 'useful' | 'misowned' | 'malformed';
const reviews: Readonly<
  Record<string, readonly [string, ReviewedHelperClass]>
> = {
  'oracle:core.sparks': ['3811ba783aac12e3', 'malformed'],
  'oracle:reclvse.dungeonEntrance': ['46f13614d04d7028', 'useful'],
  'oracle:reclvse.entranceHazard': ['d2261483a04b2356', 'useful'],
  'oracle:reclvse.entranceSounds': ['8adedb8a7d29a116', 'useful'],
  'oracle:reclvse.roomShape': ['4d1641f9fe48b366', 'malformed'],
  'oracle:reclvse.sounds': ['b757691c8504ff41', 'useful'],
  'oracle:reclvse.immediateGoal': ['b6e6261ad47678d9', 'useful'],
  'oracle:reclvse.encounterAftermath': ['ec6bba2accecf00f', 'useful'],
  'oracle:reclvse.npcAppearance': ['7817b7c5ae4d5e6d', 'useful'],
  'oracle:sd.yesNo': ['bec0423f01cb8847', 'malformed'],
  'oracle:depths.region.tveland.discovery': ['fe839699c4757a97', 'useful'],
  'oracle:depths.region.sarkash.discovery': ['474925c535137b77', 'useful'],
  'oracle:depths.region.graven_tosk.discovery': ['ac96e7788f89b64b', 'useful'],
  'oracle:depths.region.lake_onda.discovery': ['0800d1d8b3a75f9f', 'useful'],
  'oracle:depths.region.valley_unfortunate_undead.discovery': [
    'f2680ce33f2629e5',
    'useful',
  ],
  'oracle:depths.region.bergen_chrypt.discovery': [
    '5a1f406e3e261a97',
    'useful',
  ],
  'oracle:depths.region.wastland.discovery': ['75971e01a354fc41', 'useful'],
  'oracle:depths.region.kergus.discovery': ['b7404c456b963123', 'useful'],
  'oracle:depths.danger': ['96fd395e68c410af', 'malformed'],
  'oracle:mythic2.meaning.character-appearance': [
    '0beb200c103de893',
    'malformed',
  ],
  'oracle:mythic2.meaning.cryptic-message': ['7b1cdeeca76f3cd5', 'useful'],
  'oracle:mythic2.meaning.curses': ['97050870bef4fafa', 'misowned'],
  'oracle:mythic2.meaning.dungeon-traps': ['ad2da911bc68c9f6', 'useful'],
  'oracle:mythic2.meaning.noble-house': ['81b10d8ad6cc7e6d', 'malformed'],
  'oracle:depths.randomEventFocus': ['adf8eb0d63d2b057', 'malformed'],
  'oracle:depths.traps.special': ['fb8b7e21b6170a1e', 'malformed'],
  'oracle:reclvse.street_shape': ['71a972d2ae8c8cb5', 'malformed'],
  'oracle:reclvse.street_features': ['2185cd4c6233d907', 'useful'],
  'oracle:reclvse.street_activity': ['30eed8e34cb4f2b4', 'useful'],
  'oracle:reclvse.interior_atmosphere': ['5d118f5fc01de94d', 'useful'],
  'oracle:reclvse.hidden_element': ['c2dd4f14d13d8a4f', 'malformed'],
  'oracle:reclvse.unnatural_weather': ['58a753512ee09dcf', 'useful'],
  'oracle:reclvse.homeFeatures': ['ddcbd244f8ca10b8', 'useful'],
  'oracle:core.failedMorale': ['e5103e9962c29dd6', 'useful'],
  'oracle:core.brokenInjury': ['8c401679a4568d72', 'malformed'],
  'oracle:core.foulPsychompomp': ['20d8639b3f3c8e29', 'malformed'],
  'oracle:core.gutterbornScumSpecialty': ['d16c2e52c68055a9', 'useful'],
  'oracle:feretory.blackSaltWindIntensity': ['5485d7e45855321a', 'malformed'],
  'oracle:feretory.deadGodGifts': ['e704bafb0e97a297', 'malformed'],
  'oracle:aitc.city-crawl-failure': ['3cf0da153ebe5111', 'malformed'],
  'oracle:aitc.npc-musician': ['c58d261e436d0bca', 'useful'],
  'oracle:aitc.npc-prophet': ['cf4b57afca0885e2', 'useful'],
  'oracle:aitc.npc-beggar': ['59e3ef5917f8bcd6', 'useful'],
  'oracle:aitc.npc-wound': ['146c419540eda76c', 'useful'],
  'oracle:aitc.npc-servant': ['8ab1afa86c1d306f', 'useful'],
  'oracle:aitc.npc-pilgrim': ['2232cb093ea3dc02', 'useful'],
  'oracle:aitc.npc-poet': ['d0540450159b7b18', 'useful'],
  'definition:core.occultHerbmasterDecoctions:1': [
    '55e499b1478aae74',
    'useful',
  ],
  'definition:core.occultHerbmasterDecoctions:8': [
    'f958e33987bb6ca0',
    'useful',
  ],
  'definition:core.esotericHermitItem:6': ['1e8498a3f33bba58', 'malformed'],
  'definition:core.wretchedRoyaltyItems:6': ['aec407cd2560c26b', 'useful'],
  'creature:core:58:seth': ['1ebf58152851a024', 'useful'],
  'creature:core:58:bent': ['13b95f04610661f3', 'useful'],
  'creature:core:59:zukuma': ['98a9abd88524503f', 'useful'],
  'creature:core:59:wrat': ['4fc338ae56fa03ce', 'useful'],
  'creature:core:60:belze': ['6c8c2cfe54b8afee', 'useful'],
  'creature:core:60:lich': ['8fdab286df49a399', 'useful'],
  'creature:core:60:arbint': ['38c0815b9beb6354', 'useful'],
  'creature:core:61:nodh': ['438aaf356a206c09', 'useful'],
  'creature:core:61:lady-porcelain': ['23aba1cac873473c', 'useful'],
  'creature:core:62:aland': ['235098e0e5bcfdec', 'useful'],
  'creature:core:62:eulotha': ['1b8e2d06d965f96a', 'useful'],
  'creature:heretic:60:the-bone-bowyer': ['67ccf78800d40cba', 'useful'],
  'creature:heretic:62:borg-bitor': ['108875da23b303fb', 'useful'],
  'creature:heretic:64:rotten-nurse': ['2c31c339b4185799', 'useful'],
  'creature:heretic:23:half-billed-raven': ['f731cdee56eb84e0', 'useful'],
  'creature:heretic:23:rotted-skeleton': ['dd0301d45c50c5c5', 'useful'],
  'creature:heretic:23:widow-wraith': ['0dd31b8e0e25ee1b', 'useful'],
  'creature:heretic:23:unbred-mutt': ['7ca94071f1e9e81b', 'useful'],
  'creature:heretic:23:hungry-zombie': ['c81a4b72637bcd6a', 'useful'],
  'creature:heretic:25:fogbound-skeleton': ['e29eee1b51b2488d', 'useful'],
  'creature:heretic:27:twice-grown-corpse-fly': ['a7603f5f50ac7bdc', 'useful'],
  'creature:heretic:33:the-ubertaker': ['4988c7dd8e7133bf', 'useful'],
  'creature:heretic:34:ratbadger': ['df1dc6da4298c08b', 'useful'],
  'creature:heretic:34:fleshy-automaton': ['170f21c8b48c7d38', 'useful'],
  'creature:heretic:35:silas': ['8dc73a87865a8edd', 'useful'],
  'creature:heretic:66:toothless-hag': ['5a732cfcd474e76c', 'useful'],
  'creature:heretic:66:old-dormant-sludger': ['f246116d038f61ca', 'useful'],
  'creature:heretic:67:weak-kobolth': ['fdfad227c451f6d6', 'useful'],
  'creature:core:core.outcast.prowler': ['bea089e6699a7da1', 'useful'],
  'creature:core:core.outcast.pale-one': ['4e610bc13699bb91', 'useful'],
  'creature:core:core.outcast.earthbound': ['892a4cfa9dc88ff9', 'useful'],
  'procedure:city.crawl': ['3ee1f66a52945505', 'malformed'],
};

// A deterministic change detector, not a security or canonical-integrity hash.
function fingerprint(text: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i++)
    hash = BigInt.asUintN(
      64,
      (hash ^ BigInt(text.charCodeAt(i))) * 0x100000001b3n,
    );
  return hash.toString(16).padStart(16, '0');
}
export function reviewedDisplayHelper(
  id: string,
  source: string,
  output: string,
): ReviewedHelperClass | undefined {
  const review = reviews[id];
  return review?.[0] === fingerprint(`${source}\0${output}`)
    ? review[1]
    : undefined;
}
