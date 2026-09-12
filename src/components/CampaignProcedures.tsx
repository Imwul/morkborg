import type { Campaign } from '../domain/types';
import { JourneyWorkbench } from './JourneyWorkbench';
/** Compatibility entry point for the old calendar/travel route. */
export function CampaignProcedures(_props: {
  campaign?: Campaign;
  notify?: (message: string) => void;
  onCity?: () => void;
}) {
  return <JourneyWorkbench />;
}
