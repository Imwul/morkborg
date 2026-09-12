import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Field } from '../src/components/Field.tsx';
import { RoomPacket } from '../src/components/RoomPacket.tsx';
import { HomeIndex } from '../src/components/HomeIndex.tsx';
import { ReferenceDesk } from '../src/components/ReferenceWorkbench.tsx';
import { createDungeon, createRoom } from '../src/generators/index.ts';
import {
  editedProvenance,
  type GeneratedValueProvenance,
} from '../src/domain/generationProvenance.ts';

const noop = () => {};
const provenance: GeneratedValueProvenance = {
  classification: 'SOURCE_VERBATIM',
  origin: 'source',
  status: 'VERIFIED',
  sourceRefs: [{ bookTitle: 'QA source', tableId: 'qa.room', pdfPage: 1 }],
};
const field = {
  spec: { key: 'entrance', label: '입구' },
  value: 'QA entrance',
  translation: '검증용 입구',
  provenance,
  onChange: noop,
  showTools: false,
};

test('Reading a generated field immediately pairs English with Korean, without opening edit or source', () => {
  const html = renderToStaticMarkup(createElement(Field, field));
  assert.match(
    html,
    /<button[^>]*class="field-value[^>]*>QA entrance<span[^>]*lang="ko">검증용 입구<\/span><\/button>/,
  );
  assert.doesNotMatch(html, /<textarea|<input|<details|편집 완료|재굴림/);
  assert.equal((html.match(/lang="ko"/g) ?? []).length, 1);
});

test('Reference-linked fields keep their one-click action and their adjacent Korean helper', () => {
  const html = renderToStaticMarkup(
    createElement(Field, { ...field, onOpenReference: noop }),
  );
  assert.match(html, /aria-label="입구 reference"/);
  assert.match(html, /QA entrance/);
  assert.match(html, /lang="ko">검증용 입구/);
  assert.doesNotMatch(html, /<details|<textarea|EDIT/);
});

test('Edited and fully manual fields never show a stale source translation', () => {
  for (const origin of [editedProvenance(provenance), editedProvenance()]) {
    const html = renderToStaticMarkup(
      createElement(Field, {
        ...field,
        value: 'My changed entrance',
        provenance: origin,
      }),
    );
    assert.match(html, /My changed entrance/);
    assert.doesNotMatch(html, /검증용 입구|lang="ko"/);
  }
});

test('Room components pair existing translations in preview and reading; manual components are not mistranslated', () => {
  const dungeon = createDungeon('qa', 'QA dungeon', 'sarkash', true);
  const room = createRoom('sarkash', true);
  room.components = [
    {
      key: 'sample',
      label: 'Room',
      sourceText: 'QA room',
      translationKo: '검증용 방',
      provenance,
    },
    {
      key: 'detail',
      label: 'Detail',
      sourceText: 'My detail',
      translationKo: '이전 번역',
      provenance: editedProvenance(provenance),
    },
  ];
  const before = structuredClone(room);
  const html = renderToStaticMarkup(
    createElement(RoomPacket, {
      dungeon,
      room,
      index: 0,
      ready: true,
      update: noop,
      expanded: true,
    }),
  );
  assert.match(
    html,
    /room-component-source">QA room<\/span><span[^>]*lang="ko">검증용 방/,
  );
  assert.match(html, /<p><span>QA room<\/span><span[^>]*lang="ko">검증용 방/);
  assert.doesNotMatch(html, /한국어 도움말|packet-translation|이전 번역/);
  assert.match(html, /aria-label="Room 재굴림"/);
  assert.deepEqual(room, before);
});

const home = () =>
  createElement(HomeIndex, {
    onDesk: noop,
    onLibrary: noop,
    onSources: noop,
    onCity: noop,
    onFate: noop,
    onCampaigns: noop,
    onNavigate: noop,
    onImport: noop,
    onAbout: noop,
  });

test('Optional records and source management are a closed menu, without a launcher grid', () => {
  const html = renderToStaticMarkup(home());
  for (const label of [
    '자료 · 기록',
    '출처 · 자료 관리',
    'Mythic Fate',
    '던전 보관함',
    '캐릭터 보관함',
    '캠페인 노트',
    '캠페인 가져오기',
    '소개 · 출처',
  ])
    assert.ok(html.includes(label), label);
  assert.match(html, /<details class="desk-records-menu"><summary>자료 · 기록/);
  assert.doesNotMatch(
    html,
    /disabled|<details[^>]*\sopen|home-grid|home-section/,
  );
});

test('Desk search precedes the real type index and keeps pin/history navigation visible', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceDesk, { homeIndex: home() }),
  );
  assert.ok(
    html.indexOf('aria-label="참조 검색"') <
      html.indexOf('aria-label="참조 종류"'),
  );
  for (const label of [
    '고정한 참조',
    '최근 참조',
    '검색 결과',
    '관련 상황 바로가기',
  ])
    assert.ok(html.includes(`aria-label="${label}"`));
  assert.doesNotMatch(
    html,
    /reference-card-grid|reference-dock|desk-play-tools/,
  );
});

test('Home exposes real generator destinations without running a generator or requiring a session', () => {
  let calls = 0;
  const html = renderToStaticMarkup(
    createElement(ReferenceDesk, {
      initialPage: 'home',
      onGenerator: () => calls++,
    }),
  );
  assert.match(html, /aria-label="주요 페이지"/);
  assert.match(html, /aria-current="page">홈<\/button>/);
  for (const title of ['캐릭터', '몬스터', '던전'])
    assert.ok(html.includes(`<strong>${title}</strong>`), title);
  assert.equal(calls, 0);
  assert.doesNotMatch(
    html,
    /세션 시작|이전 단계|<button[^>]*\sdisabled(?:=|\s|>)/,
  );
});
