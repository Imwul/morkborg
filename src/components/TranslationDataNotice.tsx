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
        최신 개인 자료 JSON을 가져오면 기존 던전·캐릭터·몬스터·Oracle에도 번역이
        표시됩니다. 저장한 생성 결과와 직접 수정한 내용은 유지됩니다.
      </p>
      <PrivateDataTools />
    </aside>
  );
}
