import type { ReferenceEntry } from './references';
import {
  ownedReferenceTitle,
  type OwnedReferenceTitle,
} from './referenceTitleEvidence';
import {
  reviewedDisplayHelper,
  type ReviewedHelperClass,
} from './reviewedDisplayHelpers';
import {
  exactUiTranslation,
  polishKoreanTranslation,
  translateGeneratedText,
} from '../generators/translation';
import { getRules } from '../storage/rulesStore';
import { getOraclePack } from '../storage/oracleStore';

export interface ReferenceDisplayTitle {
  text?: string;
  classification:
    | 'trusted'
    | ReviewedHelperClass
    | 'unchanged'
    | 'absent'
    | 'unreviewed';
  origin?: OwnedReferenceTitle['origin'];
}
let previousRules: unknown, previousPack: unknown;
let helpers = new WeakMap<ReferenceEntry, ReferenceDisplayTitle>();

/** Secondary title policy only. Never changes the primary name or search terms. */
export function referenceDisplayTitle(
  entry: ReferenceEntry,
): ReferenceDisplayTitle {
  // This weather heading owns the UI meaning; a sound-table dictionary helper
  // must not rename the Wind reference when supplied title helpers take priority.
  if (entry.id === 'oracle:reclvse.wind' && entry.title === 'Wind')
    return {
      text: exactUiTranslation(entry.title),
      classification: 'trusted',
      origin: 'ui-name',
    };
  const owned = ownedReferenceTitle(entry);
  if (owned)
    return owned.text.normalize('NFC') === entry.title.normalize('NFC')
      ? { classification: 'unchanged' }
      : { text: owned.text, classification: 'trusted', origin: owned.origin };

  // The generic translator follows the loaded private packs. A replacement must
  // not reuse an earlier helper decision, even if a caller retains an old entry.
  const rules = getRules(),
    pack = getOraclePack();
  if (rules !== previousRules || pack !== previousPack) {
    helpers = new WeakMap();
    previousRules = rules;
    previousPack = pack;
  }
  const cached = helpers.get(entry);
  if (cached) return cached;
  const output = polishKoreanTranslation(translateGeneratedText(entry.title));
  const classification = !output
    ? 'absent'
    : output.normalize('NFC') === entry.title.normalize('NFC')
      ? 'unchanged'
      : (reviewedDisplayHelper(entry.id, entry.title, output) ?? 'unreviewed');
  const result: ReferenceDisplayTitle = {
    classification,
    ...(classification === 'useful' ? { text: output } : {}),
  };
  helpers.set(entry, result);
  return result;
}
