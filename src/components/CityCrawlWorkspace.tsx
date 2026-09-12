import type { OracleRegistry } from '../domain/oracle';
import type { RegionId } from '../domain/types';
import { FreeformWorkbench } from './FreeformWorkbench';
/** An independent city reference, without saved streets, scenes or objectives. */
export function CityCrawlWorkspace(_props: {
  registry?: OracleRegistry;
  region?: RegionId;
}) {
  return <FreeformWorkbench initialShelf="city" />;
}
