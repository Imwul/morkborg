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

test('Home exposes all existing destinations without requiring a campaign; optional records stay closed', () => {
  const html = renderToStaticMarkup(home());
  for (const label of [
    '레퍼런스 작업대',
    'Oracle 라이브러리',
    '자료 및 규칙',
    'City Crawl',
    'Mythic Fate',
    '재앙 · 여행',
    '플레이 화면',
    '던전 보관함',
    '캐릭터',
    '몬스터',
    'NPC',
    '조우',
    '보관한 자료',
    '캠페인',
    '세션',
    '연대기',
    '실마리',
    '소문',
    '유물',
    '짧은 기록',
    '캠페인 노트',
    '가져오기',
    '소개 · 출처',
  ])
    assert.ok(html.includes(label), label);
  assert.match(html, /<details class="home-records"><summary>보조 기록/);
  assert.doesNotMatch(html, /disabled|<details[^>]*\sopen|<input|<textarea/);
});

test('Home keeps direct search above the index and omits empty or duplicate tool sections', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceDesk, { homeIndex: home() }),
  );
  assert.ok(
    html.indexOf('aria-label="작업대 검색"') <
      html.indexOf('aria-label="전체 항목"'),
  );
  assert.match(html, /aria-label="고정한 표" hidden=""/);
  assert.match(html, /aria-label="최근 사용한 표" hidden=""/);
  assert.doesNotMatch(html, /desk-play-tools|desk-regions|desk-index/);
});
