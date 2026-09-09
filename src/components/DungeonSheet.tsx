import { useState, type ReactNode } from 'react';
import {
  dungeonFields,
  roomFields,
  type Dungeon,
  type DungeonRoom,
  type Campaign,
} from '../domain/types';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import {
  canReroll,
  generateDungeonRoll,
  generateRoomRoll,
} from '../generators';
import { Field } from './Field';
import { RoomPacket } from './RoomPacket';
import { GenerationDisclosure } from './GenerationDisclosure';
import type { Confirm } from './Library';

/** Shared dossier and room packets before and after saving. */
export function DungeonSheet({
  dungeon: d,
  ready,
  patch,
  patchRoom,
  updateRoom,
  confirm,
  openRoom,
  actions,
}: {
  dungeon: Dungeon;
  campaign?: Campaign;
  ready: boolean;
  patch: (
    key: string,
    value: string | number,
    source?: string,
    provenance?: GeneratedValueProvenance,
  ) => void;
  patchRoom: (
    id: string,
    key: string,
    value: string | number,
    source?: string,
    provenance?: GeneratedValueProvenance,
  ) => void;
  updateRoom: (id: string, action: (room: DungeonRoom) => void) => void;
  rollRoom: (id: string) => void;
  confirm?: Confirm;
  openRoom?: (id: string) => void;
  actions?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const groups = [
    ['CORE DOSSIER', ['status', 'inhabitants', 'formerPurpose', 'motive']],
    ['ACCESS', ['entrance', 'entranceCondition']],
    [
      'DISTURBANCES',
      ['distinctiveFeature', 'environmentalDanger', 'weirdPhenomenon'],
    ],
    ['OBJECT / RELIC', ['treasure']],
  ] as const;
  const field = (key: string) => {
    const spec = dungeonFields.find((item) => item.key === key)!;
    const value = String((d as unknown as Record<string, string>)[key] ?? '');
    if (!value && !editing) return null;
    return (
      <Field
        key={d.id + key}
        spec={spec}
        value={value}
        source={d.sources?.[key]}
        provenance={d.fieldProvenance?.[key]}
        onChange={(value, source, provenance) =>
          patch(key, value, source, provenance)
        }
        reroll={
          ready && canReroll('dungeon', key)
            ? () => generateDungeonRoll(key, d.region)
            : undefined
        }
        showTools={editing}
        hideSource
      />
    );
  };
  return (
    <section
      className={`dungeon-sheet codex-sheet integrity-dossier ${editing ? 'dossier-editing' : ''}`}
      aria-label="던전 전체 시트"
    >
      <div className="sheet-caption">
        <span>DUNGEON DOSSIER</span>
        <div className="dossier-actions">
          <button aria-pressed={editing} onClick={() => setEditing(!editing)}>
            {editing ? '완료' : '편집'}
          </button>
          {actions}
        </div>
      </div>
      {d.premise && <div className="dossier-premise">{field('premise')}</div>}
      <div className="dossier-composition">
        {groups.map(
          ([label, keys]) =>
            (editing ||
              keys.some(
                (key) => (d as unknown as Record<string, string>)[key],
              )) && (
              <section className="dossier-group" key={label}>
                <h3>{label}</h3>
                <div>{keys.map(field)}</div>
              </section>
            ),
        )}
      </div>
      <GenerationDisclosure values={d.fieldProvenance} />
      <div className="sheet-room-index">
        <span>ROOM LEDGER</span>
        <strong>{String(d.rooms.length).padStart(2, '0')}</strong>
      </div>
      <div className="room-packet-grid">
        {d.rooms.map((room, index) =>
          room.components ? (
            <div key={room.id}>
              <RoomPacket
                dungeon={d}
                room={room}
                index={index}
                ready={ready}
                update={(action) => updateRoom(room.id, action)}
                confirm={confirm}
              />
              {openRoom && (
                <button
                  className="room-context-link"
                  onClick={() => openRoom(room.id)}
                >
                  배치 · 크롤 ›
                </button>
              )}
            </div>
          ) : (
            <article className="room-packet legacy-room" key={room.id}>
              <details>
                <summary className="room-packet-summary">
                  <span className="room-packet-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="room-packet-preview">
                    <strong>{room.name}</strong>
                    <span>{room.description}</span>
                  </span>
                </summary>
                <div className="room-packet-body">
                  <small>
                    저장된 내용 · 원문 구성 요소로 재해석하지 않았습니다.
                  </small>
                  {roomFields.map((spec) => (
                    <Field
                      key={spec.key}
                      spec={spec}
                      value={String(
                        (room as unknown as Record<string, string>)[spec.key] ??
                          '',
                      )}
                      source={room.sources?.[spec.key]}
                      provenance={room.fieldProvenance?.[spec.key]}
                      onChange={(value, source, provenance) =>
                        patchRoom(room.id, spec.key, value, source, provenance)
                      }
                      reroll={
                        ready && canReroll('room', spec.key)
                          ? () => generateRoomRoll(spec.key, d.region)
                          : undefined
                      }
                    />
                  ))}
                  {openRoom && (
                    <button onClick={() => openRoom(room.id)}>방 열기 ›</button>
                  )}
                </div>
              </details>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
