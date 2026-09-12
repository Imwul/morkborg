import { ReferenceDesk } from './ReferenceWorkbench';
import type { ReferenceShelf } from '../domain/freeformReference';
export {
  ReferenceDice,
  RoadSituationRoller,
  DungeonReferenceRoller,
} from './ReferenceDice';
/** Compatibility entry points share the same desk; context only filters the index. */
export function FreeformWorkbench({
  initialShelf = 'quick',
}: {
  initialShelf?: ReferenceShelf;
  showTabs?: boolean;
}) {
  return <ReferenceDesk initialShelf={initialShelf} />;
}
