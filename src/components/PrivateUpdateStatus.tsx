import { Button } from '@/components/ui/button';
import {
  checkPrivateUpdates,
  privateUpdateSupport,
  setPrivateUpdatesEnabled,
  usePrivateUpdates,
} from '../storage/privateUpdates';
export function PrivateUpdateStatus() {
  const state = usePrivateUpdates();
  const support = privateUpdateSupport();
  return (
    <details className="sheet-source private-update-status">
      <summary>
        배포 자료 ·{' '}
        {!support.supported
          ? '수동 가져오기'
          : state.error
            ? '확인 실패'
            : state.connected
              ? state.enabled
                ? '자동 확인'
                : '수동 확인'
              : '미연결'}
      </summary>
      {!support.supported ? (
        <p>{support.reason}</p>
      ) : state.connected ? (
        <>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) => {
                void setPrivateUpdatesEnabled(e.target.checked);
              }}
            />{' '}
            발행된 번역·개체 자료 자동 확인
          </label>
          <p>
            이 사이트에 발행된 번역·개체 자료를 시작 시와 5분 간격으로
            확인합니다. 탭·네트워크 복귀 시에도 확인하며, 최근 확인 후 5분
            이내에는 생략합니다. 컴퓨터의 JSON 파일을 감시하지 않습니다.
            캠페인과 직접 작성한 내용은 유지됩니다.
          </p>
          <Button
            className="btn small"
            disabled={state.busy}
            onClick={() => {
              void checkPrivateUpdates(true);
            }}
          >
            {state.busy ? '확인 중…' : '지금 확인'}
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
