import type { OracleDefinition } from '../../domain/oracle';
import type { RulesPack } from '../../storage/rulesStore';

const labels: Record<string, [string, string]> = {
  headSilver: ['Head', '머리'],
  capturedSilver: ['Captured', '생포'],
  deadSilver: ['Dead', '죽은 상태'],
  bloodPerLitreSilver: ['Blood, per litre', '피 1리터당'],
  skullSilver: ['Skull', '두개골'],
  ectoplasmSilver: ['Ectoplasm', '엑토플라즘'],
  destroyedSilver: ['Destroyed', '파괴된 상태'],
  remainsSilver: ['Remains', '유해'],
  corpseSilver: ['Corpse', '시체'],
  hornSilver: ['Horn', '뿔'],
  deadIntactSilver: ['Dead (intact)', '죽은 상태 — 온전함'],
  deadInPiecesSilver: ['Dead (in pieces)', '죽은 상태 — 조각남'],
  decapitatedLanternSilver: ['Decapitated lantern', '잘라낸 머리 등불'],
  poisonGlandSilver: ['Poison gland', '독샘'],
  tailSpikeSilver: ['Tail spike', '꼬리 가시'],
};

/** One read-only projection of the existing Core creature records, never a second price pool. */
export function coreValuationTables(
  rules: RulesPack | null,
): OracleDefinition[] {
  const records = (rules?.creatures ?? []).filter(
    (r) =>
      r.book === 'core' &&
      typeof r.pdfPage === 'number' &&
      r.pdfPage >= 58 &&
      r.pdfPage <= 62 &&
      typeof r.name === 'string' &&
      r.valuation &&
      typeof r.valuation === 'object' &&
      !Array.isArray(r.valuation),
  );
  if (!records.length) return [];
  return [
    {
      id: 'core.creatureValuations',
      canonicalTableId: 'core.creatureValuations',
      title: 'Creatures · Valuations',
      sourceBookId: 'core',
      sourcePage: [58, 59, 60, 61, 62],
      printedPage: '58–62',
      dice: 'Reference',
      originalDice: 'Reference — choose by creature',
      category: 'MONSTER',
      tags: ['core', 'reference', 'valuation'],
      rollable: false,
      sourceVerified: true,
      entries: records.map((record, index) => {
        const lines: string[] = [],
          ko: string[] = [];
        for (const [field, value] of Object.entries(
          record.valuation as Record<string, unknown>,
        )) {
          if (!labels[field])
            throw new Error(`Unverified Core valuation field: ${field}`);
          if (typeof value === 'number') {
            lines.push(`${labels[field][0]}: ${value}s`);
            ko.push(`${labels[field][1]}: 은화 ${value}`);
          } else if (
            typeof value === 'string' &&
            /^\d+–\d+, if wanted for a serious crime$/.test(value)
          ) {
            const amount = value.split(',')[0];
            lines.push(
              `${labels[field][0]}: ${amount}s (wanted, serious crime)`,
            );
            ko.push(
              `${labels[field][1]}: 은화 ${amount} (중범죄 수배 대상일 때)`,
            );
          } else throw new Error(`Unverified Core valuation value: ${field}`);
        }
        return {
          id: `core.creatureValuations:${String(record.name).toLowerCase().replace(/ /g, '-')}`,
          min: index + 1,
          max: index + 1,
          text: String(record.name),
          metadata: {
            selectorLabel: record.name,
            name: record.name,
            concept: record.concept,
            pdfPage: record.pdfPage,
            printedPage: record.pdfPage,
            effect: lines.join('\n'),
            translationKo: ko.join('\n'),
            // Identity resolves against the same record used by the creature reference.
            creatureName: record.name,
            creaturePage: record.pdfPage,
          },
        };
      }),
    },
  ];
}
