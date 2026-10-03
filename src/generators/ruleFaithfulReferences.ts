import type {
  OracleProcedure,
  OracleRegistry,
  OracleResult,
  OracleRoll,
} from '../domain/oracle';
import { id, random, rollDie, type RandomSource } from './random';
import { rollOracle } from './oracleRoller';
import { abilityModifier } from './tables';
import { oracleValueProvenance } from '../domain/oracleProvenance';
const textMetadata = (value: unknown) =>
  typeof value === 'string' ? value : '';
const numberMetadata = (value: unknown) =>
  typeof value === 'number' ? value : 0;

export const CLASSLESS_ABILITIES = [
  'strength',
  'agility',
  'presence',
  'toughness',
] as const;
export type ClasslessAbility = (typeof CLASSLESS_ABILITIES)[number];
export const WEATHER_DETAIL_IDS = [
  'reclvse.temperature',
  'reclvse.precipitation',
  'reclvse.wind',
  'reclvse.visibility',
] as const;
export type OrakleLikelihood =
  | 'very-unlikely'
  | 'unlikely'
  | 'even'
  | 'likely'
  | 'very-likely';
export interface RuleFaithfulOptions {
  characterMode?: 'classless' | 'random' | 'chosen';
  characterClassId?: string;
  classlessBoost?: ClasslessAbility[];
  coreOmens?: boolean;
  orakleLikelihood?: OrakleLikelihood;
  orakleDR?: boolean;
  orakleTR?: number;
  weatherDetails?: string[];
  huntingDie?: 6 | 8 | 10 | 12;
}
export function orakleSelection(
  values: number[],
  likelihood: OrakleLikelihood,
) {
  return likelihood.includes('unlikely')
    ? Math.min(...values)
    : Math.max(...values);
}
export function orakleChallengeDR(value: number, threat = 12) {
  return Math.min(18, value + threat - 12);
}

