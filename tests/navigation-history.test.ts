import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NavigationHistory,
  type NavigationEntry,
  type ChannelState,
} from '../src/navigation/history.ts';
import {
  captureAppLocation,
  normalizeAppLocation,
  applyAppLocation,
  homePage,
} from '../src/navigation/appLocation.ts';
import {
  emptyReferenceLocation,
  referenceLocationKey,
} from '../src/navigation/referenceLocation.ts';
import { createCampaign, createDungeon } from '../src/generators/index.ts';
import { emptySave } from '../src/storage/migrations.ts';
const state = (value: unknown, key = JSON.stringify(value)): ChannelState => ({
  value,
  key,
});
function harness(saved?: NavigationEntry) {
  const entries: NavigationEntry[] = saved ? [structuredClone(saved)] : [];
  let cursor = 0;
  let pop: (value: unknown) => void = () => {};
  let restoredScroll = 0;
  const port = {
    read: () => entries[cursor],
    replace: (e: NavigationEntry) => {
      entries[cursor] = structuredClone(e);
    },
    push: (e: NavigationEntry) => {
      entries.splice(++cursor);
      entries[cursor] = structuredClone(e);
    },
    go: (delta: number) => {
      cursor += delta;
      pop(structuredClone(entries[cursor]));
    },
    onPop: (fn: typeof pop) => {
      pop = fn;
      return () => {};
    },
    restoreScroll: (y: number) => {
      restoredScroll = y;
    },
  };
  const driver = new NavigationHistory(port);
  const rendered: Record<string, unknown> = {};
  const register = (
    name: string,
    value: unknown,
    open?: (value: unknown) => boolean,
    identity = (v: unknown) => JSON.stringify(v),
  ) =>
    driver.register(name, {
      initial: state(value, identity(value)),
      restore: (value) => {
        rendered[name] = value;
        return state(value, identity(value));
      },
      open,
    });
  return {
    driver,
    port,
    entries,
    register,
    rendered,
    current: () => entries[cursor],
    scroll: () => restoredScroll,
  };
}
test('Initial registration and repeated renders do not add a Back entry', () => {
  const h = harness();
  h.register('app', 'home');
  h.register('reference', null);
  h.driver.observe('app', state('home'));
  h.driver.flush();
  assert.equal(h.entries.length, 1);
  assert.equal(h.driver.canBack(), false);
  assert.equal(h.driver.back(), false);
});
test('One UI navigation batches page and inspector updates into one browser entry', () => {
  const h = harness();
  h.register('app', 'home');
  h.register('reference', 'search');
  h.driver.observe('app', state('city'));
  h.driver.observe('reference', state(null));
  h.driver.flush();
  assert.equal(h.entries.length, 2);
  assert.equal(h.current().index, 1);
  h.driver.back();
  assert.equal(h.rendered.app, 'home');
  assert.equal(h.rendered.reference, 'search');
});
test('Search typing replaces the current query without creating a keystroke history', () => {
  const h = harness();
  h.register('query', '', undefined, () => 'query');
  for (const text of ['R', 'Re', 'Reaction']) {
    h.driver.observe('query', state(text, 'query'));
    h.driver.flush();
  }
  assert.equal(h.entries.length, 1);
  assert.equal(h.current().channels.query.value, 'Reaction');
});
test('Back and Forward restore selectors without adding entries or executing content', () => {
  const h = harness();
  h.register('app', 'home');
  for (const page of ['list', 'detail']) {
    h.driver.observe('app', state(page));
    h.driver.flush();
  }
  h.driver.back();
  assert.equal(h.rendered.app, 'list');
  h.driver.observe('app', state('list'));
  h.driver.flush();
  assert.equal(h.entries.length, 3);
  h.port.go(1);
  assert.equal(h.rendered.app, 'detail');
  assert.equal(h.current().index, 2);
});
test('New navigation after Back replaces only the forward branch', () => {
  const h = harness();
  h.register('app', 'home');
  for (const page of ['list', 'detail']) {
    h.driver.observe('app', state(page));
    h.driver.flush();
  }
  h.driver.back();
  h.driver.observe('app', state('other'));
  h.driver.flush();
  assert.equal(h.entries.length, 3);
  assert.equal(h.current().channels.app.value, 'other');
  assert.equal(h.entries[1].channels.app.value, 'list');
});
test('Closing a related-table chain returns to the underlying view; Back does not reopen the modal', () => {
  const h = harness();
  h.register('app', 'home');
  h.register('reference', null, (v) => v !== null);
  h.driver.observe('app', state('dungeon'));
  h.driver.flush();
  for (const value of ['room-source', 'table', 'related-table']) {
    h.driver.observe('reference', state(value));
    h.driver.flush();
  }
  h.driver.observe('reference', state(null));
  h.driver.flush();
  assert.equal(h.current().index, 1);
  assert.equal(h.rendered.reference, null);
  assert.equal(h.rendered.app, 'dungeon');
  h.driver.back();
  assert.equal(h.rendered.app, 'home');
});
test('Opening a destination from an inspector does not mistake the new page for a dismiss', () => {
  const h = harness();
  h.register('app', 'home');
  h.register('reference', null, (v) => v !== null);
  h.driver.observe('reference', state('city'));
  h.driver.flush();
  h.driver.observe('app', state('city'));
  h.driver.observe('reference', state(null));
  h.driver.flush();
  assert.equal(h.current().index, 2);
  assert.equal(h.current().channels.app.value, 'city');
  h.driver.back();
  assert.equal(h.rendered.reference, 'city');
});
test('Reloaded history retains depth and current view, while restoration keeps scroll', () => {
  const h = harness();
  h.register('app', 'home');
  h.driver.scroll(420);
  h.driver.observe('app', state('detail'));
  h.driver.flush();
  const restored = harness(h.current());
  restored.register('app', 'home');
  assert.equal(restored.driver.canBack(), true);
  assert.equal(restored.rendered.app, 'detail');
  h.driver.back();
  assert.equal(h.scroll(), 420);
});
function campaignFixture() {
  const save = emptySave();
  const c = createCampaign('Navigation QA');
  c.dungeons.push(createDungeon(c.id, 'QA dungeon', 'sarkash', true));
  save.campaigns.push(c);
  save.activeCampaignId = c.id;
  save.view = 'campaign';
  c.workspace.section = 'dungeons';
  c.workspace.dungeonId = c.dungeons[0].id;
  return { save, c };
}
test('Restoring a page never rolls back edited campaign objects or timestamps', () => {
  const { save, c } = campaignFixture();
  const location = captureAppLocation(save, { ...homePage, oracleOpen: false });
  c.dungeons[0].notes = 'Newest manual note';
  c.dungeons[0].updatedAt = '2026-09-09T12:00:00Z';
  const current = structuredClone(c);
  c.workspace.dungeonId = null;
  applyAppLocation(save, location);
  const { workspace: currentWorkspace, ...currentContent } = current;
  const { workspace: restoredWorkspace, ...restoredContent } = c;
  assert.deepEqual(restoredContent, currentContent);
  assert.equal(restoredWorkspace.dungeonId, currentWorkspace.dungeonId);
  assert.equal(restoredWorkspace.stockingKind, currentWorkspace.stockingKind);
  assert.ok(!JSON.stringify(location).includes('Newest manual note'));
  assert.deepEqual(
    Object.keys(location.workspace ?? {}).sort(),
    [
      'section',
      'dungeonId',
      'roomId',
      'dungeonTab',
      'dungeonPreview',
      'sessionId',
      'chronicleId',
      'selected',
    ].sort(),
  );
});
test('Deleted objects and campaigns are not resurrected by stale history', () => {
  const { save, c } = campaignFixture();
  const location = captureAppLocation(save, { ...homePage, oracleOpen: false });
  c.dungeons = [];
  const normalized = normalizeAppLocation(location, save);
  assert.equal(normalized.workspace?.dungeonId, null);
  applyAppLocation(save, location);
  assert.equal(c.dungeons.length, 0);
  save.campaigns = [];
  const missing = applyAppLocation(save, location);
  assert.equal(missing.view, 'campaigns');
  assert.equal(save.activeCampaignId, null);
  assert.equal(save.campaigns.length, 0);
});
test('Invalid or obsolete navigation falls back to Home without importing arbitrary save content', () => {
  const { save } = campaignFixture();
  const before = structuredClone(save);
  const result = normalizeAppLocation(
    { oracleOpen: false, campaigns: [{ title: 'injected' }] },
    save,
  );
  assert.equal(result.deskPage, 'home');
  assert.equal(result.oracleOpen, true);
  assert.deepEqual(save, before);
});
test('Reference query and region changes are not navigation, but opening TABLE is', () => {
  const r = emptyReferenceLocation();
  assert.deepEqual(
    referenceLocationKey(r),
    referenceLocationKey({ ...r, query: 'Reaction', region: 'grift' }),
  );
  assert.notDeepEqual(
    referenceLocationKey(r),
    referenceLocationKey({ ...r, tableView: true }),
  );
});
