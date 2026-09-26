import { usePlayToolState } from './usePlayToolState';
import { GuidedRollControl } from './GuidedRollControl';
export function GeneralActionCheck({ sd }: { sd: boolean }) {
  const [ability, setAbility] = usePlayToolState(
    `general:${sd}:ability`,
    'Strength',
  );
  const [dr, setDR] = usePlayToolState(`general:${sd}:dr`, '12');
  const valid =
    /^\d+$/.test(dr) && Number(dr) > 0 && Number.isSafeInteger(Number(dr));
  return (
    <section className="play-guidance" aria-label="일반 행동 판정">
      <h3>{sd ? 'SD 일반 모험 판정' : 'Core 능력 판정'}</h3>
      <p>
        {sd
          ? '각 d20을 따로 비교합니다. Weak는 성공과 대가. 전투·권능·별도 절차는 해당 규칙을 따릅니다.'
          : '보정한 d20이 DR 이상이면 성공합니다. 구체적인 효과는 행동의 맥락으로 정합니다.'}
      </p>
      <div className="guidance-selectors">
        <label>
          능력
          <select value={ability} onChange={(e) => setAbility(e.target.value)}>
            {[
              'Strength',
              'Agility',
              'Presence',
              'Toughness',
              ...(sd ? ['남은 Omens'] : []),
            ].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          DR
          <input
            type="number"
            step="1"
            min="1"
            value={dr}
            onChange={(e) => setDR(e.target.value)}
          />
        </label>
      </div>
      {valid ? (
        <GuidedRollControl
          key={`${sd}:${ability}:${dr}`}
          label="일반 행동"
          stateKey={`general:${sd}`}
          spec={{
            kind: 'test',
            dice: sd ? '2d20' : 'd20',
            ability,
            dr: Number(dr),
          }}
        />
      ) : (
        <p role="alert">DR은 1 이상의 정수입니다.</p>
      )}
    </section>
  );
}
