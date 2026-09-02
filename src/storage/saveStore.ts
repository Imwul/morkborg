import { useSyncExternalStore } from 'react';
import type { AppSave, Campaign, Workspace } from '../domain/types';
import { now } from '../generators/random';
import { validateSave } from './schema';
export const STORAGE_KEY = 'morkborg-codex:v1';
export interface PersistenceAdapter {
  read(): string | null;
  write(value: string): void;
}
export const localAdapter: PersistenceAdapter = {
  read: () => localStorage.getItem(STORAGE_KEY),
  write: (value) => localStorage.setItem(STORAGE_KEY, value),
};
const empty = (): AppSave => ({
  schemaVersion: 1,
  campaigns: [],
  activeCampaignId: null,
});
interface Snapshot {
  save: AppSave;
  error: string | null;
  blocked: boolean;
  recovery: string | null;
}
let snapshot: Snapshot = {
  save: empty(),
  error: null,
  blocked: false,
  recovery: null,
};
try {
  const raw = localAdapter.read();
  if (raw) snapshot.save = validateSave(JSON.parse(raw));
} catch (error) {
  let recovery: string | null = null;
  try {
    recovery = localAdapter.read();
  } catch {
    /* browser storage unavailable */
  }
  snapshot = {
    save: empty(),
    error: `저장 데이터를 불러오지 못했습니다. ${error instanceof Error ? error.message : ''}`,
    blocked: true,
    recovery,
  };
}
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
export const getSnapshot = () => snapshot;
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const useSave = () =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
export function transact(action: (save: AppSave) => void): void {
  if (snapshot.blocked)
    throw new Error(
      '읽을 수 없는 저장 데이터를 복구하거나 초기화한 뒤 편집하세요.',
    );
  const next = structuredClone(snapshot.save);
  action(next);
  validateSave(next);
  let error: string | null = null;
  try {
    localAdapter.write(JSON.stringify(next));
  } catch {
    error =
      '저장 공간이 가득 찼거나 사용할 수 없습니다. 현재 변경은 메모리에만 있으므로 JSON 백업을 내보내세요.';
  }
  snapshot = { save: next, error, blocked: false, recovery: null };
  emit();
}
export function editCampaign(
  campaignId: string,
  action: (campaign: Campaign) => void,
): void {
  transact((save) => {
    const c = save.campaigns.find((c) => c.id === campaignId);
    if (!c) throw new Error('캠페인을 찾지 못했습니다.');
    action(c);
    c.updatedAt = now();
  });
}
export function changeWorkspace(
  campaignId: string,
  patch: Partial<Workspace>,
): void {
  editCampaign(campaignId, (c) => Object.assign(c.workspace, patch));
}
export function resetDamagedSave(): void {
  localAdapter.write(JSON.stringify(empty()));
  snapshot = { save: empty(), error: null, blocked: false, recovery: null };
  emit();
}
export function retrySave(): void {
  if (snapshot.blocked) return;
  try {
    localAdapter.write(JSON.stringify(snapshot.save));
    snapshot = { ...snapshot, error: null };
  } catch {
    snapshot = {
      ...snapshot,
      error:
        '저장 공간을 아직 사용할 수 없습니다. 변경 내용을 보존하려면 백업을 내보내세요.',
    };
  }
  emit();
}
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  if (snapshot.error) return;
  try {
    snapshot = {
      save: event.newValue ? validateSave(JSON.parse(event.newValue)) : empty(),
      error: null,
      blocked: false,
      recovery: null,
    };
    emit();
  } catch {
    snapshot = {
      ...snapshot,
      error:
        '다른 탭의 저장 데이터를 읽을 수 없습니다. 현재 캠페인은 유지됩니다.',
    };
    emit();
  }
});
export function downloadJson(value: unknown, filename: string): void {
  downloadText(JSON.stringify(value, null, 2), filename);
}
export function downloadText(value: string, filename: string): void {
  const url = URL.createObjectURL(
    new Blob([value], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
