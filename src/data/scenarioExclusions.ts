/** Scenario-bound rolls removed at the user's request. Exact source IDs keep
 * general dungeon and regional tables intact. Original bundles remain archival.
 */
export const SCENARIO_TABLE_IDS = [
  // Graves Left Wanting — HERETIC.
  'heretic.gravesRandomEncounter',
  'heretic.gravesSensoryStrangeness',
  'heretic.gravesTrails',
  'heretic.gravesKnowledge',
  'heretic.gravesLootBodies',
  'heretic.gravesUrn',
  'heretic.gravesUnkeyStrongbox',
  'heretic.ubertaker.action',
  // Sepulchre of the Swamp Witch / Nurse the Rot — HERETIC.
  'heretic.swampWitch.wishes',
  'heretic.swampWitch.rumors',
  'heretic.nurse.corridorNorth',
  // Rotblack Sludge — full Core adventure, not Bare Bones rules.
  'core-full.rotblack.encountersA',
  'core-full.rotblack.encountersB',
  'core-full.rotblack.books',
  'core-full.rotblack.ransack',
  'core-full.rotblack.fletcherPowers',
  // Sölitary Defilement's example dungeon and Scumslaughter Farm.
  'sd.example.dr10.common',
  'sd.example.dr10.rare',
  'sd.example.farmwife.action',
  // The Death Ziggurat — FERETORY, PDF 28–29.
  'feretory.flowerEffects',
  'feretory.ruinTypes',
  'feretory.minorTreasures',
  'feretory.majorTreasures',
  'feretory.searchingRuins',
  'feretory.ruinsRandomEvents',
  // Goblin Grinder — FERETORY, PDF 38–47.
  'feretory.goblinGrinderHooks',
  'feretory.lickLiquid',
  'feretory.alchemyTables',
] as const;

export function isScenarioTable(id: string): boolean {
  return SCENARIO_TABLE_IDS.some(
    (root) => id === root || id.startsWith(`${root}.`),
  );
}

export function isScenarioReference(id: string): boolean {
  return (
    id === 'procedure:heretic.graves-loot-bodies' ||
    (id.startsWith('oracle:') && isScenarioTable(id.slice(7)))
  );
}
