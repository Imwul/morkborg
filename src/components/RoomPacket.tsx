import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Dungeon, DungeonRoom } from '../domain/types';
import {
  editedProvenance,
  hasManualEdits,
} from '../domain/generationProvenance';
import {
  editRoomComponent,
  rerollRoomComponent,
  syncRoomComponents,
} from '../generators/specialRooms';
import { Field } from './Field';
import { GenerationDisclosure } from './GenerationDisclosure';
import { Translation } from './Translation';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import type { Confirm } from './Library';

const rollableComponents = new Set([
  'sample',
  'detail',
  'adjective',
  'type',
  'contents',
  'exits',
]);

export function RoomPacket({
  dungeon,
  room,
  index,
  ready,
  update,
  confirm,
  expanded = false,
}: {
  dungeon: Dungeon;
  room: DungeonRoom;
  index: number;
  ready: boolean;
  update: (action: (room: DungeonRoom) => void) => void;
  confirm?: Confirm;
  expanded?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [previous, setPrevious] = useState<{
    before: DungeonRoom;
    after: DungeonRoom;
  } | null>(null);
  const components = room.components ?? [];
  const titleProvenance = room.fieldProvenance?.name;
  const descriptors = components.filter((item) =>
    ['adjective', 'type'].includes(item.key),
  );
  const repeatedSourceTitle =
    (titleProvenance?.derivedFrom?.join('|') === 'adjective|type' ||
      (titleProvenance?.origin === 'source' &&
        titleProvenance.classification === 'SOURCE_COMPOSED' &&
        descriptors.every((item) => item.provenance.origin === 'source'))) &&
    descriptors.length === 2 &&
    room.name === descriptors.map((item) => item.sourceText).join(' · ');
  const structuralTitle =
    titleProvenance?.origin === 'source' &&
    titleProvenance.procedureId === 'app.structural-identifier' &&
    /^ROOM \d+$/.test(room.name);
  const roll = (key: string) => {
    const run = () => {
      const before = structuredClone(room);
      update((target) => {
        rerollRoomComponent(dungeon, target, key);
        setPrevious({ before, after: structuredClone(target) });
      });
    };
    const component = components.find((item) => item.key === key);
    if (component && hasManualEdits(component) && confirm)
      confirm(
        '수동 수정한 항목을 다시 굴릴까요?',
        '이 항목의 수정값이 새 원문 결과로 바뀝니다. 다른 수동 수정 항목은 유지됩니다.',
        run,
      );
    else run();
  };
  return (
    <article
      className="room-packet"
      aria-label={`${room.kind === 'special' ? 'Special Room' : 'Room'} ${index + 1}`}
      data-room-id={room.id}
    >
      <details open={expanded || undefined}>
        <summary className="room-packet-summary">
          <span className="room-packet-number">
            <small>{room.kind === 'special' ? 'SPECIAL' : 'ROOM'}</small>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="room-packet-preview">
            {room.name && !repeatedSourceTitle && !structuralTitle && (
              <strong>{room.name}</strong>
            )}
            {components.length ? (
              components.map((item) => (
                <span
                  key={item.key}
                  className={`room-component-preview room-component-${item.key}`}
                >
                  {item.key === 'exits'
                    ? `EXITS ${item.sourceText}`
                    : item.sourceText}
                </span>
              ))
            ) : (
              <span>{room.description || '직접 작성'}</span>
            )}
            <small className="room-packet-open">OPEN ›</small>
            <small className="room-packet-close">CLOSE ‹</small>
          </span>
        </summary>
        <div className="room-packet-body">
          <div className="packet-actions">
            <button onClick={() => setEditing(!editing)} aria-pressed={editing}>
              {editing ? 'DONE' : 'EDIT'}
            </button>
            {previous && (
              <button
                aria-label={`방 ${index + 1} 이전 결과`}
                onClick={() => {
                  update((target) => {
                    const before = previous.before.components ?? [],
                      after = previous.after.components ?? [];
                    const current = target.components ?? [];
                    target.components = current.flatMap((item) => {
                      const rolled = after.find(
                        (other) => other.key === item.key,
                      );
                      if (JSON.stringify(item) !== JSON.stringify(rolled))
                        return [item];
                      const old = before.find(
                        (other) => other.key === item.key,
                      );
                      return old ? [structuredClone(old)] : [];
                    });
                    for (const item of before)
                      if (
                        !after.some((other) => other.key === item.key) &&
                        !current.some((other) => other.key === item.key)
                      )
                        target.components.push(structuredClone(item));
                    syncRoomComponents(target);
                  });
                  setPrevious(null);
                }}
              >
                ↶ Previous
              </button>
            )}
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  [
                    room.name,
                    ...components.map((item) => item.sourceText),
                  ].join('\n'),
                )
              }
            >
              COPY
            </button>
          </div>
          {editing && (
            <Field
              spec={{ key: 'name', label: '방 이름' }}
              value={room.name}
              onChange={(value) =>
                update((target) => {
                  target.name = String(value);
                  target.fieldProvenance = {
                    ...target.fieldProvenance,
                    name: editedProvenance(target.fieldProvenance?.name),
                  };
                })
              }
              showTools={false}
              hideSource
            />
          )}
          {components.map((item) => (
            <section
              className={`room-component${editing ? '' : ' room-component-reading'}`}
              key={item.key}
            >
              {editing ? (
                <Field
                  spec={{ key: item.key, label: item.label }}
                  value={item.sourceText}
                  provenance={item.provenance}
                  translation={item.translationKo}
                  onChange={(value) =>
                    update((target) =>
                      editRoomComponent(target, item.key, String(value)),
                    )
                  }
                  onReroll={
                    ready && rollableComponents.has(item.key)
                      ? () => roll(item.key)
                      : undefined
                  }
                  hideSource
                />
              ) : (
                <>
                  <small>{item.label}</small>
                  {ready && rollableComponents.has(item.key) && (
                    <button
                      className="room-component-reroll"
                      aria-label={`${item.label} 재굴림`}
                      title={
                        item.key === 'sample'
                          ? '방과 표가 지시하는 추가 항목 재굴림 · 수동 수정한 추가 항목은 보존'
                          : `${item.label} 재굴림`
                      }
                      onClick={() => roll(item.key)}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                    </button>
                  )}
                  <p>
                    <ReferenceLinkedText text={item.sourceText} />
                  </p>
                </>
              )}
              {item.key === 'sample' && (
                <details className="dependent-roll-note">
                  <summary>재굴림 범위</summary>
                  <p>
                    이 표가 지시하는 추가 항목도 함께 굴립니다. 수동 수정한 추가
                    항목은 보존합니다.
                  </p>
                </details>
              )}
            </section>
          ))}
          {!editing && components.some((item) => item.translationKo) && (
            <details className="packet-translation">
              <summary>한국어 도움말</summary>
              {components.map((item) => (
                <Translation
                  key={item.key}
                  text={item.sourceText}
                  translation={item.translationKo}
                />
              ))}
            </details>
          )}
          <GenerationDisclosure
            label="SOURCE"
            values={{
              ...(room.fieldProvenance?.name
                ? { name: room.fieldProvenance.name }
                : {}),
              ...Object.fromEntries(
                components.map((item) => [
                  item.label + ' · ' + item.key,
                  item.provenance,
                ]),
              ),
            }}
          />
          {room.legacyDescription && (
            <details>
              <summary>보존된 이전 묘사</summary>
              <p>{room.legacyDescription}</p>
            </details>
          )}
        </div>
      </details>
    </article>
  );
}
