import { Textarea } from '@/components/ui/textarea';
import type { Visibility } from '../domain/chronicle';

export const stateLabels: Record<string, string> = {
  planned: '예정',
  active: '진행 중',
  ended: '종료',
  open: '미해결',
  resolved: '해결',
  failed: '실패',
  abandoned: '포기',
  unknown: '미확인',
  heard: '들음',
  confirmed: '확인됨',
  false: '거짓',
  discovered: '발견',
  cleared: '정리됨',
  hidden: '숨겨짐',
  visited: '방문',
  encountered: '조우함',
  defeated: '격퇴',
  fled: '도주',
  dead: '사망',
  removed: '떠남',
};
export function VisibilityFields({
  value,
  onChange,
}: {
  value: { visibility?: Visibility; gmNotes?: string };
  onChange: (patch: { visibility?: Visibility; gmNotes?: string }) => void;
}) {
  return (
    <details className="visibility-control">
      <summary>
        {value.visibility === 'players' ? '◉ 플레이어에게 알려짐' : '◈ GM 전용'}{' '}
        · 비밀 / 공개 범위
      </summary>
      <label>
        내용 공개{' '}
        <select
          value={value.visibility ?? 'gm'}
          onChange={(e) =>
            onChange({ visibility: e.target.value as Visibility })
          }
        >
          <option value="gm">GM 전용</option>
          <option value="players">플레이어에게 알려짐</option>
        </select>
      </label>
      <label>
        GM 비밀 노트{' '}
        <Textarea
          value={value.gmNotes ?? ''}
          onChange={(e) => onChange({ gmNotes: e.target.value })}
          placeholder="공개 범위와 관계없이 GM에게만 보관할 정보"
        />
      </label>
      <small>
        현재 화면은 GM 작업실입니다. 비밀 노트는 공개 표시와 별도로 보관됩니다.
      </small>
    </details>
  );
}
