import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getRules, setRules } from '../src/storage/rulesStore.ts';
import { getOraclePack, setOraclePack } from '../src/storage/oracleStore.ts';
import {
  exactUiTranslation,
  polishKoreanTranslation,
  translateGeneratedText,
} from '../src/generators/translation.ts';
import { scvmReferenceReading } from '../src/generators/scvmCharacter.ts';
import { scvmPack } from './fixtures/officialSynthetic.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { referenceDisplayTitle } from '../src/domain/referenceDisplayTitles.ts';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Translation } from '../src/components/Translation.tsx';
import { objectFromReading } from '../src/domain/savedObjects.ts';
import type { ReferenceReading } from '../src/domain/referenceReading.ts';

test('mechanical terms select Korean particles after translating English ability names', () => {
  assert.equal(translateGeneratedText('Power uses/day'), '하루 권능 사용 횟수');
  assert.equal(
    polishKoreanTranslation(
      'Strength는 3d6+2. Agility와 Presence는 3d6−1. Toughness를 d3 낮춘다.',
    ),
    '근력은 3d6+2. 민첩과 지각은 3d6−1. 체력을 d3 낮춘다.',
  );
  assert.equal(
    polishKoreanTranslation(
      'Omens가 없고 Omens로 판정에 개입할 수 없다. Powers를 DR6에 시전한다.',
    ),
    '오멘이 없고 오멘으로 판정에 개입할 수 없다. 권능을 DR6에 시전한다.',
  );
  assert.equal(
    polishKoreanTranslation(
      'Morale이 7이고 Armor은 −d2이며 Damage을 d4 줄인다.',
    ),
    '사기가 7이고 방어구는 −d2이며 피해를 d4 줄인다.',
  );
  assert.equal(
    polishKoreanTranslation(
      'Strength는 +1, Power를 사용하고 Omen가 1 감소한다.',
    ),
    '근력은 +1, 권능을 사용하고 오멘이 1 감소한다.',
  );
  const alreadyKorean =
    '근력은 +1. 민첩과 지각은 −1. 체력을 d3 낮추고 오멘으로 판정한다.';
  assert.equal(polishKoreanTranslation(alreadyKorean), alreadyKorean);
  assert.equal(
    polishKoreanTranslation('사용자가 쓴 낱말과 체력적인 묘사'),
    '사용자가 쓴 낱말과 체력적인 묘사',
  );
});

test('rendered explicit helpers receive their own English context without changing source', () => {
  const html = renderToStaticMarkup(
    createElement(Translation, {
      text: 'power (unclean scroll) · d6',
      translation: 'Power(불순한 스탬프) · d6',
    }),
  );
  assert.match(html, /권능\(부정한 두루마리\) · d6/);
  assert.doesNotMatch(html, /스탬프/);
  const unrelated = renderToStaticMarkup(
    createElement(Translation, {
      text: 'stamp, roll, screwdriver',
      translation: '스탬프, 신성한 롤, 핸드드라이버',
    }),
  );
  assert.match(unrelated, /스탬프, 신성한 롤, 핸드드라이버/);
});

test('ability helper aliases require matching source ability names and preserve ordinary health or presence', () => {
  assert.equal(
    polishKoreanTranslation(
      '강인함 또는 민첩성 DR8에 실패하면 d2 피해.',
      'Toughness/Agility DR8 or d2 damage.',
    ),
    '체력 또는 민첩 DR8에 실패하면 d2 피해.',
  );
  assert.equal(
    polishKoreanTranslation(
      '강인함 / 존재감 DR8, d2 라운드',
      'Toughness/Presence DR8, d2 rounds',
    ),
    '체력 / 지각 DR8, d2 라운드',
  );
  assert.equal(
    polishKoreanTranslation(
      '건강은 3d6−2. HP는 건강 + d8.',
      'Roll 3d6−2 for Toughness. HP Toughness + d8.',
    ),
    '체력은 3d6−2. HP는 체력 + d8.',
  );
  for (const [source, helper] of [
    ['Mind-numbing presence', '정신을 마비시키는 존재감'],
    ['Health', '건강'],
    ['Healthy', '건강한'],
    ['Healthily', '건강하게'],
    ['Hypochondriac', '건강염려증이 있는'],
    ['Strength test', '강인함과 존재감, 민첩성을 묘사한다.'],
    [
      'Toughness test followed by a description of health.',
      '강인함 판정 후 건강을 묘사한다.',
    ],
  ]) {
    const expected = source.startsWith('Toughness')
      ? '체력 판정 후 건강을 묘사한다.'
      : helper;
    assert.equal(polishKoreanTranslation(helper, source), expected, source);
  }
});

test('the 35 actual legacy Toughness/health helpers are classified without editing the private dictionary', () => {
  const fixture = JSON.parse(readFileSync('public/rules/library.json', 'utf8'));
  const dictionary = fixture.notes.translations as Record<string, string>;
  const before = structuredClone(dictionary);
  const reviewed = Object.entries(dictionary).filter(([, helper]) =>
    /강인함|건강/.test(helper),
  );
  const abilities = reviewed.filter(([source]) => /\bToughness\b/.test(source));
  const descriptions = reviewed.filter(
    ([source]) => !/\bToughness\b/.test(source),
  );
  assert.equal(reviewed.length, 35);
  assert.equal(abilities.length, 31);
  assert.deepEqual(
    descriptions.map(([source]) => source),
    ['Health', 'Healthily', 'Healthy', 'Hypochondriac'],
  );
  for (const [source, helper] of abilities) {
    const result = polishKoreanTranslation(helper, source);
    assert.doesNotMatch(result, /강인함|건강/, source);
    assert.match(result, /체력/, source);
    assert.deepEqual(result.match(/\d+/g), helper.match(/\d+/g), source);
  }
  for (const [source, helper] of descriptions)
    assert.equal(polishKoreanTranslation(helper, source), helper, source);
  assert.deepEqual(dictionary, before);
});

