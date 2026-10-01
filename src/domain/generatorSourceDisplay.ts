import type { ReferenceReading } from './referenceReading';

export type GeneratorSource =
  | 'core'
  | 'scvm'
  | 'scvm-homebrew'
  | 'book'
  | 'epk'
  | 'site';
export const GENERATOR_SOURCE_LABELS: Record<GeneratorSource, string> = {
  core: '룰북',
  scvm: 'SCVMBIRTHER',
  'scvm-homebrew': 'SCVMBIRTHER · homebrew',
  book: 'FERETORY',
  epk: 'Eat Prey Kill · 지역 생물',
  site: '사이트',
};

/** Provenance belongs to the generated reading, never to a pending form selection. */
export function generatorResultSource(
  kind: 'character' | 'monster',
  reading?: ReferenceReading,
): GeneratorSource | undefined {
  if (!reading?.blocks.some((block) => block.text.trim())) return;
  const generator = reading.procedureInputs?.generator;
  if (kind === 'character') {
    if (generator === 'scvmbirther')
      return reading.procedureInputs?.homebrew ? 'scvm-homebrew' : 'scvm';
    return reading.sourceRefs.some((ref) => ref.bookId === 'core')
      ? 'core'
      : undefined;
  }
  if (generator === 'monster-site') return 'site';
  if (
    reading.sourceRefs.some((ref) =>
      ref.tableTitle?.startsWith('Eat Prey Kill'),
    )
  )
    return 'epk';
  if (reading.sourceRefs.some((ref) => ref.bookId === 'feretory'))
    return 'book';
}

export function pendingGeneratorSource(
  current: GeneratorSource | undefined,
  next: GeneratorSource,
): string | undefined {
  if (!current || current === next) return;
  return `현재 결과: ${GENERATOR_SOURCE_LABELS[current]} · 다음 굴림부터 적용: ${GENERATOR_SOURCE_LABELS[next]}`;
}
