import type { Campaign } from '../domain/types';
import type { OracleRegistry } from '../domain/oracle';
import { FreeformWorkbench } from './FreeformWorkbench';
/** Historical callers may pass campaign data; reference tools never read it. */
export function JourneyWorkbench(_props: {
  campaign?: Campaign;
  registry?: OracleRegistry;
  loading?: boolean;
  notify?: (message: string) => void;
  onCity?: () => void;
}) {
  return <FreeformWorkbench initialShelf="travel" />;
}
