import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createCampaign, createDungeon } from '../src/generators/index.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { Characters } from '../src/components/Characters.tsx';
import { DungeonSheet } from '../src/components/DungeonSheet.tsx';
import { ObjectPlayTools } from '../src/components/ObjectPlayTools.tsx';
import { SourceDisclosure } from '../src/components/SourceDisclosure.tsx';
import { Monsters } from '../src/components/Monsters.tsx';
import { generateMonster } from '../src/generators/monster.ts';

const noop = () => {};

test('Monster draft keeps direct regeneration while a saved statblock puts it in edit details', () => {
  const campaign = createCampaign('Manual QA');
  const monster = generateMonster(campaign.id, true);
  campaign.drafts.monsters = monster;
  campaign.workspace.selected.monsters = monster.id;
  const snapshot = structuredClone(campaign);
  const render = () =>
    renderToStaticMarkup(
      createElement(Monsters, { campaign, confirm: noop, notify: noop }),
    );
  const draft = render();
  assert.equal(draft.split('몬스터 전체 재굴림').length, 2);
  assert.ok(
    draft.indexOf('몬스터 전체 재굴림') <
      draft.indexOf('<details class="object-editor"'),
  );
  assert.deepEqual(campaign, snapshot);
  campaign.drafts.monsters = null;
  campaign.monsters.push(monster);
  campaign.workspace.selected.monsters = monster.id;
  const saved = render();
  assert.equal(saved.split('몬스터 전체 재굴림').length, 2);
  assert.ok(
    saved.indexOf('몬스터 전체 재굴림') >
      saved.indexOf('<details class="object-editor"'),
  );
});

test('Compact source label retains specific accessible context and exact source inside one closed disclosure', () => {
  const html = renderToStaticMarkup(
    createElement(SourceDisclosure, {
      label: 'Room 02 generation',
      refs: [
        {
          bookTitle: 'Source fixture',
          tableTitle: 'Room fixture',
          pdfPage: 8,
          printedPage: 6,
          roll: 3,
        },
      ],
    }),
  );
  assert.match(
    html,
    /<summary aria-label="출처 · Room 02 generation"><span aria-hidden="true">ⓘ<\/span> 출처<\/summary>/,
  );
  assert.equal((html.match(/source-disclosure"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
  assert.match(html, /Source fixture/);
  assert.match(html, /Room fixture/);
  assert.match(html, /PDF 8쪽 \/ p. 6/);
  assert.match(html, /굴림 3/);
});

test('Saved Character hides creation settings while a draft retains them; reading does not mutate either', () => {
  const campaign = createCampaign('Manual QA');
  const character = generateCharacter(campaign.id, true);
  campaign.characters.push(character);
  campaign.workspace.selected.characters = character.id;
  const snapshot = structuredClone(campaign);
  const saved = renderToStaticMarkup(
    createElement(Characters, { campaign, confirm: noop, notify: noop }),
  );
  assert.match(saved, /class="character-generation-bar" hidden=""/);
  assert.match(saved, /aria-pressed="false">편집/);
  assert.match(saved, /aria-label="현재 HP 1 감소"/);
  assert.deepEqual(campaign, snapshot);
  campaign.characters = [];
  campaign.drafts.characters = character;
  const draft = renderToStaticMarkup(
    createElement(Characters, { campaign, confirm: noop, notify: noop }),
  );
  assert.match(draft, /class="character-sheet /);
  assert.match(draft, /class="character-generation-bar">/);
  assert.doesNotMatch(draft, /class="character-generation-bar" hidden/);
});

test('Object context retains state and placement controls under one closed management disclosure', () => {
  const campaign = createCampaign('Manual QA');
  const dungeon = createDungeon(campaign.id, 'Manual dungeon', 'sarkash', true);
  campaign.dungeons.push(dungeon);
  Object.assign(campaign.workspace, {
    section: 'dungeons',
    dungeonId: dungeon.id,
    dungeonTab: 'overview',
    dungeonPreview: false,
  });
  const snapshot = structuredClone(campaign);
  const html = renderToStaticMarkup(
    createElement(ObjectPlayTools, { campaign }),
  );
  assert.match(
    html,
    /<details class="context-management"><summary>상태 · 배치<\/summary>/,
  );
  assert.match(html, /aria-label="던전 탐사 상태"/);
  assert.doesNotMatch(html, /<details class="context-management"[^>]*\sopen/);
  assert.deepEqual(campaign, snapshot);
});

test('Dungeon management shares the dossier header without changing its fields or room identities', () => {
  const campaign = createCampaign('Manual QA');
  const dungeon = createDungeon(campaign.id, 'Manual dungeon', 'sarkash', true);
  dungeon.premise = 'Manual premise fixture';
  const snapshot = structuredClone(dungeon);
  const html = renderToStaticMarkup(
    createElement(DungeonSheet, {
      dungeon,
      ready: false,
      patch: noop,
      patchRoom: noop,
      updateRoom: noop,
      rollRoom: noop,
      actions: createElement(
        'details',
        { className: 'dossier-management' },
        createElement('summary', null, '⋯'),
        createElement('button', null, 'Full reroll fixture'),
      ),
    }),
  );
  assert.match(
    html,
    /class="sheet-caption"[\s\S]*class="dossier-actions"[\s\S]*Full reroll fixture[\s\S]*class="dossier-premise"/,
  );
  assert.match(html, /Manual premise fixture/);
  assert.doesNotMatch(html, /<details class="dossier-management"[^>]*\sopen/);
  assert.deepEqual(dungeon, snapshot);
});
