import { useRef, useState } from 'react';
import {
  newCombatSession,
  parseCombatSession,
  type CombatSession,
} from '../domain/combatTool';

export const COMBAT_SESSION_KEY = 'morkborg-combat-tool:v1';
function load() {
  try {
    const raw = sessionStorage.getItem(COMBAT_SESSION_KEY);
    return {
      session: raw ? parseCombatSession(raw) : newCombatSession(),
      error: '',
      damaged: false,
    };
  } catch {
    return {
      session: newCombatSession(),
      error:
        '이 탭의 전투 자료를 읽지 못했습니다. 기존 자료는 보존했습니다. 새 전투로 시작할 수 있습니다.',
      damaged: true,
    };
  }
}
export function useCombatSession() {
  const [initial] = useState(load);
  const [session, setSession] = useState(initial.session);
  const current = useRef(session);
  const damaged = useRef(initial.damaged);
  const [storageError, setStorageError] = useState(initial.error);
  function set(next: CombatSession, reset = false) {
    if (damaged.current && !reset)
      throw new Error(
        '읽지 못한 기록을 덮어쓰지 않습니다. 새 전투를 선택하세요.',
      );
    current.current = next;
    setSession(next);
    try {
      sessionStorage.setItem(COMBAT_SESSION_KEY, JSON.stringify(next));
      damaged.current = false;
      setStorageError('');
    } catch {
      setStorageError(
        '브라우저 임시 저장에 실패했습니다. 현재 창에서는 모든 되돌리기가 유지되지만 새로고침하면 최신 상태를 잃을 수 있습니다.',
      );
    }
  }
  return { session, current, set, storageError };
}
