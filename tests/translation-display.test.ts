import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { createCampaign } from '../src/generators/index.ts';
import {
  createNPC,
  rerollNPC,
  npcFieldTables,
} from '../src/generators/content.ts';
import { loadMonsterPreset } from '../src/generators/monster.ts';
import {
  translateGeneratedText,
  polishKoreanTranslation,
} from '../src/generators/translation.ts';
import { editedProvenance } from '../src/domain/generationProvenance.ts';
import { mergeRuleTranslations } from '../src/storage/ruleTranslations.ts';
import { ContentLibrary } from '../src/components/ContentLibrary.tsx';
import { Monsters } from '../src/components/Monsters.tsx';
import { TranslatedValue } from '../src/components/TranslatedValue.tsx';
import { ReferenceReadingText } from '../src/components/ReferenceReadingText.tsx';
import { Translation } from '../src/components/Translation.tsx';
const b = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(b.library);
setOraclePack(b.oracles);
const rules = getRules()!,
  registry = buildOracleRegistry(rules, getOraclePack()),
  index = buildReferenceRegistry(registry, rules);
const render = (type: any, props: any) =>
  renderToStaticMarkup(createElement(type, props));
const noop = () => {};
function npcFixture() {
  const c = createCampaign('Korean display QA'),
    npc = createNPC(c.id, 'sarkash', true, registry);
  npc.name = 'Niduk';
  rerollNPC(npc, 'archetype', registry, () => 0.35);
  rerollNPC(npc, 'appearance', registry, () => 0.755);
  rerollNPC(npc, 'reaction', registry, () => 0.75);
  c.npcs.push(npc);
  c.workspace.selected.npcs = npc.id;
  return { c, npc };
}

