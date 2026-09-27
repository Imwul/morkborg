import fs from 'node:fs';
import assert from 'node:assert/strict';
const output = 'outputs/reference-proximity';
const before = JSON.parse(
  fs.readFileSync('docs/reference-proximity/before-audit.json'),
);
const after = [360, 768, 1440, 3440].flatMap((w) =>
  JSON.parse(fs.readFileSync(`${output}/after-${w}.json`)),
);
assert.equal(after.length, 132);
assert(after.every((r) => r.status === 'passed'));
const key = (r) => `${r.viewport.width}:${r.id}`;
const amap = new Map(after.map((r) => [key(r), r]));
assert.equal(amap.size, before.length);
const classify = (r) => {
  if (r.focusRestored === false) return 'E';
  if ([18, 19, 23].includes(r.fixture)) return 'F';
  if (r.fixture === 33 || ['V1', 'V2'].includes(r.visibility)) return 'A';
  return 'G';
};
function stats(rows) {
  const d = rows.map((r) => r.firstActionDistancePx).sort((a, b) => a - b);
  const middle = Math.floor(d.length / 2);
  return {
    n: rows.length,
    medianDistancePx:
      d.length % 2 ? d[middle] : (d[middle - 1] + d[middle]) / 2,
    p90DistancePx: d[Math.ceil(d.length * 0.9) - 1],
    visibility: Object.fromEntries(
      ['V0', 'V1', 'V2', 'V3', 'V4'].map((v) => [
        v,
        rows.filter((r) => r.visibility === v).length,
      ]),
    ),
    actionScrollPx: rows.reduce((n, r) => n + r.actionScroll.distance, 0),
    totalScrollPx: rows.reduce((n, r) => n + r.totalScroll.distance, 0),
    actionScrollEvents: rows.reduce((n, r) => n + r.actionScroll.events, 0),
    totalScrollEvents: rows.reduce((n, r) => n + r.totalScroll.events, 0),
    clicks: rows.reduce((n, r) => n + r.clicks, 0),
    taps: rows.reduce((n, r) => n + r.taps, 0),
    keyboardActivations: rows.reduce((n, r) => n + r.keyboardActivations, 0),
    disclosures: rows.reduce((n, r) => n + r.extraDisclosures, 0),
    backs: rows.reduce((n, r) => n + r.browserBack, 0),
    focusLost: rows.filter((r) => r.focusRestored === false).length,
    scrollLost: rows.filter((r) => r.scrollRestored === false).length,
    detailsLost: rows.filter((r) => r.detailsRestored === false).length,
    readingLost: rows.filter((r) => r.readingRestored === false).length,
    horizontalOverflows: rows.filter((r) => r.documentOverflow > 0).length,
  };
}
const comparisons = before.map((b) => {
  const a = amap.get(key(b));
  return {
    fixture: b.fixture,
    width: b.viewport.width,
    id: b.id,
    kind: b.kind,
    cause: classify(b),
    distanceDelta: a.firstActionDistancePx - b.firstActionDistancePx,
    scrollDelta: a.actionScroll.distance - b.actionScroll.distance,
    visibilityBefore: b.visibility,
    visibilityAfter: a.visibility,
    focusFixed: b.focusRestored === false && a.focusRestored === true,
    targetSizeFixed: b.targetSize.height < 44 && a.targetSize.height >= 44,
    ...(b.labelGapPx != null
      ? { gapBefore: b.labelGapPx, gapAfter: a.labelGapPx }
      : {}),
  };
});
const result = {
  definitions: {
    sample:
      '33 predeclared references × 4 viewport sizes; each result fixture prepared by explicit UI Roll then reopened through Search',
    distance:
      'target top in document minus initial viewport top, clamped to zero; hidden target measured after opening its disclosure, tagged V3',
    scroll:
      'actionScroll excludes Search/setup and navigation/Back; totalScroll includes navigation/Back and native focus scrolling; native scroll events are coalesced, so distances are primary',
    p90: 'nearest rank',
    cause:
      'primary cause, mutually exclusive; E precedes F, then natural content length A, otherwise expected cost G',
  },
  before: stats(before),
  after: stats(after),
  kinds: Object.fromEntries(
    [...new Set(before.map((r) => r.kind))].map((k) => [
      k,
      {
        before: stats(before.filter((r) => r.kind === k)),
        after: stats(after.filter((r) => r.kind === k)),
      },
    ]),
  ),
  viewports: Object.fromEntries(
    [360, 768, 1440, 3440].map((w) => [
      w,
      {
        before: stats(before.filter((r) => r.viewport.width === w)),
        after: stats(after.filter((r) => r.viewport.width === w)),
      },
    ]),
  ),
  primaryCauses: Object.fromEntries(
    'ABCDEFG'
      .split('')
      .map((c) => [c, comparisons.filter((r) => r.cause === c).length]),
  ),
  regressionBudget: {
    improvedInteraction: comparisons.filter(
      (r) =>
        r.focusFixed ||
        r.targetSizeFixed ||
        (r.gapBefore != null && r.gapAfter < r.gapBefore - 1),
    ).length,
    furtherVerticalTarget: comparisons.filter((r) => r.distanceDelta > 0)
      .length,
    moreActionScroll: comparisons.filter((r) => r.scrollDelta > 1).length,
    anyVerticalIncrease: comparisons.filter(
      (r) => r.distanceDelta > 0 || r.scrollDelta > 1,
    ).length,
    newV3V4: comparisons.filter(
      (r) =>
        ['V3', 'V4'].includes(r.visibilityAfter) &&
        r.visibilityAfter !== r.visibilityBefore,
    ).length,
    maxDistanceIncrease: Math.max(...comparisons.map((r) => r.distanceDelta)),
  },
  comparisons,
};
fs.writeFileSync(`${output}/summary.json`, JSON.stringify(result, null, 2));
fs.writeFileSync(`${output}/after-audit.json`, JSON.stringify(after, null, 2));
console.log(
  JSON.stringify(
    {
      before: result.before,
      after: result.after,
      causes: result.primaryCauses,
      budget: result.regressionBudget,
      kinds: result.kinds,
    },
    null,
    2,
  ),
);
