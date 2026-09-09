import { useState } from 'react';
import type { ReferenceEntry, ReferenceRegistry } from '../domain/references';
import type { OracleRegistry } from '../domain/oracle';
import type { ReferenceReading } from '../domain/referenceReading';
import { copyReferenceReading } from '../domain/referenceReading';
import {
  executeReference,
  referenceProducesRoll,
  type ReferenceExecutionOptions,
} from '../domain/referenceExecution';
import { referenceRegion } from '../domain/referenceActions';
import {
  independentTables,
  rerollHeldReference,
  runRecipeSteps,
  type RecipeResult,
} from '../domain/heldReferenceResults';
import {
  manualRareMonster,
  manualTableReading,
} from '../domain/manualReferenceRoll';
import { builtInReferencePacks } from '../domain/conveniencePacks';
import {
  addToTray,
  appendScratch,
  readConveniencePreferences,
  readPlaySession,
  writeConveniencePreferences,
  writePlaySession,
  type ConveniencePreferences,
  type PlaySession,
  type ExecutionParameters,
  type LastRoll,
} from '../storage/conveniencePreferences';

export type ConvenienceTab = 'play' | 'recipes' | 'packs' | 'scratch';
export function useReferenceConvenience({
  index,
  registry,
  options,
  readings,
  accept,
  open,
  notify,
  onDeck,
  restoreParameters,
}: {
  index: ReferenceRegistry;
  registry: OracleRegistry;
  options: ReferenceExecutionOptions;
  readings: Record<string, ReferenceReading>;
  accept: (id: string, r: ReferenceReading, rolled?: boolean) => void;
  open: (id: string) => void;
  notify: (text: string) => void;
  onDeck: (deck: ReferenceExecutionOptions['rareDeck']) => void;
  restoreParameters: (params: ExecutionParameters) => void;
}) {
  const [preferences, setPreferences] = useState(readConveniencePreferences),
    [temporary, setTemporary] = useState(readPlaySession);
  const [panel, setPanel] = useState<ConvenienceTab | null>(null),
    [held, setHeld] = useState<Record<string, string[]>>({});
  const [manualId, setManualId] = useState<string | null>(null),
    [manualInputs, setManualInputs] = useState<
      Record<string, Record<string, string>>
    >({});
  const [recipeId, setRecipeId] = useState<string | null>(null),
    [recipeResults, setRecipeResults] = useState<
      Record<string, RecipeResult[]>
    >({});
  const [error, setError] = useState('');
  const [holdOpen, setHoldOpen] = useState<Record<string, boolean>>({});
  const packs = [...builtInReferencePacks(index), ...preferences.packs],
    activePack = packs.find((p) => p.id === preferences.activePackId);
  function updatePreferences(
    fn: (p: ConveniencePreferences) => ConveniencePreferences,
  ) {
    setPreferences((previous) => {
      const next = fn(previous);
      try {
        writeConveniencePreferences(next);
      } catch {
        notify('모음·레시피를 저장하지 못했습니다.');
      }
      return next;
    });
  }
  function updateTemporary(fn: (p: PlaySession) => PlaySession) {
    setTemporary((previous) => {
      const next = fn(previous);
      try {
        writePlaySession(next);
      } catch {
        notify('임시 도구를 저장하지 못했습니다. 이 화면에서만 유지합니다.');
      }
      return next;
    });
  }
  function parameters(
    overrides: Partial<ExecutionParameters> = {},
  ): ExecutionParameters {
    return {
      region: overrides.region ?? options.region,
      stockKind: overrides.stockKind ?? options.stockKind,
      stockDR: overrides.stockDR ?? options.stockDR,
      cityLarge: overrides.cityLarge ?? options.cityLarge,
      cityExits: overrides.cityExits ?? options.cityExits,
      encounterRegion:
        overrides.encounterRegion ?? options.encounterRegion ?? 'sarkash',
      rareDeck: overrides.rareDeck ?? options.rareDeck,
    };
  }
  function remember(request: LastRoll) {
    updateTemporary((p) => ({ ...p, lastRoll: request }));
  }
  function addTray(id: string) {
    if (!index.byId[id]) return;
    if (temporary.tray.length >= 12 && !temporary.tray.includes(id)) {
      notify('Play Tray에는 최대 12개까지 둘 수 있습니다.');
      return;
    }
    updateTemporary((p) => (p.tray.length >= 12 ? p : addToTray(p, id)));
  }
  function scratch(text: string) {
    if (temporary.scratch.length + text.length + 2 > 12000) {
      notify('스크랩이 가득 찼습니다. 복사한 뒤 비워 주세요.');
      return;
    }
    updateTemporary((p) => appendScratch(p, text));
    notify('스크랩에 추가했습니다.');
  }
  function toggleHold(id: string, key: string) {
    setHeld((p) => ({
      ...p,
      [id]: p[id]?.includes(key)
        ? p[id].filter((k) => k !== key)
        : [...(p[id] ?? []), key],
    }));
  }
  function run(
    entry: ReferenceEntry,
    context = options.region,
    override?: ExecutionParameters,
    only?: string,
  ) {
    const params =
        override ?? parameters({ region: referenceRegion(entry, context) }),
      opts = { ...options, ...params };
    const current = readings[entry.id],
      holds = held[entry.id] ?? [];
    const output =
      current && (holds.length || only !== undefined)
        ? rerollHeldReference(entry, current, holds, opts, only)
        : executeReference(entry, opts);
    if (!output) return;
    if (output.rareMonster) onDeck(output.rareMonster.remaining);
    const rolled = referenceProducesRoll(entry);
    accept(
      entry.id,
      rolled
        ? { ...output, rollMethod: output.rollMethod ?? { kind: 'APP_ROLL' } }
        : output,
      rolled,
    );
    if (rolled)
      remember({
        kind: 'reference',
        id: entry.id,
        mode: 'APP_ROLL',
        parameters: {
          ...params,
          ...(output.rareMonster
            ? { rareDeck: output.rareMonster.remaining }
            : {}),
        },
      });
    return output;
  }
  function manual(entry: ReferenceEntry) {
    try {
      setError('');
      const inputs = manualInputs[entry.id] ?? {};
      const output =
        entry.action?.kind === 'procedure' &&
        entry.action.procedureId === 'depths.rare-monster'
          ? manualRareMonster(inputs.cards ?? '', registry, options.rareDeck)
          : manualTableReading(
              entry,
              independentTables(entry, registry),
              inputs,
              registry,
            );
      if (!output.blocks.length)
        throw new Error(
          '이 절차는 실물 입력을 지원하는 표를 직접 열어 확인하세요.',
        );
      if (output.rareMonster) onDeck(output.rareMonster.remaining);
      setHeld((p) => ({ ...p, [entry.id]: [] }));
      accept(entry.id, output);
      setManualId(null);
      remember({
        kind: 'reference',
        id: entry.id,
        mode: 'USER_ROLL',
        inputs,
        parameters: parameters(
          output.rareMonster ? { rareDeck: output.rareMonster.remaining } : {},
        ),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '입력을 확인하세요.');
    }
  }
  function runRecipe(
    id: string,
    only?: number,
    override?: ExecutionParameters,
  ) {
    const recipe = preferences.recipes.find((r) => r.id === id);
    setPanel('recipes');
    setRecipeId(id);
    if (!recipe) {
      setError('이 레시피는 삭제됐습니다. 다른 참조를 선택하세요.');
      return;
    }
    setError('');
    let opts = { ...options, ...(override ?? parameters()) };
    const next = runRecipeSteps(
      recipe.referenceIds,
      index.byId,
      recipeResults[id] ?? [],
      (entry) => {
        const result = executeReference(entry, {
          ...opts,
          region: referenceRegion(entry, opts.region),
        });
        if (result?.rareMonster) {
          opts = { ...opts, rareDeck: result.rareMonster.remaining };
          onDeck(result.rareMonster.remaining);
        }
        return result;
      },
      only,
    );
    setRecipeResults((p) => ({ ...p, [id]: next }));
    remember({
      kind: 'recipe',
      id,
      mode: 'APP_ROLL',
      parameters: parameters(opts),
    });
  }
  function rerollLast() {
    const last = temporary.lastRoll;
    if (!last) return;
    try {
      setError('');
      restoreParameters(last.parameters);
      if (last.kind === 'recipe') {
        runRecipe(last.id, undefined, last.parameters);
        return;
      }
      const entry = index.byId[last.id];
      if (!entry) {
        setPanel('play');
        setError('마지막 참조가 현재 자료에 없습니다. 다른 참조를 선택하세요.');
        return;
      }
      setPanel(null);
      open(entry.id);
      if (last.mode === 'USER_ROLL') {
        if (last.parameters.rareDeck) onDeck(last.parameters.rareDeck);
        setManualInputs((p) => ({ ...p, [entry.id]: last.inputs ?? {} }));
        setManualId(entry.id);
        notify('새 실물 굴림을 입력하세요.');
        return;
      }
      if (last.mode === 'OPEN' || !entry.available) {
        notify('이 절차의 입력·원문을 먼저 확인하세요.');
        return;
      }
      run(entry, last.parameters.region, last.parameters);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : '마지막 참조를 다시 열어 확인하세요.',
      );
    }
  }
  return {
    preferences,
    temporary,
    updatePreferences,
    updateTemporary,
    panel,
    setPanel,
    held,
    holdOpen,
    setHoldOpen,
    toggleHold,
    manualId,
    setManualId,
    manualInputs,
    setManualInputs,
    manual,
    run,
    remember,
    parameters,
    addTray,
    scratch,
    rerollLast,
    recipeId,
    setRecipeId,
    recipeResults,
    setRecipeResults,
    runRecipe,
    packs,
    activePack,
    error,
    setError,
    sendReading: (reading: ReferenceReading, withSource = false) =>
      scratch(copyReferenceReading(reading, withSource)),
  };
}
export type ReferenceConvenience = ReturnType<typeof useReferenceConvenience>;
