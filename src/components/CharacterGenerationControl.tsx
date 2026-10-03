import type { RuleFaithfulOptions } from '../generators/ruleFaithfulReferences';
import type { CharacterClassDefinition } from '../generators/characterClasses';
import type { ReferenceReading } from '../domain/referenceReading';

const modes = [
  ['classless', 'Classless'],
  ['random', 'Random Class'],
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
  const pending =
    !!reading &&
    (reading.procedureInputs?.generator === 'scvmbirther' ||
      currentMode !== mode ||
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
                    .map((def) => (
                      <option key={def.id} value={def.id}>
                        {def.name}
                      </option>
                    ))}
                </optgroup>
              ),
            )}
          </select>
        </label>
      )}
      <details className="character-generation-help">
        <summary>안내</summary>
        <p>
          Classless는 직업 없이 생성합니다. Random Class는 지원하는{' '}
          {classes.length}개 직업 중 하나를 같은 확률로 고릅니다. Choose Class는
          선택한 직업의 능력치·시작 장비·Omens 규칙을 적용합니다. 설정을 바꿔도
          현재 결과는 유지되며 다음 ROLL / REROLL부터 적용됩니다.
        </p>
      </details>
      {pending && (
        <output className="character-generation-pending">
          다음 REROLL부터 적용 ·{' '}
          {mode === 'chosen'
            ? (choice?.name ?? '직업 선택')
            : modes.find(([key]) => key === mode)![1]}
        </output>
      )}
    </div>
  );
}
