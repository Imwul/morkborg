import { Button } from '@/components/ui/button';
import {
  checkPublishedData,
  setPublishedUpdatesEnabled,
  usePublishedData,
} from '../storage/publishedData';

export function PrivateUpdateStatus() {
  const state = usePublishedData();
  return (
    <details className="sheet-source private-update-status">
      <summary>
        서버 자료 ·{' '}
        {state.busy
          ? '불러오는 중'
          : state.error
            ? '다시 확인 필요'
            : state.enabled
              ? '자동 확인'
              : '수동 확인'}
      </summary>
      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={state.enabled}
          onChange={(e) => {
            void setPublishedUpdatesEnabled(e.target.checked);
          }}
        />{' '}
        새 룰북 자료와 번역 자동 확인
      </label>
      <p>
        첫 접속 시 서버에서 자료를 받아 이 브라우저에 저장합니다. 이후 시작 시,
        5분 간격과 탭·네트워크 복귀 시 새 버전을 확인합니다. 최근 확인 후 5분
        이내에는 생략합니다. 캠페인과 직접 작성한 내용은 유지됩니다.
      </p>
      <Button
        className="btn small"
        disabled={state.busy}
        onClick={() => {
          void checkPublishedData(true);
        }}
      >
        {state.busy ? '확인 중…' : '지금 확인'}
      </Button>
      {state.message && <output>{state.message}</output>}
      {state.error && <output role="alert">{state.error}</output>}
    </details>
  );
}
