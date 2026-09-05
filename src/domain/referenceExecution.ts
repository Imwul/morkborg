import type { OracleRegistry, OracleResult } from './oracle';
import type { Monster, RegionId, SourceReference } from './types';
import type { RulesPack } from '../storage/rulesStore';
import {
  rollRegionalReference,
  regionTableId,
  findReferenceCreature,
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
import { oracleReadingText, type ReferenceReading } from './referenceReading';
export function refsForOracle(
  result: OracleResult,
  registry: OracleRegistry,
): SourceReference[] {
  return result.rolls.map((roll) => {
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
        ? { note: roll.dice + ' · 절차의 수량 판정' }
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
        `HP ${m.hp} · Morale ${m.morale} · Armor ${m.armor || '—'}`,
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
export interface ReferenceExecutionOptions {
  rng?: RandomSource;
  registry: OracleRegistry;
  rules: RulesPack | null;
  region: RegionId;
  stockKind: 'common' | 'rare' | 'room';
  stockDR: number;
  cityLarge: boolean;
  cityExits: boolean;
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
  let output: ReferenceReading | undefined;
  if (action.kind === 'creature') {
    const preset = findReferenceCreature(rules, action.creatureId);
    if (!preset) throw new Error('확인된 생물 원문 자료를 불러오세요.');
    const monster = loadMonsterPreset(id(), preset);
    output = {
      title: entry.title,
      blocks: monsterBlocks(monster),
      sourceRefs: entry.sourceRefs,
    };
  } else if (action.kind === 'regional-monster') {
    if (!rules) throw new Error('몬스터 원문 자료를 불러오세요.');
    const r = rollRegionalReference(
      action.region,
      registry,
      rules,
      options.rng,
    );
    const blocks: ReferenceReading['blocks'] = [
      {
        title: r.reading.title,
        text: r.reading.text,
        dice: `${r.reading.dice} = ${r.reading.roll}${r.quantity == null ? '' : ' · 수량 ' + r.quantity}`,
      },
    ];
    if (r.preset)
      blocks.push(
        ...monsterBlocks(loadMonsterPreset(id(), r.preset)).map((b) => ({
          ...b,
          dice: b.dice ?? '',
        })),
      );
    if (r.unresolved)
      blocks.push({
        title: '원문 참조',
        text: r.reason ?? '이 항목은 원문 지시를 확인하세요.',
        dice: '',
      });
    output = {
      title: entry.title,
      blocks,
      ...(r.preset
        ? {
            copyContent: {
              title: `${String(r.preset.name)}${r.quantity == null ? '' : ' × ' + r.quantity}`,
              blocks: blocks.slice(1).map((block) => ({ ...block, title: '' })),
            },
          }
        : {}),
      sourceRefs: r.sourceChain.map((step) => step.source),
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
    output = {
      title: npc.name,
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
    };
  } else if (
    action.kind === 'procedure' &&
    action.procedureId === 'workbench.epk'
  ) {
    const preset = rollEatPreyKillPreset(region, rules);
    const monster = loadMonsterPreset(id(), preset);
    output = {
      title: monster.name,
      blocks: monsterBlocks(monster),
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
      : rollProcedure(procedure, registry);
    output = {
      title: result.title,
      blocks: result.rolls.map((r) => ({
        title: r.title,
        text: oracleReadingText(r),
        dice: `${r.dice} = ${r.roll}`,
      })),
      sourceRefs: refsForOracle(result, registry),
      oracle: result,
      relatedIds: [
        ...new Set(
          result.rolls.flatMap((roll) =>
            Array.isArray(roll.metadata?.followUpOracleIds)
              ? roll.metadata.followUpOracleIds
                  .filter((key): key is string => typeof key === 'string')
                  .map((key) => `oracle:${key}`)
              : [],
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
