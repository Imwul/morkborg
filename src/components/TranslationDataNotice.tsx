import { useMemo } from 'react';
import { useRules } from '../storage/rulesStore';
import { hasRuleTranslations } from '../storage/ruleTranslations';
import { PrivateDataTools } from './PrivateDataTools';

export function TranslationDataNotice() {
  const { pack } = useRules();
  const ready = useMemo(() => !pack || hasRuleTranslations(pack), [pack]);
  if (ready) return null;
  return (
    <aside
      className="translation-data-notice"
      aria-label="한국어 번역 자료 안내"
    >
      <strong>한국어 번역 자료가 아직 적용되지 않았습니다.</strong>
      <p>
        서버의 최신 번역 자료를 확인하고 있습니다. 자동 확인이 끝나도 번역이
        없다면 아래에서 다시 확인하세요. 저장한 생성 결과와 직접 수정한 내용은
        유지됩니다.
      </p>
      <PrivateDataTools />
    </aside>
  );
}