test('Photo NPC exposes role, reaction and appearance Korean before any source/edit disclosure', () => {
  const { c } = npcFixture(),
    before = structuredClone(c),
    html = render(ContentLibrary, {
      campaign: c,
      kind: 'npcs',
      confirm: noop,
      notify: noop,
    });
  const reading = html.split('class="content-reading"')[1].split('<details')[0];
  for (const text of [
    'Alchemist/chemist/herbalist',
    'Almost friendly',
    'Knife-sharp cheekbones',
    '연금술사 / 화학자 / 약초상',
    '거의 우호적',
    '칼날처럼 날카로운 광대뼈',
  ])
    assert.ok(reading.includes(text), text);
  assert.deepEqual(c, before);
});
test('NPC compact library exposes the source role helper without opening its object', () => {
  const { c } = npcFixture();
  c.workspace.selected.npcs = null;
  const html = render(ContentLibrary, {
    campaign: c,
    kind: 'npcs',
    confirm: noop,
    notify: noop,
  });
  assert.match(html, /compact-secondary/);
  assert.match(html, /연금술사 \/ 화학자 \/ 약초상/);
});
test('Source-edited NPC field never inherits the old translation, including an exact known phrase', () => {
  const { c, npc } = npcFixture();
  npc.fieldProvenance!.appearance = editedProvenance(
    npc.fieldProvenance!.appearance,
  );
  const html = render(ContentLibrary, {
    campaign: c,
    kind: 'npcs',
    confirm: noop,
    notify: noop,
  });
  assert.match(html, /Knife-sharp cheekbones/);
  assert.doesNotMatch(html, /칼날처럼 날카로운 광대뼈/);
});
test('All non-name NPC tables retain Korean helpers for every possible source row', () => {
  const ids = new Set(Object.values(npcFieldTables).flat());
  for (const t of registry.tables.filter(
    (t) =>
      (ids.has(t.id) || /npc_professions$/.test(t.id)) && t.id !== 'core.names',
  ))
    for (const e of t.entries)
      assert.match(
        polishKoreanTranslation(
          String(e.metadata?.ko ?? translateGeneratedText(e.text)),
        ),
        /[가-힣]/,
        e.id,
      );
});
test('Every NPC field from 100 deterministic samples has a helper except the canonical name', () => {
  const npc = createNPC('qa', 'sarkash', true, registry);
  for (let i = 0; i < 100; i++)
    for (const field of Object.keys(npcFieldTables).filter(
      (k) => k !== 'name',
    )) {
      rerollNPC(npc, field, registry, () => i / 100);
      assert.match(
        translateGeneratedText(String(npc[field as keyof typeof npc])),
        /[가-힣]/,
        field + ':' + i,
      );
    }
});
test('Dictionary identity values no longer mask ordinary RECLVSE words in the table UI', () => {
  const ids = [
    'reclvse.exitType',
    'reclvse.hairGrooming',
    'reclvse.quality',
    'reclvse.action',
    'reclvse.focus',
    'reclvse.descriptor',
    'reclvse.detail',
  ];
  for (const t of registry.tables.filter((t) => ids.includes(t.id)))
    for (const e of t.entries)
      assert.match(
        render(ReferenceReadingText, { text: e.text, source: e }),
        /lang="ko"/,
        e.id,
      );
});
test('Mechanical abbreviation helpers preserve numeric modifiers and dice', () => {
  assert.equal(polishKoreanTranslation('Strength −1.'), '근력 −1.');
  assert.equal(
    translateGeneratedText('HP 6 · Morale 7 · Armor −d2 · Damage 2d6'),
    'HP 6 · 사기 7 · 방어구 −d2 · 피해 2d6',
  );
  assert.equal(translateGeneratedText('DR14 to hit.'), '명중에 DR14 필요.');
});
test('Serialized price and effect lines translate without losing line boundaries', () => {
  const result = translateGeneratedText('Damage d8\n35s');
  assert.equal(result, '피해 d8\n은화 35');
  assert.match(
    translateGeneratedText(
      '15s\nStops bleeding/infection and +d6 HP. Presence + 4 uses',
    ),
    /출혈·감염/,
  );
});
test('Every Core weapon, armor, equipment and class reference effect is bilingual when opened', () => {
  const selected = index.entries.filter((e) =>
    /^definition:core\.(weaponCatalog|equipmentCatalog|armor):|^class:/.test(
      e.id,
    ),
  );
  assert.ok(selected.length >= 60);
  for (const e of selected) {
    const r = executeReference(e, { registry, rules, region: 'sarkash' })!;
    for (const block of r.blocks)
      assert.match(
        render(ReferenceReadingText, {
          text: block.text,
          translation: block.translation?.ko,
        }),
        /lang="ko"/,
        e.id + ' ' + block.title,
      );
  }
});
test('Travel time and its separate world/weather procedure remain understandable in Korean', () => {
  const r = executeReference(index.byId['rule:feretory.travel-distances'], {
    registry,
    rules,
    region: 'sarkash',
  })!;
  for (const block of r.blocks)
    assert.match(
      render(ReferenceReadingText, { text: block.text }),
      /lang="ko"/,
    );
  assert.equal(translateGeneratedText('d8+6 days'), 'd8+6일');
});
test('All fixed creature attack/special fragments render Korean except pure dice notation', () => {
  for (const record of rules.creatures) {
    const m = loadMonsterPreset('qa', record);
    for (const text of [
      ...m.attacks.map((a) => [a.name, a.damage].join(' · ')),
      ...m.special.map((s) => s.text),
    ]) {
      if (!text || /^[\d\s+d−–-]+$/.test(text)) continue;
      assert.match(
        translateGeneratedText(text),
        /[가-힣]/,
        m.name + ': ' + text,
      );
    }
  }
});
test('Compact Monster read mode retains Korean attack and special before editing', () => {
  const c = createCampaign('qa'),
    record = rules.creatures.find(
      (r) => r.id === 'core-full.rotblack.dusk-gnoum',
    )!;
  const m = loadMonsterPreset(c.id, record);
  c.monsters.push(m);
  c.workspace.selected.monsters = m.id;
  const html = render(Monsters, { campaign: c, confirm: noop, notify: noop }),
    beforeEditor = html.split('<details class="object-editor"')[0];
  assert.match(beforeEditor, /명중에 DR14 필요/);
  assert.match(beforeEditor, /단검|칼/);
});
test('Translation fragments never rewrite original values or translate manual prose by word substitution', () => {
  const value = 'a new private legend with Knife and Blood';
  assert.equal(translateGeneratedText(value), '');
  assert.equal(
    render(TranslatedValue, {
      text: 'Knife-sharp cheekbones',
      provenance: editedProvenance(),
      linked: false,
    }),
    'Knife-sharp cheekbones',
  );
  assert.match(render(Translation, { text: 'Sarkash' }), /^$/);
});
test('Per-source explicit translation takes precedence over global vocabulary collisions', () => {
  const html = render(ReferenceReadingText, {
    text: 'Crest',
    source: { text: 'Crest', metadata: { ko: '문장 장식' } },
  });
  assert.match(html, /문장 장식/);
  assert.doesNotMatch(html, /꼭대기/);
});
test('Safe language update repairs empty/identity helpers but retains user Korean and source text', () => {
  const current = structuredClone(rules),
    incoming = structuredClone(rules),
    id = 'reclvse.exitType';
  const row = current.tables[id].entries.find((e) => e.text === 'Breach')!;
  row.meta.ko = row.text;
  current.notes.translations = { Breach: 'Breach', Custom: '사용자 번역' };
  incoming.notes.translations = { Breach: '뚫린 틈', Custom: '다른 번역' };
  incoming.notes.translationUpdatePolicy = 'fill-missing';
  const fixed = mergeRuleTranslations(current, incoming);
  assert.equal(
    fixed.tables[id].entries.find((e) => e.text === 'Breach')!.meta.ko,
    '뚫린 틈',
  );
  assert.equal((fixed.notes.translations as any).Custom, '사용자 번역');
  assert.equal((fixed.notes.translations as any).Breach, '뚫린 틈');
  assert.deepEqual(
    fixed.tables[id].entries.map((e) => e.text),
    current.tables[id].entries.map((e) => e.text),
  );
  row.meta.ko = '사용자 틈 번역';
  assert.equal(
    mergeRuleTranslations(current, incoming).tables[id].entries.find(
      (e) => e.text === 'Breach',
    )!.meta.ko,
    '사용자 틈 번역',
  );
});
test('An empty metadata helper cannot suppress a complete stat translation', () => {
  assert.match(
    render(Translation, {
      text: 'HP: 2 · Morale: 6 · Attack: d4 · Armor: —',
      translation: '',
    }),
    /사기: 6 · 공격: d4 · 방어구: —/,
  );
});
test('Both manually edited NPC identity fields stay manual even if they match dictionary phrases', () => {
  const { c, npc } = npcFixture();
  npc.fieldProvenance!.archetype = editedProvenance(
    npc.fieldProvenance!.archetype,
  );
  npc.fieldProvenance!.reaction = editedProvenance(
    npc.fieldProvenance!.reaction,
  );
  const html = render(ContentLibrary, {
    campaign: c,
    kind: 'npcs',
    confirm: noop,
    notify: noop,
  });
  assert.doesNotMatch(html, /연금술사|거의 우호적/);
});
