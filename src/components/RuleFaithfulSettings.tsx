import { ReferenceRollSettings } from './ReferenceRollSettings';
import {
  CLASSLESS_ABILITIES,
  WEATHER_DETAIL_IDS,
  type RuleFaithfulOptions,
  type OrakleLikelihood,
} from '../generators/ruleFaithfulReferences';
import type { ReferenceEntry } from '../domain/references';
import { exactUiTranslation } from '../generators/translation';

export function RuleFaithfulSettings({
  entry,
  value,
  onChange,
}: {
  entry: ReferenceEntry;
  value: RuleFaithfulOptions;
  onChange: (value: RuleFaithfulOptions) => void;
}) {
  const set = (patch: RuleFaithfulOptions) => onChange({ ...value, ...patch });
  if (
    entry.id === 'procedure:character.core-classless' &&
    (value.characterMode ?? 'classless') === 'classless'
  ) {
    const pairs = CLASSLESS_ABILITIES.flatMap((a, i) =>
      CLASSLESS_ABILITIES.slice(i + 1).map((b) => [a, b]),
    );
    return (
      <ReferenceRollSettings description="직업 없음(Classless) 전용: 두 능력치를 4d6으로 굴려 최저 주사위를 버리는 선택 규칙입니다. 나머지는 3d6으로 굴립니다. 오멘은 필요할 때 쓰는 선택 자원이며, 사용을 켜면 시작 오멘을 d2로 굴립니다. 다음 REROLL부터 적용됩니다.">
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
                {pair
                  .map(
                    (ability) => `${ability} · ${exactUiTranslation(ability)}`,
                  )
                  .join(' + ')}{' '}
                · 4d6, 최저값 제외
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
          Use Omens · 시작 1–2점 (오멘 사용)
        </label>
      </ReferenceRollSettings>
    );
  }
  if (entry.canonicalIds.includes('depths.orakle'))
    return (
      <ReferenceRollSettings description="10은 사건을 추가하고 다시 굴립니다. 사건은 겹칠 수 있습니다. 선택 DR은 ‘예(Yes)’가 위험을 뜻하는 질문에만 사용하세요. 질문을 입력할 필요는 없습니다.">
        <label>
          Likelihood · 가능성
          <select
            value={value.orakleLikelihood ?? 'even'}
            onChange={(e) =>
              set({ orakleLikelihood: e.target.value as OrakleLikelihood })
            }
          >
            {[
              ['very-unlikely', 'Very unlikely · 매우 낮음 · 3d20 ↓'],
              ['unlikely', 'Unlikely · 낮음 · 2d20 ↓'],
              ['even', 'Even · 반반 · d20'],
              ['likely', 'Likely · 높음 · 2d20 ↑'],
              ['very-likely', 'Very likely · 매우 높음 · 3d20 ↑'],
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
          Challenge DR · 도전 난이도 적용 (선택 규칙)
        </label>
        {value.orakleDR && (
          <label>
            Threat rating · 위협도
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
      <ReferenceRollSettings description="날씨 판정(Weather Move) 뒤에 1–3개 표를 선택하세요. 20이면 결과 아래에서 초자연적 날씨(Unnatural Weather)를 선택적으로 열 수 있습니다.">
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
            {
              {
                'reclvse.temperature': 'Temperature · 기온',
                'reclvse.precipitation': 'Precipitation · 강수',
                'reclvse.wind': 'Wind · 바람',
                'reclvse.visibility': 'Visibility · 시야',
              }[tableId]
            }
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
      <ReferenceRollSettings description="선택 사냥 규칙: d8/d10/d12를 쓰면 평범한 동물이 나올 가능성이 커집니다. 7 이상은 평범한 사냥감이며, 앱이 능력치를 임의로 부여하지 않습니다.">
        <label>
          Hunting die · 사냥 주사위
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
                {n === 6 ? ' · Standard · 기본' : ' · Optional · 선택 규칙'}
              </option>
            ))}
          </select>
        </label>
      </ReferenceRollSettings>
    );
  return null;
}
