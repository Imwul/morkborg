import type { SourceReference } from './types';
export type SourceConfidence =
  | 'verified'
  | 'partial'
  | 'unavailable-source'
  | 'conflicting-citation';
export interface ReferenceEvidence {
  source: SourceReference;
  role: 'primary' | 'routing';
  confidence: SourceConfidence;
  note?: string;
}
export const SOURCE_STATUS: Record<SourceConfidence, string> = {
  verified: '확인됨',
  partial: '일부 확인',
  'unavailable-source': '원문 없음',
  'conflicting-citation': '인용 충돌 · 정정 출처 확인',
};
export function sourceEvidence(
  refs: SourceReference[],
  available = true,
): ReferenceEvidence[] {
  return refs.map((source) => ({
    source,
    role: 'primary',
    confidence: !available
      ? 'unavailable-source'
      : source.pdfPage == null
        ? 'partial'
        : 'verified',
  }));
}