/** Source procedures use independent dice and keep their component rolls. */
export function ruleFaithfulResult(
  procedure: OracleProcedure,
  registry: OracleRegistry,
  options: RuleFaithfulOptions = {},
  rng: RandomSource = random,
): OracleResult | undefined {
  const rolls: OracleRoll[] = [];
  const get = (tableId: string) => {
    const table = registry.tables.find((t) => t.id === tableId);
    if (!table) throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
    return table;
  };
  const roll = (tableId: string, dice?: string) => {
    const table = get(tableId);
    const result = rollOracle(dice ? { ...table, dice } : table, registry, rng);
    rolls.push(result);
    return result;
  };
  const derived = (result: OracleRoll, note: string) => {
    const provenance = result.metadata?.provenance;
    if (provenance)
      result.metadata = {
        ...result.metadata,
        provenance: {
          ...provenance,
          classification: 'APP_DERIVED',
          transformation: note,
        },
      };
  };
  const scalar = (
    title: string,
    value: number | string,
    dice: string,
    values: number[],
    page: number,
    note: string,
  ) => {
    const r: OracleRoll = {
      oracleId: 'character.core-classless',
      title,
      text: String(value),
      dice,
      roll: values.reduce((a, b) => a + b, 0),
      diceValues: values,
      entryId: null,
      source: `MÖRK BORG · PDF ${page}`,
      metadata: {
        provenance: {
          classification: 'APP_DERIVED',
          origin: 'source',
          status: 'VERIFIED',
          sourceRefs: [{ bookId: 'core', pdfPage: page, tableTitle: title }],
          sourceText: [],
          transformation: note,
          rolls: [
            {
              tableId: 'character.core-classless',
              dice,
              value: values.reduce((a, b) => a + b, 0),
              diceValues: values,
            },
          ],
        },
      },
    };
    rolls.push(r);
    return r;
  };
  if (procedure.id === 'character.core-classless') {
    const boost = [...new Set(options.classlessBoost ?? [])];
    if (
      boost.length &&
      (boost.length !== 2 ||
        boost.some((k) => !CLASSLESS_ABILITIES.includes(k)))
    )
      throw new Error('4d6 선택 규칙은 서로 다른 능력치 두 개를 선택하세요.');
    roll('core.names').title = 'Name';
    scalar('Class', 'Classless', '', [], 21, 'No optional class selected.');
    const stats: Record<string, number> = {};
    for (const ability of CLASSLESS_ABILITIES) {
      const boosted = boost.includes(ability);
      const values = Array.from({ length: boosted ? 4 : 3 }, () =>
        rollDie(6, rng),
      );
      const total =
        values.reduce((a, b) => a + b, 0) - (boosted ? Math.min(...values) : 0);
      stats[ability] = abilityModifier(total);
      scalar(
        ability[0].toUpperCase() + ability.slice(1),
        `${stats[ability] >= 0 ? '+' : ''}${stats[ability]}`,
        boosted ? '4d6 drop lowest' : '3d6',
        values,
        27,
        `${boosted ? 'Drop lowest; ' : ''}ability total ${total} → modifier ${stats[ability]}.`,
      );
    }
    const hp = rollDie(8, rng);
    scalar(
      'HP',
      Math.max(1, stats.toughness + hp),
      'd8',
      [hp],
      29,
      `Toughness ${stats.toughness} + d8; minimum 1.`,
    );
    const silver = [rollDie(6, rng), rollDie(6, rng)];
    scalar(
      'Silver',
      silver.reduce((a, b) => a + b, 0) * 10,
      '2d6 × 10',
      silver,
      21,
      'Starting silver.',
    );
    if (options.coreOmens) {
      const omens = rollDie(2, rng);
      scalar('Omens', omens, 'd2', [omens], 37, 'Optional Core Omens rule.');
    }
    scalar('Equipment', 'Waterskin', '', [], 21, 'Starting equipment.');
    const food = rollDie(4, rng);
    scalar('Food', `${food} days of food`, 'd4', [food], 21, 'Starting food.');
    const container = roll('core.containers');
    if (container.roll >= 5) {
      container.text +=
        '\n\nOr choose: ' +
        get('core.containers')
          .entries.filter((e) => e.max < container.roll!)
          .map((e) => e.text)
          .join('; ');
      derived(
        container,
        'Display the preceding source choices referenced by this container result.',
      );
    }
    let scroll = false;
    for (const tableId of ['core.gearA', 'core.gearB']) {
      const gear = roll(tableId);
      const originalText = gear.text;
      gear.text = gear.text.replace(/Presence\s*\+\s*(\d+)/g, (_, n: string) =>
        String(stats.presence + Number(n)),
      );
      if (gear.metadata?.quantity === 'd4') {
        const doses = rollDie(4, rng);
        gear.text = gear.text.replace('d4 doses', `${doses} doses`);
      }
      if (
        gear.metadata?.companion &&
        typeof gear.metadata.companion === 'object'
      ) {
        const companion = gear.metadata.companion as {
          count: string | number;
          hp: string;
        };
        const count =
          companion.count === 'd4' ? rollDie(4, rng) : Number(companion.count);
        const match = /^d(4|6)\+2$/.exec(companion.hp.replace(/\s/g, ''));
        if (!Number.isInteger(count) || count < 1 || !match)
          throw new Error('SOURCE DATA UNAVAILABLE: starting companion');
        const hp = Array.from(
          { length: count },
          () => rollDie(Number(match[1]), rng) + 2,
        );
        gear.text += ` [${count} creature(s); HP ${hp.join(', ')}]`;
      }
      if (gear.text !== originalText)
        derived(
          gear,
          'Resolve starting-kit quantities, companion HP and Presence uses; retain the original source row in sourceText.',
        );
      if (
        gear.metadata?.scrollTable === 'sacred' ||
        gear.metadata?.scrollTable === 'unclean'
      ) {
        scroll = true;
        const child = roll('core.' + gear.metadata.scrollTable);
        child.title = `${gear.title} · ${gear.metadata.scrollTable} scroll`;

        rolls.splice(rolls.indexOf(gear), 1);
      }
    }
    const weapon = roll('core.weapons', scroll ? 'd6' : 'd10');
    weapon.text += ` · ${textMetadata(weapon.metadata?.damage)}`;
    const ammunition = textMetadata(weapon.metadata?.ammunition).replace(
      'Presence + 10',
      String(stats.presence + 10),
    );
    if (ammunition) weapon.text += `; ${ammunition}`;
    derived(
      weapon,
      'Append the source weapon damage and starting ammunition with Presence uses resolved.',
    );
    if (scroll) {
      const uses = rollDie(4, rng);
      scalar(
        'Power uses/day',
        Math.max(0, stats.presence + uses),
        'd4',
        [uses],
        34,
        `Presence ${stats.presence} + d4 daily Power uses.`,
      );
    }
    const armor = roll('core.armor', scroll ? 'd2' : 'd4');
    const reduction = textMetadata(armor.metadata?.damageReduction);
    if (reduction) armor.text += ` −${reduction}`;
    if (numberMetadata(armor.metadata?.agilityDRPenalty) > 0)
      armor.text += `; Agility DR +${numberMetadata(armor.metadata?.agilityDRPenalty)}; defence DR +${numberMetadata(armor.metadata?.defenseDRPenalty)}`;
    derived(
      armor,
      'Append source armor reduction and Agility/defence DR penalties.',
    );
    for (const tableId of [
      'core.traits',
      'core.bodies',
      'core.badHabits',
      'core.troublingTales',
    ])
      roll(tableId);
    return { id: id(), title: procedure.title, rolls };
  }
  if (
    procedure.oracleIds.length === 1 &&
    procedure.oracleIds[0] === 'depths.orakle'
  ) {
    const likelihood = options.orakleLikelihood ?? 'even';
    const count =
      likelihood === 'even' ? 1 : likelihood.startsWith('very-') ? 3 : 2;
    for (let attempt = 0; attempt < 100; attempt++) {
      const values = Array.from({ length: count }, () => rollDie(20, rng));
      const value = orakleSelection(values, likelihood);
      const table = get('depths.orakle');
      if (!table.sourceVerified) throw new Error('Orakle 원문을 확인하세요.');
      const row = table.entries.find((e) => e.min <= value && e.max >= value)!;
      const provenance = oracleValueProvenance(table, registry, row, {
        value,
        values,
      });
      rolls.push({
        oracleId: table.id,
        title: attempt ? 'Orakle · reroll' : 'Orakle',
        dice: `${count}d20 · ${likelihood}`,
        roll: value,
        diceValues: values,
        entryId: row.id,
        text: row.text,
        source: 'Depths of the Unknown · PDF 6',
        metadata: {
          ...row.metadata,
          provenance: {
            ...provenance,
            classification: 'APP_DERIVED',
            transformation: `${likelihood}: select ${likelihood.includes('unlikely') ? 'minimum' : 'maximum'} of ${values.join(', ')}; 10 adds an event and rerolls.`,
          },
        },
      });
      if (value === 10) {
        roll('depths.randomEventFocus');
        continue;
      }
      if (value > 10 && options.orakleDR) {
        const threat = options.orakleTR ?? 12;
        rolls[rolls.length - 1].text +=
          `\n\nChallenge DR ${orakleChallengeDR(value, threat)} · ${value} + (${threat} − 12), cap 18. Harmful Yes only; apply when a challenge needs a DR.`;
        derived(
          rolls[rolls.length - 1],
          `${provenance.transformation} Optional harmful-Yes DR = min(18, ${value} + ${threat} − 12).`,
        );
      }
      return { id: id(), title: 'Orakle', rolls };
    }
    throw new Error(
      'Orakle에서 10이 100회 연속 나왔습니다. 결과를 확정하지 않았습니다. 다시 굴려 주세요.',
    );
  }
  if (procedure.id === 'reclvse.weather-detail') {
    const selected = [
      ...new Set(options.weatherDetails ?? WEATHER_DETAIL_IDS.slice(0, 2)),
    ];
    if (
      !selected.length ||
      selected.length > 3 ||
      selected.some(
        (t) =>
          !WEATHER_DETAIL_IDS.includes(
            t as (typeof WEATHER_DETAIL_IDS)[number],
          ),
      )
    )
      throw new Error('날씨 세부 표를 1–3개 선택하세요.');
    const weatherRoll = (tableId: string) => {
      const result = roll(tableId);
      if (result.roll === 20)
        result.metadata = {
          ...result.metadata,
          followUpOracleIds: ['reclvse.unnatural_weather'],
        };
      return result;
    };
    for (const tableId of selected) {
      const result = weatherRoll(tableId);
      if (tableId === 'reclvse.precipitation' && result.roll === 3) {
        weatherRoll(tableId);
        weatherRoll(tableId);
      }
      if (tableId === 'reclvse.precipitation' && result.roll === 20)
        weatherRoll(tableId);
    }
    return { id: id(), title: procedure.title, rolls };
  }
  if (
    procedure.id === 'sd.buildings' ||
    (procedure.oracleIds.length === 1 &&
      procedure.oracleIds[0] === 'sd.building.material')
  ) {
    const count = rollDie(2, rng);
    rolls.push({
      oracleId: 'sd.building.material',
      title: 'Material count',
      dice: 'd2',
      roll: count,
      diceValues: [count],
      entryId: null,
      text: `${count} material roll(s)`,
      source: 'Sölitary Defilement · PDF 12 / p.10',
      metadata: {
        provenance: {
          classification: 'APP_DERIVED',
          origin: 'source',
          status: 'VERIFIED',
          sourceRefs: [
            {
              bookId: 'sd',
              pdfPage: 12,
              tableId: 'sd.building.material',
              tableTitle: 'Material × d2',
            },
          ],
          sourceText: [],
          transformation:
            'Material × d2 selects the number of independent material rolls.',
          rolls: [
            {
              tableId: 'sd.building.material',
              dice: 'd2',
              value: count,
              diceValues: [count],
            },
          ],
        },
      },
    });
    for (let i = 0; i < count; i++) {
      const material = roll('sd.building.material');
      material.title += ` · ${i + 1}`;
      if (material.roll === 4) {
        roll('sd.material.quality');
        roll('sd.material.composition');
      }
    }
    if (procedure.id === 'sd.buildings') {
      roll('sd.building.size');
      roll('sd.building.form');
    }
    return { id: id(), title: procedure.title, rolls };
  }
  if (
    procedure.oracleIds.length === 1 &&
    procedure.oracleIds[0].startsWith('feretory.hunting.')
  ) {
    const die = options.huntingDie ?? 6;
    if (die === 6) return;
    const value = rollDie(die, rng);
    if (value <= 6) {
      const result = rollOracle(
        get(procedure.oracleIds[0]),
        registry,
        () => (value - 0.5) / 6,
      );
      result.dice = `d${die}`;
      return { id: id(), title: procedure.title, rolls: [result] };
    }
    return {
      id: id(),
      title: procedure.title,
      rolls: [
        {
          oracleId: procedure.oracleIds[0],
          title: 'Mundane prey',
          dice: `d${die}`,
          roll: value,
          diceValues: [value],
          entryId: null,
          text: 'Mundane prey · choose an ordinary local animal. No additional creature statistics are supplied by this optional rule.',
          source: 'FERETORY · PDF 12 / p. 10',
        },
      ],
    };
  }
  return;
}
