import { useRef, useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  importPrivateData,
  exportPrivateData,
} from '../storage/privateDataImport';
import { downloadJson } from '../storage/saveStore';

import { PrivateUpdateStatus } from './PrivateUpdateStatus';

export function PrivateDataTools({ backup = false }: { backup?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return (
    <div className="private-data-tools">
      <PrivateUpdateStatus />
      <details className="sheet-source private-data-backup">
        <summary>자료 백업 · 복원</summary>
        <div className="actions">
          <Button
            type="button"
            className="btn small"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            <Upload size={15} /> {busy ? '자료 저장 중…' : '자료 JSON 복원'}
          </Button>
          {backup && (
            <Button
              type="button"
              className="btn small"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  downloadJson(
                    await exportPrivateData(),
                    'morkborg-private-data.json',
                  );
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : '자료를 내보내지 못했습니다.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download size={15} /> 자료 전체 백업
            </Button>
          )}
        </div>
        <p className="help-line">
          평소에는 서버에서 자동으로 불러옵니다. 별도로 보관한 JSON을 복원할
          때만 사용하세요. 복원 파일은 이 브라우저에 저장합니다.
        </p>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          multiple
          className="sr-only"
          aria-label="개인 룰북 자료 파일"
          onChange={async (e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = '';
            if (!files.length) return;
            setBusy(true);
            setError('');
            setMessage('');
            try {
              if (
                files.length > 3 ||
                files.reduce((n, f) => n + f.size, 0) > 20 * 1024 * 1024
              )
                throw new Error(
                  'JSON은 최대 3개, 합계 20MB까지 선택할 수 있습니다.',
                );
              const data = await importPrivateData(
                await Promise.all(
                  files.map(
                    async (file) => JSON.parse(await file.text()) as unknown,
                  ),
                ),
              );
              const labels = [
                data.library && '룰북',
                data.oracles && 'Oracle',
                data.fateChart && 'Fate Chart',
              ].filter(Boolean);
              setMessage(
                labels.join(' · ') +
                  ' 자료를 저장했습니다. 새로고침 후에도 사용할 수 있습니다.',
              );
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : '개인 자료를 저장하지 못했습니다.',
              );
            } finally {
              setBusy(false);
            }
          }}
        />
        {error && (
          <p className="private-data-error" role="alert">
            {error}
          </p>
        )}
        {message && <output>{message}</output>}
      </details>
    </div>
  );
}
