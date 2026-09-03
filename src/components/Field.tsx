import { useId, useState } from 'react';
import { RotateCcw, Undo2, Eraser, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { RuleRoll } from '../generators';
import { SourceDisclosure } from './SourceDisclosure';
import { Translation } from './Translation';
import type { FieldSpec } from '../domain/types';
export function Field({
  spec,
  value,
  onChange,
  reroll,
  source,
  onReroll,
  translation,
}: {
  spec: FieldSpec;
  value: string | number;
  onChange: (value: string | number, source?: string) => void;
  reroll?: () => RuleRoll;
  source?: string;
  onReroll?: () => void;
  translation?: string;
}) {
  const htmlId = useId();
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<RuleRoll[]>([]);
  function roll() {
    if (!reroll) return;
    const next = reroll();
    setHistory((h) =>
      [{ value, source: source ?? '직접 작성' }, ...h].slice(0, 3),
    );
    onChange(next.value, next.source);
  }
  function undo() {
    if (!history.length) return;
    onChange(history[0].value, history[0].source);
    setHistory(history.slice(1));
  }
  return (
    <div
      className={`field ${spec.type === 'number' ? 'number-field' : ''} ${editing ? 'is-editing' : ''}`}
    >
      <div className="field-label">
        <label htmlFor={htmlId}>{spec.label}</label>
        <span className="field-tools">
          {editing && (
            <Button
              className="icon-btn"
              aria-label={`${spec.label} 편집 완료`}
              onClick={() => setEditing(false)}
            >
              <Check size={14} />
            </Button>
          )}
          {history.length > 0 && (
            <Button
              className="icon-btn"
              aria-label={`${spec.label} 이전 결과`}
              title="이전 결과"
              onClick={undo}
            >
              <Undo2 size={13} />
            </Button>
          )}
          {(reroll || onReroll) && (
            <Button
              className="icon-btn"
              aria-label={`${spec.label} 재굴림`}
              title={`${spec.label} 재굴림`}
              onClick={onReroll ?? roll}
            >
              <RotateCcw size={13} />
            </Button>
          )}
          {editing && spec.type !== 'number' && value !== '' && (
            <Button
              className="icon-btn clear-field"
              aria-label={`${spec.label} 비우기`}
              title="이 항목 비우기"
              onClick={() => {
                setHistory((h) =>
                  [{ value, source: source ?? '직접 작성' }, ...h].slice(0, 3),
                );
                onChange('');
              }}
            >
              <Eraser size={13} />
            </Button>
          )}
        </span>
      </div>
      {!editing && spec.type !== 'number' ? (
        <button
          id={htmlId}
          className={`field-value ${value === '' ? 'empty' : ''}`}
          aria-label={`${spec.label} 편집`}
          onClick={() => setEditing(true)}
        >
          {value === '' ? '직접 입력…' : value}
        </button>
      ) : spec.type === 'number' ? (
        <Input
          id={htmlId}
          type="number"
          className="number-input"
          onFocus={() => setEditing(true)}
          value={value}
          min={spec.min}
          max={spec.max}
          onChange={(e) => {
            if (e.target.value === '') onChange(0);
            else {
              const n = Number(e.target.value);
              if (Number.isFinite(n))
                onChange(
                  Math.max(
                    spec.min ?? -9999999,
                    Math.min(spec.max ?? 9999999, Math.trunc(n)),
                  ),
                );
            }
          }}
        />
      ) : spec.type === 'line' ? (
        <Input
          id={htmlId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-input"
          placeholder="직접 입력…"
        />
      ) : (
        <Textarea
          id={htmlId}
          className="prose-input"
          value={value}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          placeholder="직접 입력…"
        />
      )}
      {spec.type !== 'number' && (
        <Translation text={String(value)} translation={translation} />
      )}
      {editing && (
        <SourceDisclosure
          source={source ?? (value !== '' ? '직접 작성' : '직접 작성 가능')}
        />
      )}
    </div>
  );
}
