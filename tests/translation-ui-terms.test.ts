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
