import type { RuleFaithfulOptions } from '../generators/ruleFaithfulReferences';
import type { CharacterClassDefinition } from '../generators/characterClasses';
import type { ReferenceReading } from '../domain/referenceReading';
import { translateGeneratedText } from '../generators/translation';
import {
  RECLVSE_BLESSINGS,
  RECLVSE_BLESSING_IDS,
  type ReclvseFortitudeMode,
} from '../domain/reclvseStartingBlessings';

const modes = [
  ['classless', 'Classless · 직업 없음'],
  ['random', 'Random Class · 무작위 직업'],
  ['chosen', 'Choose Class · 직업 선택'],
] as const;
const books: Record<string, string> = {
  'core-full': 'MÖRK BORG · Core',
  feretory: 'FERETORY',
  heretic: 'HERETIC',
};

export function CharacterGenerationControl({
  value,
  onChange,
  classes,
  reading,
}: {
  value: RuleFaithfulOptions;
  onChange: (next: RuleFaithfulOptions) => void;
  classes: CharacterClassDefinition[];
  reading?: ReferenceReading;
}) {
  const mode = value.characterMode ?? 'classless';
  const choice = classes.find((def) => def.id === value.characterClassId);
  const currentMode = reading?.procedureInputs?.characterMode ?? 'classless';
  const blessings = value.reclvseBlessings ?? [];
  const blessingKey = RECLVSE_BLESSING_IDS.filter((id) =>
    blessings.includes(id),
  ).join(',');
  const enhanced = blessings.includes('enhanced-fortitude');
  const fortitude = value.reclvseFortitude ?? 'fixed12';
  const pending =
    !!reading &&
    (reading.procedureInputs?.generator === 'scvmbirther' ||
      currentMode !== mode ||
      String(reading.procedureInputs?.reclvseBlessings ?? '') !== blessingKey ||
      (enhanced &&
        (reading.procedureInputs?.reclvseFortitude ?? 'fixed12') !==
          fortitude) ||
      (mode === 'chosen' &&
        reading.procedureInputs?.characterClassId !== value.characterClassId));
  return (
    <div className="character-generation-control">
      <fieldset className="character-generation-modes">
        <legend className="sr-only">
          Character generation · 캐릭터 생성 방식
        </legend>
        {modes.map(([key, title]) => (
          <button
            type="button"
            key={key}
            aria-pressed={mode === key}
            disabled={key !== 'classless' && !classes.length}
            onClick={() =>
              onChange({
                ...value,
                characterMode: key,
                ...(key === 'chosen' && !choice
                  ? { characterClassId: classes[0]?.id }
                  : {}),
              })
            }
          >
            {title}
          </button>
        ))}
      </fieldset>
      {mode === 'chosen' && (
        <label className="character-generation-choice">
          Class · 직업
          <select
            aria-label="Class · 생성 직업"
            value={value.characterClassId ?? ''}
            onChange={(event) =>
              onChange({ ...value, characterClassId: event.target.value })
            }
          >
            <option value="" disabled>
              직업 선택
            </option>
            {[...new Set(classes.map((def) => def.source.bookId))].map(
              (book) => (
                <optgroup key={book} label={books[book] ?? book}>
                  {classes
                    .filter((def) => def.source.bookId === book)
                    .map((def) => {
                      const ko = translateGeneratedText(def.name);
                      return (
                        <option key={def.id} value={def.id}>
                          {def.name}
                          {ko && ko !== def.name ? ` · ${ko}` : ''}
                        </option>
                      );
                    })}
                </optgroup>
              ),
            )}
          </select>
        </label>
      )}
      <details className="character-blessings-control">
        <summary>
          RECLVSE 시작 축복 ·{' '}
          {blessings.length ? `${blessings.length}개 선택` : '선택 안 함'}
        </summary>
        <p className="character-blessings-notice">
          Core 캐릭터에 명시적으로 추가하는 RECLVSE 선택 규칙입니다. 상세
          규칙(PDF 13)은 ‘하나 이상’, 생성 요약(PDF 18)은 ‘하나’로 서로
          다릅니다. 여기서는 상세 규칙에 따라 복수 선택할 수 있습니다. 현재
          결과에는 소급 적용하지 않습니다.
        </p>
        <fieldset className="character-blessings-options">
          <legend className="sr-only">RECLVSE 시작 축복 선택</legend>
          {RECLVSE_BLESSINGS.map((blessing) => (
            <label
              key={blessing.id}
              aria-label={`${blessing.title} · ${blessing.titleKo}`}
            >
              <input
                type="checkbox"
                checked={blessings.includes(blessing.id)}
                onChange={(event) =>
                  onChange({
                    ...value,
                    reclvseBlessings: RECLVSE_BLESSING_IDS.filter((id) =>
                      id === blessing.id
                        ? event.target.checked
                        : blessings.includes(id),
                    ),
                  })
                }
              />
              <span>
                <span>
                  {blessing.title} · {blessing.titleKo}
                </span>
                <small>{blessing.hint}</small>
              </span>
            </label>
          ))}
        </fieldset>
        {enhanced && (
          <label className="character-generation-choice">
            시작 HP 방식
            <select
              aria-label="시작 축복 HP 방식"
              value={fortitude}
              onChange={(event) =>
                onChange({
                  ...value,
                  reclvseFortitude: event.target.value as ReclvseFortitudeMode,
                })
              }
            >
              <option value="fixed12">12 고정 · 체력 보정 없음</option>
              <option value="10+d4">10+d4 · 체력 보정 없음</option>
            </select>
          </label>
        )}
      </details>
      <details className="character-generation-help">
        <summary>안내</summary>
        <p>
          직업 없음(Classless)은 직업 없이 생성합니다. 무작위 직업(Random
          Class)은 지원하는 {classes.length}개 직업 중 하나를 같은 확률로
          고릅니다. 직업 선택(Choose Class)은 선택한 직업의 능력치·시작
          장비·오멘 규칙을 적용합니다. 설정을 바꿔도 현재 결과는 유지되며 다음
          ROLL / REROLL부터 적용됩니다.
        </p>
      </details>
      {pending && (
        <output className="character-generation-pending">
          다음 REROLL부터 적용 ·{' '}
          {mode === 'chosen'
            ? (choice?.name ?? '직업 선택')
            : modes.find(([key]) => key === mode)![1]}
          {' · 축복 '}
          {blessings.length ? `${blessings.length}개` : '없음'}
        </output>
      )}
    </div>
  );
}
