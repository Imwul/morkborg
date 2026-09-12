import type { Campaign } from '../domain/types';
import type { CaptureKind } from '../domain/captureContext';
import { FreeformWorkbench } from './FreeformWorkbench';
/** PLAY is now a collection of independent reference tools. */
export function PlayMode(_props: {
  campaign?: Campaign;
  onCapture?: (kind?: CaptureKind) => void;
  onOracles?: () => void;
  notify?: (message: string) => void;
}) {
  return <FreeformWorkbench />;
}
