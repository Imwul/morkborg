import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import { generateMonster } from '../src/generators/monster.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { createNPC, createEncounter } from '../src/generators/content.ts';
import { addMonsterPlacement } from '../src/domain/monsterOperations.ts';
import { addContentPlacement } from '../src/domain/contentOperations.ts';
import { Monsters } from '../src/components/Monsters.tsx';
import { Characters } from '../src/components/Characters.tsx';
import { ContentLibrary } from '../src/components/ContentLibrary.tsx';
import type { Campaign } from '../src/domain/types.ts';
import type { Confirm } from '../src/components/Library.tsx';

function fixture() {
  const campaign = createCampaign('Manual fixture');
  const dungeon = createDungeon(
    campaign.id,
    'Placement title fixture',
    'sarkash',
    true,
  );
  dungeon.rooms = [createRoom('sarkash', true)];
  campaign.dungeons.push(dungeon);
  return {
    campaign,
    target: { dungeonId: dungeon.id, roomId: dungeon.rooms[0].id },
  };
}
const noop = () => {};
function card(html: string) {
  const result = html.match(
    /<article class="compact-card">[\s\S]*?<\/article>/,
  )?.[0];
  assert.ok(result);
  assert.doesNotMatch(
    result,
    /<time|source-disclosure|textarea|Placement title fixture|Hidden notes fixture|Long description fixture|긴 한국어 도움말/,
  );
  assert.match(result, /<details class="compact-overflow">/);
  assert.doesNotMatch(result, /<details[^>]*\sopen/);
  assert.equal((result.match(/<button/g) ?? []).length, 3);
  return result;
}
type LibraryProps = {
  campaign: Campaign;
  confirm: Confirm;
  notify: (text: string) => void;
};
function renderLibrary(
  component: ComponentType<LibraryProps>,
  campaign: Campaign,
) {
  return card(
    renderToStaticMarkup(
      createElement(component, { campaign, confirm: noop, notify: noop }),
    ),
  );
}

test('Monster library default card prioritizes actual stats and attack over placement or full content', () => {
  const { campaign, target } = fixture();
  const monster = generateMonster(campaign.id, true);
  Object.assign(monster, {
    name: 'Manual monster fixture',
    hp: 0,
    morale: 0,
    armor: '-d2',
    notes: 'Hidden notes fixture',
    description: 'Long description fixture',
  });
  monster.attacks = [
    {
      id: 'fixture-attack',
      name: 'Manual attack',
      damage: 'd4',
      description: '긴 한국어 도움말',
    },
  ];
  campaign.monsters.push(monster);
  addMonsterPlacement(campaign, monster.id, target, 2, 'Hidden notes fixture');
  const snapshot = structuredClone(campaign),
    html = renderLibrary(Monsters, campaign);
  assert.match(html, /HP 0 · Morale 0 · Armor -d2/);
  assert.match(html, /Manual attack d4/);
  assert.deepEqual(campaign, snapshot);
});

test('NPC and Encounter library cards expose one role/category line and preserve closed secondary actions', () => {
  const { campaign, target } = fixture();
  const npc = createNPC(campaign.id, 'sarkash', true);
  Object.assign(npc, {
    name: 'Manual NPC fixture',
    archetype: 'Role fixture',
    behaviour: 'Long behavior fixture',
    hp: 4,
    morale: 0,
    notes: 'Hidden notes fixture',
    description: 'Long description fixture',
  });
  const encounter = createEncounter(campaign.id, 'sarkash', 'common', 10, true);
  Object.assign(encounter, {
    name: 'Manual encounter fixture',
    notes: 'Hidden notes fixture',
    description: 'Long description fixture',
  });
  campaign.npcs.push(npc);
  campaign.encounters.push(encounter);
  addContentPlacement(campaign, 'npcs', npc.id, target);
  addContentPlacement(campaign, 'encounters', encounter.id, target);
  const snapshot = structuredClone(campaign);
  for (const kind of ['npcs', 'encounters'] as const) {
    const html = card(
      renderToStaticMarkup(
        createElement(ContentLibrary, {
          campaign,
          kind,
          confirm: noop,
          notify: noop,
        }),
      ),
    );
    if (kind === 'npcs') {
      assert.match(html, /Role fixture/);
      assert.match(html, /HP 4 · Morale 0/);
      assert.doesNotMatch(html, /Long behavior fixture/);
    } else assert.doesNotMatch(html, /class="compact-metadata"/);
  }
  assert.deepEqual(campaign, snapshot);
});

test('Character library keeps identity, class, HP and Omens without adding editable or historical content', () => {
  const { campaign } = fixture();
  const character = generateCharacter(campaign.id, true);
  Object.assign(character, {
    name: 'Manual character fixture',
    className: 'Manual class fixture',
    hp: 2,
    maxHp: 5,
    omens: 0,
    notes: 'Hidden notes fixture',
    description: 'Long description fixture',
  });
  campaign.characters.push(character);
  const snapshot = structuredClone(campaign),
    html = renderLibrary(Characters, campaign);
  assert.match(html, /Manual class fixture/);
  assert.match(html, /HP 2 \/ 5 · Omens 0/);
  assert.deepEqual(campaign, snapshot);
});
