import { Button } from '@/components/ui/button';
import {
  checkPrivateUpdates,
  setPrivateUpdatesEnabled,
  usePrivateUpdates,
} from '../storage/privateUpdates';
export function PrivateUpdateStatus() {
  const state = usePrivateUpdates();
  return (
    <details className="sheet-source private-update-status">
      <summary>
        자료 갱신 ·{' '}
        {state.connected ? (state.enabled ? '자동' : '수동') : '미연결'}
      </summary>
      {state.connected ? (
        <>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) => {
                void setPrivateUpdatesEnabled(e.target.checked);
              }}
            />{' '}
            새 번역 자동으로 받기
          </label>
          <p>
            사이트를 열거나 다시 돌아오면 새 자료를 확인합니다. 캠페인과 직접
            작성한 내용은 유지됩니다.
          </p>
          <Button
            className="btn small"
            disabled={state.busy}
            onClick={() => {
              void checkPrivateUpdates(true);
            }}
          >
            {state.busy ? '확인 중…' : '지금 갱신'}
          </Button>
          {state.message && <output>{state.message}</output>}
          {state.error && <output>{state.error}</output>}
        </>
      ) : (
        <p>자동 갱신 연결이 포함된 최신 개인 자료 JSON을 한 번 가져오세요.</p>
      )}
    </details>
  );
}
