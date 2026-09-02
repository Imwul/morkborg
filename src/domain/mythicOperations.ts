import type { AppSave } from './types';
import { defaultMythicState, type MythicState } from './mythic';
import { applyCampaignEdit } from './operations';

export function editMythic(
  save: AppSave,
  campaignId: string | null,
  action: (state: MythicState) => void,
): void {
  if (campaignId === null) {
    save.mythic ??= defaultMythicState();
    action(save.mythic);
    return;
  }
  const c = save.campaigns.find((c) => c.id === campaignId);
  if (!c) throw new Error('판정을 저장할 캠페인이 더 이상 존재하지 않습니다.');
  applyCampaignEdit(c, (current) => {
    current.mythic ??= defaultMythicState();
    action(current.mythic);
  });
}
