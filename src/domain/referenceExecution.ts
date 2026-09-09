import type { OracleRegistry, OracleResult } from './oracle';
import type { Monster, NPC, RegionId, SourceReference } from './types';
import type { RulesPack } from '../storage/rulesStore';
import {
  rollRegionalReference,
  rollRegionalTableReference,
  regionTableId,
  findReferenceCreature,
  creatureReferenceId,
  type ReferenceEntry,
} from './references';
import { rollProcedure } from '../generators/oracleRoller';
import { id, type RandomSource } from '../generators/random';
import {
  rollEatPreyKillPreset,
  loadMonsterPreset,
} from '../generators/monster';
import {
  createNPC,
  createEncounter,
  encounterTable,
} from '../generators/content';
import { rollCityReference } from './cityReference';
import { appPolicy, sourceProcedure } from './generationAuthority';
import { referenceCreatureRecords } from './creatureReferences';
import { wildWickheadBlocks } from './wildWickheadReference';
import {
  drawRareMonster,
  checkEncounterLevel,
  type PlayingCard,
} from './depthsProcedures';
import {
  oracleReadingText,
  feretoryResultBlock,
  oracleFollowUpLinks,
  type ReferenceReading,
} from './referenceReading';
export function refsForOracle(
  result: OracleResult,
  registry: OracleRegistry,
): SourceReference[] {
  return result.rolls.flatMap((roll) => {
    if (roll.metadata?.provenance?.sourceRefs.length)
      return roll.metadata.provenance.sourceRefs;
    const table = registry.tables.find(
      (t) =>
        t.id ===
        (typeof roll.metadata?.sourceTableId === 'string'
          ? roll.metadata.sourceTableId
          : roll.oracleId),
    );
    if (!table)
      return { tableTitle: roll.title, note: roll.source, roll: roll.roll };
    return {
      bookId: table.sourceBookId,
      bookTitle: registry.books.find((b) => b.id === table.sourceBookId)?.title,
      tableId: table.id,
      tableTitle: roll.entryId == null ? roll.title : table.title,
      ...(roll.entryId == null
        ? {
            note:
              typeof roll.metadata?.procedureNote === 'string'
                ? roll.metadata.procedureNote
                : roll.dice + ' · 절차의 수량 판정',
          }
        : {}),
      pdfPage: table.sourcePage,
      printedPage: table.printedPage,
      roll: roll.roll,
      entryId: roll.entryId,
    };
  });
}
function monsterBlocks(m: Monster): ReferenceReading['blocks'] {
  return [
    {
      title: m.name,
      kind: 'creature',
      text: [
        [
          m.hp !== '' ? `HP ${m.hp}` : '',
          m.morale ? `Morale ${m.morale}` : '',
          m.armor ? `Armor ${m.armor}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        m.fieldProvenance?.hp?.status === 'UNAVAILABLE'
          ? 'SOURCE UNAVAILABLE · No independent creature stat block supplied.'
          : '',
        ...m.attacks.map(
          (a) =>
            `${a.name} ${a.damage}${a.description ? ' · ' + a.description : ''}`,
        ),
        ...m.special.map((s) => s.text),
        ...m.weakness.map((s) => `Weakness: ${s.text}`),
        ...m.loot.map((s) => `Loot: ${s.text}`),
        m.behavior,
        m.wants,
        m.description,
      ]
        .filter(Boolean)
        .join('\n'),
    },
  ];
}
function creatureBlocks(
  preset: Record<string, unknown>,
  monster: Monster,
): ReferenceReading['blocks'] {
  const outcast = wildWickheadBlocks(preset);
  if (outcast) return outcast;
  if (
    preset.book === 'heretic' &&
    preset.name === 'Rotten Nurse' &&
    preset.pdfPage === 64
  )
    return [
      {
        title: typeof preset.attack === 'string' ? preset.attack : '',
        text:
          typeof preset.specialAbility === 'string'
            ? preset.specialAbility
            : '',
      },
    ];
  return monsterBlocks(monster).map((block) => ({
    ...block,
    text:
      Array.isArray(preset.variants) && preset.variants.length
        ? block.text.replace(/SOURCE UNAVAILABLE[^\n]*\n?/g, '')
        : block.text,
  }));
}
function creatureChildren(
  preset: Record<string, unknown>,
  rules: RulesPack | null,
): string[] {
  if (typeof preset.id !== 'string' || !preset.id) return [];
  return referenceCreatureRecords(rules)
    .filter(
      (record) =>
        record.parentSourceId === preset.id && record.book === preset.book,
    )
    .map(creatureReferenceId);
}
export interface ReferenceExecutionOptions {
  rng?: RandomSource;
  registry: OracleRegistry;
  rules: RulesPack | null;
  region: RegionId;
  stockKind: 'common' | 'rare' | 'room';
  stockDR: number;
  cityLarge: boolean;
  cityExits: boolean;
  encounterRegion?: string;
  rareDeck?: PlayingCard[];
}
export function npcReferenceReading(npc: NPC): ReferenceReading {
  return {
    title: npc.name,
    npcSnapshot: npc,
    blocks: [
      {
        title: npc.archetype,
        text: [
          npc.appearance,
          npc.behaviour,
          npc.personality,
          npc.wants,
          `Reaction: ${npc.reaction}`,
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
    sourceRefs: npc.sourceRefs,
    authority: [appPolicy('workbench.npc')],
  };
}
/** Mirrors the executable branches below, including procedures with an attached rule definition. */
export function referenceProducesRoll(entry: ReferenceEntry): boolean {
  const action = entry.action;
  if (!action || !entry.available) return false;
  if (
    action.kind === 'procedure' &&
    ['depths.rare-monster', 'depths.encounter-level'].includes(
      action.procedureId,
    )
  )
    return true;
  return (
    !entry.definition &&
    ['oracle', 'procedure', 'regional-monster', 'regional-table'].includes(
      action.kind,
    )
  );
}
/** Executes a reference without mutating a Campaign, saving an object, or opening a dialog. */
export function executeReference(
  entry: ReferenceEntry,
  options: ReferenceExecutionOptions,
): ReferenceReading | undefined {
  const { registry, rules, region, stockKind, stockDR, cityLarge, cityExits } =
    options;
  const action = entry.action;
  if (!action || !entry.available) return;
  if (
    action.kind === 'procedure' &&
    action.procedureId === 'depths.rare-monster'
  )
    return drawRareMonster(registry, options.rareDeck, options.rng);
  if (
    action.kind === 'procedure' &&
    action.procedureId === 'depths.encounter-level'
  )
    return checkEncounterLevel(
      registry,
      options.encounterRegion ?? 'sarkash',
      options.rng,
    );
  if (entry.definition)
    return {
      title: entry.title,
      blocks: entry.definition.blocks,
      sourceRefs: entry.sourceRefs,
      relatedIds: entry.relatedIds,
      authority: [
        ...(entry.authority ?? [sourceProcedure(entry.id, entry.sourceRefs)]),
        appPolicy('app.reference-groups'),
      ],
    };
  let output: ReferenceReading | undefined;
  if (action.kind === 'creature') {
    const preset = findReferenceCreature(rules, action.creatureId);
    if (!preset) throw new Error('확인된 생물 원문 자료를 불러오세요.');
    const monster = loadMonsterPreset(id(), preset);
    output = {
      title: entry.title,
      blocks: creatureBlocks(preset, monster),
      sourceRefs: entry.sourceRefs,
      childReferenceIds: entry.childReferenceIds,
      valuationReferenceId: entry.valuationReferenceId,
    };
  } else if (
    action.kind === 'regional-monster' ||
    action.kind === 'regional-table'
  ) {
    if (!rules) throw new Error('몬스터 원문 자료를 불러오세요.');
    const r =
      action.kind === 'regional-table'
        ? rollRegionalTableReference(
            action.tableId,
            registry,
            rules,
            options.rng,
          )
        : rollRegionalReference(action.region, registry, rules, options.rng);
    const sourceName = r.preset
      ? String(r.preset.name)
      : typeof r.reading.metadata?.name === 'string'
        ? r.reading.metadata.name
        : '';
    const identity = `${sourceName}${r.quantity == null ? '' : ' × ' + r.quantity}`;
    const dice = `${r.reading.dice} = ${r.reading.roll}${r.quantityRoll ? ` · ${r.quantityRoll.dice} = ${r.quantityRoll.roll}` : r.quantity == null ? '' : ' · 수량 ' + r.quantity}`;
    const blocks: ReferenceReading['blocks'] = r.preset
      ? creatureBlocks(r.preset, loadMonsterPreset(id(), r.preset)).map(
          (block) => ({
            ...block,
            title: identity,
            dice,
          }),
        )
      : [
          {
            title: sourceName ? identity : r.reading.title,
            text: sourceName ? 'SOURCE UNAVAILABLE' : r.reading.text,
            dice,
          },
        ];
    output = {
      title: entry.title,
      blocks,
      childReferenceIds: r.preset ? creatureChildren(r.preset, rules) : [],
      // The complete printed route remains inspectable, separate from its mechanical display.
      oracle: { id: id(), title: r.reading.title, rolls: [r.reading] },
      ...(r.preset
        ? {
            copyContent: {
              title: identity,
              blocks: blocks.map((block) => ({ ...block, title: '' })),
            },
          }
        : {}),
      sourceRefs: r.sourceChain.map((step) => step.source),
      authority: [
        sourceProcedure(
          `oracle:${r.reading.oracleId}`,
          r.sourceChain
            .filter((step) => step.role === 'routing')
            .map((step) => step.source),
          `${r.reading.dice} · 원문의 지역 표가 지정한 생물 출처로 연결합니다.`,
        ),
        appPolicy('app.result-grouping'),
      ],
      evidence: r.sourceChain
        .map((step) => ({
          source: step.source,
          role: step.role ?? 'primary',
          confidence: step.confidence ?? 'verified',
          note: step.via,
        }))
        .sort(
          (a, b) => Number(a.role === 'routing') - Number(b.role === 'routing'),
        ),
    };
  } else if (
    action.kind === 'procedure' &&
    action.procedureId === 'workbench.npc'
  ) {
    const npc = createNPC(id(), region, false, registry);
    output = npcReferenceReading(npc);
  } else if (
    action.kind === 'procedure' &&
    action.procedureId === 'workbench.epk'
  ) {
    const preset = rollEatPreyKillPreset(region, rules, options.rng);
    const monster = loadMonsterPreset(id(), preset);
    output = {
      title: monster.name,
      blocks: creatureBlocks(preset, monster),
      childReferenceIds: creatureChildren(preset, rules),
      sourceRefs: [
        {
          bookId: 'feretory',
          bookTitle: 'MÖRK BORG CULT: FERETORY',
          tableTitle: 'Eat Prey Kill · ' + region,
          pdfPage:
            typeof preset.pdfPage === 'number' ? preset.pdfPage : undefined,
          printedPage:
            typeof preset.printedPage === 'number' ||
            typeof preset.printedPage === 'string'
              ? preset.printedPage
              : undefined,
          roll: Number(preset.roll) || undefined,
          tableId:
            typeof preset.tableId === 'string' ? preset.tableId : undefined,
          entryId: typeof preset.id === 'string' ? preset.id : undefined,
          ...(typeof preset.hp !== 'number' &&
          !(Array.isArray(preset.variants) && preset.variants.length)
            ? {
                status: 'PARTIAL',
                note: 'Creature identity is source-backed. No independent creature statistics are supplied for this result.',
              }
            : {}),
        },
      ],
    };
  } else if (
    action.kind === 'procedure' &&
    action.procedureId === 'workbench.stock-room'
  ) {
    const regional = registry.tables.find(
      (table) => table.id === regionTableId(region, 'monsters'),
    );
    if (
      stockKind === 'common' &&
      regional?.sourceVerified &&
      regional.dice === 'd6'
    )
      return executeReference(
        { ...entry, action: { kind: 'regional-monster', region } },
        options,
      );
    const encounter = createEncounter(
      id(),
      region,
      stockKind,
      stockDR,
      false,
      registry,
    );
    output = {
      title: entry.title,
      blocks: [
        {
          title: `${stockKind.toUpperCase()} · ${region}`,
          text:
            encounter.text || '굴림이 원문 표 범위 밖입니다. 직접 참조하세요.',
          dice: `${stockKind === 'rare' ? 'd8 + DR ' + stockDR : encounterTable(stockKind, region, registry) === 'sd.stockCreatures' ? 'd12' : (registry.tables.find((t) => t.id === encounterTable(stockKind, region, registry))?.dice ?? '')} = ${encounter.generation?.rolls?.result ?? ''}`,
        },
      ],
      sourceRefs: encounter.sourceRefs,
    };
  } else if (action.kind === 'oracle' || action.kind === 'procedure') {
    const procedure =
      action.kind === 'oracle'
        ? { id: entry.id, title: entry.title, oracleIds: action.oracleIds }
        : registry.procedures.find((p) => p.id === action.procedureId);
    if (!procedure) return;
    const specialCityId =
      action.kind === 'procedure' && action.procedureId === 'aitc.street'
        ? 'aitc.street'
        : action.kind === 'oracle' &&
            action.oracleIds[0] === 'aitc.notable-artefact-type'
          ? 'aitc.notable-artefact-type'
          : null;
    const result = specialCityId
      ? rollCityReference(
          {
            procedureId: specialCityId,
            cityOrMetropolis: cityLarge,
            includeExits: cityExits,
          },
          registry,
        )
      : rollProcedure(procedure, registry, options.rng);
    const monster = feretoryResultBlock(result);
    output = {
      title: result.title,
      blocks: monster
        ? [monster]
        : result.rolls.map((r) => ({
            title: r.title,
            text: oracleReadingText(r),
            dice: `${r.dice} = ${r.roll}`,
            ...(r.oracleId === 'core.treasures' &&
            r.entryId &&
            r.metadata?.referenceName
              ? { definitionReferenceId: `definition:${r.entryId}` }
              : {}),
          })),
      sourceRefs: refsForOracle(result, registry),
      oracle: result,
      relatedIds: [
        ...new Set(
          result.rolls.flatMap(
            (roll) => oracleFollowUpLinks(roll.metadata).relatedIds ?? [],
          ),
        ),
      ],
      fixedLookups: result.rolls.flatMap((roll) =>
        Array.isArray(roll.metadata?.fixedLookups)
          ? roll.metadata.fixedLookups.filter(
              (value): value is { oracleId: string; roll: number } =>
                !!value &&
                typeof value.oracleId === 'string' &&
                Number.isInteger(value.roll),
            )
          : [],
      ),
    };
  }
  return output;
}