test('saved bilingual snapshots keep the same source-aware ability helper as the reader', () => {
  const reading: ReferenceReading = {
    title: 'Fixture character',
    blocks: [
      {
        title: 'Abilities',
        text: 'Toughness +1 / Presence −1 / Agility +2',
        translation: { ko: '강인함 +1 / 존재감 −1 / 민첩성 +2' },
      },
    ],
    sourceRefs: [],
  };
  const before = structuredClone(reading);
  const saved = objectFromReading(
    'procedure:character.core-classless',
    reading,
  );
  assert.match(saved.text, /체력 \+1 \/ 지각 −1 \/ 민첩 \+2/);
  assert.doesNotMatch(saved.text, /강인함|존재감|민첩성/);
  assert.match(saved.sourceText, /Toughness \+1 \/ Presence −1 \/ Agility \+2/);
  assert.doesNotMatch(saved.sourceText, /체력|지각|민첩/);
  assert.deepEqual(reading, before);
});

test('the actual Fetid Gas helper names Omens as an ability without changing ordinary portents', () => {
  const pack = JSON.parse(readFileSync('public/rules/oracles.json', 'utf8'));
  const source = pack.tables
    .find((table: { id: string }) => table.id === 'depths.traps.regular')
    .entries.find(
      (entry: { id: string }) => entry.id === 'depths.traps.regular:5',
    );
  const before = structuredClone(source);
  const helper = polishKoreanTranslation(source.metadata.ko, source.text);
  assert.match(helper, /^악취 가스 — TR 오멘 행동\./);
  assert.doesNotMatch(helper, /전조|존재감/);
  assert.match(helper, /지각 TR\+3/);
  assert.match(helper, /지각 TR 판정/);
  assert.deepEqual(helper.match(/\d+/g), source.metadata.ko.match(/\d+/g));
  assert.equal(
    polishKoreanTranslation('불길한 전조 행동', 'An ominous portent'),
    '불길한 전조 행동',
  );
  assert.equal(
    polishKoreanTranslation('TR 전조 행동', 'TR Presence Move'),
    'TR 전조 행동',
  );
  assert.deepEqual(source, before);
});

test('Weather Wind keeps its UI meaning despite an unrelated table translation', () => {
  const fixture = JSON.parse(
    readFileSync('outputs/morkborg-private-data.json', 'utf8'),
  );
  const rules = getRules() ?? fixture.library;
  const oracles = getOraclePack() ?? fixture.oracles;
  try {
    setRules({
      ...rules,
      notes: {
        ...rules.notes,
        translations: { ...rules.notes.translations, Wind: '바람 소리' },
      },
    });
    setOraclePack(oracles);
    assert.equal(translateGeneratedText('Wind'), '바람');
    assert.equal(exactUiTranslation('Wind'), '바람');
    assert.equal(translateGeneratedText('Windy unlisted sentence'), '');
    const registry = buildOracleRegistry(getRules()!, getOraclePack());
    const references = buildReferenceRegistry(registry, getRules());
    const wind = references.byId['oracle:reclvse.wind'];
    const suppliedTitle = wind.titleTranslationKo;
    assert.equal(suppliedTitle, '바람 소리');
    assert.equal(referenceDisplayTitle(wind).text, '바람');
    assert.equal(wind.titleTranslationKo, suppliedTitle);
  } finally {
    setRules(rules);
    setOraclePack(oracles);
  }
});

test('companion terminology corrections require the matching English meaning and keep dice', () => {
  assert.equal(
    polishKoreanTranslation(
      '권능(불순한 스탬프) · d6',
      'power (unclean scroll) · d6',
    ),
    '권능(부정한 두루마리) · d6',
  );
  assert.equal(
    polishKoreanTranslation('권능(신성한 롤)', 'power (sacred scroll)'),
    '권능(신성한 두루마리)',
  );
  assert.equal(
    polishKoreanTranslation('d2 스탬프', 'd2 scrolls'),
    'd2 두루마리',
  );
  assert.equal(
    polishKoreanTranslation('DR14로 스팟, d8 피해', 'DR14 to spot, d8'),
    '발견에 DR14, d8 피해',
  );
  assert.equal(polishKoreanTranslation('핸드드라이버', 'tongs'), '집게');
  assert.equal(
    polishKoreanTranslation(
      '스탬프, 신성한 롤, 핸드드라이버',
      'stamp, roll, screwdriver',
    ),
    '스탬프, 신성한 롤, 핸드드라이버',
  );
  assert.equal(
    polishKoreanTranslation('사용자 두루마리 설명', 'scroll'),
    '사용자 두루마리 설명',
  );
});

test('SCVM reader normalizes companion gear while preserving English and the pack', () => {
  const pack = scvmPack();
  pack.messages['tables.weapons.small'] = 'Qxv-731 tongs d6';
  pack.translations = { 'tables.weapons.small': 'Qxv-731 핸드드라이버 d6' };
  const before = structuredClone(pack);
  const reading = scvmReferenceReading(pack);
  const weapon = reading.blocks.find((block) => block.title === 'Weapon');
  assert.equal(weapon?.text, 'Qxv-731 tongs d6');
  assert.equal(weapon?.translation?.ko, 'Qxv-731 집게 d6');
  assert.deepEqual(pack, before);
});
