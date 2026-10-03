import { ReferenceRollSettings } from './ReferenceRollSettings';
import {
  CLASSLESS_ABILITIES,
  WEATHER_DETAIL_IDS,
  type RuleFaithfulOptions,
  type OrakleLikelihood,
} from '../generators/ruleFaithfulReferences';
import type { ReferenceEntry } from '../domain/references';

export function RuleFaithfulSettings({
  entry,
  value,
  onChange,
  coreCharacter,
}: {
  entry: ReferenceEntry;
  value: RuleFaithfulOptions;
  onChange: (value: RuleFaithfulOptions) => void;
  coreCharacter: boolean;
}) {
  const set = (patch: RuleFaithfulOptions) => onChange({ ...value, ...patch });
  if (coreCharacter && entry.id === 'procedure:character.core-classless') {
    const pairs = CLASSLESS_ABILITIES.flatMap((a, i) =>
      CLASSLESS_ABILITIES.slice(i + 1).map((b) => [a, b]),
    );
    return (
      <ReferenceRollSettings description="Classless only: optionally roll 4d6 and discard the lowest die for two chosen abilities. 나머지는 3d6으로 굴립니다. 다음 REROLL부터 적용됩니다.">
        <label>
          Ability rolls · 능력치
          <select
            aria-label="Classless 능력치 선택 규칙"
            value={(value.classlessBoost ?? []).join(',')}
            onChange={(e) =>
              set({
                classlessBoost: e.target.value
                  ? (e.target.value.split(
                      ',',
                    ) as RuleFaithfulOptions['classlessBoost'])
                  : [],
              })
            }
          >
            <option value="">Standard · 모두 3d6</option>
            {pairs.map((pair) => (
              <option key={pair.join(',')} value={pair.join(',')}>
                {pair.join(' + ')} · 4d6 drop lowest
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.coreOmens ?? false}
            onChange={(e) => set({ coreOmens: e.target.checked })}
          />{' '}
          Omens d2 · 선택 규칙
        </label>
      </ReferenceRollSettings>
    );
  }
  if (entry.canonicalIds.includes('depths.orakle'))
    return (
      <ReferenceRollSettings description="10은 사건을 추가하고 다시 굴립니다. 사건은 겹칠 수 있습니다. 선택 DR은 Yes가 위험한 질문에만 사용하세요. 질문을 입력할 필요는 없습니다.">
        <label>
          Likelihood · 가능성
          <select
            value={value.orakleLikelihood ?? 'even'}
            onChange={(e) =>
              set({ orakleLikelihood: e.target.value as OrakleLikelihood })
            }
          >
            {[
              ['very-unlikely', 'Very unlikely · 3d20 ↓'],
              ['unlikely', 'Unlikely · 2d20 ↓'],
              ['even', 'Even · d20'],
              ['likely', 'Likely · 2d20 ↑'],
              ['very-likely', 'Very likely · 3d20 ↑'],
            ].map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.orakleDR ?? false}
            onChange={(e) => set({ orakleDR: e.target.checked })}
          />{' '}
          Challenge DR · 선택 규칙
        </label>
        {value.orakleDR && (
          <label>
            Threat rating
            <input
              type="number"
              min={3}
              max={30}
              step={1}
              value={value.orakleTR ?? 12}
              onChange={(e) => set({ orakleTR: Number(e.target.value) })}
            />
          </label>
        )}
      </ReferenceRollSettings>
    );
  if (entry.id === 'procedure:reclvse.weather-detail') {
    const chosen = value.weatherDetails ?? WEATHER_DETAIL_IDS.slice(0, 2);
    return (
      <ReferenceRollSettings description="Weather Move 뒤에 1–3개 표를 선택하세요. 20이면 결과 아래에서 Unnatural Weather를 선택적으로 열 수 있습니다.">
        {WEATHER_DETAIL_IDS.map((tableId) => (
          <label key={tableId}>
            <input
              type="checkbox"
              checked={chosen.includes(tableId)}
              disabled={
                chosen.includes(tableId)
                  ? chosen.length === 1
                  : chosen.length === 3
              }
              onChange={(e) =>
                set({
                  weatherDetails: e.target.checked
                    ? [...chosen, tableId]
                    : chosen.filter((t) => t !== tableId),
                })
              }
            />
            {tableId.split('.')[1]}
          </label>
        ))}
      </ReferenceRollSettings>
    );
  }
  if (
    entry.id === 'procedure:workbench.epk' ||
    entry.canonicalIds.some((t) => t.startsWith('feretory.hunting.'))
  )
    return (
      <ReferenceRollSettings description="Optional hunting: d8/d10/d12 makes ordinary animals more likely. 7+ is mundane prey; its statistics are not invented.">
        <label>
          Hunting die
          <select
            value={value.huntingDie ?? 6}
            onChange={(e) =>
              set({
                huntingDie: Number(
                  e.target.value,
                ) as RuleFaithfulOptions['huntingDie'],
              })
            }
          >
            {[6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                d{n}
                {n === 6 ? ' · Standard' : ' · Optional'}
              </option>
            ))}
          </select>
        </label>
      </ReferenceRollSettings>
    );
  return null;
}
