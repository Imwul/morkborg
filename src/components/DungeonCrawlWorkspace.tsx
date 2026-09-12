import type { Campaign, Dungeon } from '../domain/types';
import type { Confirm } from './Library';
import { FreeformWorkbench } from './FreeformWorkbench';
/** Saved dungeon context is deliberately not an input to reference availability. */
export function DungeonCrawlWorkspace(_props: {
  campaign?: Campaign;
  dungeon?: Dungeon;
  notify?: (message: string) => void;
  confirm?: Confirm;
}) {
  return <FreeformWorkbench initialShelf="dungeon" />;
}
