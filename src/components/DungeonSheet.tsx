import { Dices, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  dungeonFields,
  roomFields,
  type Dungeon,
  type Campaign,
} from '../domain/types';
import { generateDungeonRoll, generateRoomRoll } from '../generators';
import { Field } from './Field';
import { RoomState } from './ObjectPlayTools';

/** The same readable sheet is used before and after saving a candidate. */
export function DungeonSheet({
  dungeon: d,
  campaign,
  ready,
  patch,
  patchRoom,
  rollRoom,
  openRoom,
}: {
  dungeon: Dungeon;
  campaign?: Campaign;
  ready: boolean;
  patch: (key: string, value: string | number, source?: string) => void;
  patchRoom: (
    id: string,
    key: string,
    value: string | number,
    source?: string,
  ) => void;
  rollRoom: (id: string) => void;
  openRoom?: (id: string) => void;
}) {
  const dungeonField = (spec: (typeof dungeonFields)[number]) => (
    <Field
      key={`${d.id}:${spec.key}`}
      spec={spec}
      value={String((d as unknown as Record<string, string>)[spec.key] ?? '')}
      source={d.sources?.[spec.key]}
      onChange={(value, source) => patch(spec.key, value, source)}
      reroll={ready ? () => generateDungeonRoll(spec.key, d.region) : undefined}
    />
  );
  const premise = dungeonFields.find((spec) => spec.key === 'premise')!;
  const dossierOrder = [
    'status',
    'inhabitants',
    'motive',
    'entrance',
    'entranceCondition',
    'distinctiveFeature',
    'formerPurpose',
    'weirdPhenomenon',
    'environmentalDanger',
    'treasure',
  ];
  return (
    <section className="dungeon-sheet codex-sheet" aria-label="던전 전체 시트">
      <div className="sheet-caption">
        <span>DUNGEON DOSSIER</span>
        <span>항목을 누르면 편집 · 출처 보기</span>
      </div>
      <div className="dungeon-dossier-lead">
        <div className="dossier-premise">{dungeonField(premise)}</div>
        <div className="dossier-colophon" aria-hidden="true">
          <span className="dossier-sigil">
            <i />
          </span>
          <span>HERE THE RECORD DARKENS</span>
        </div>
      </div>
      <div className="sheet-dungeon-fields">
        {dungeonFields
          .filter((spec) => spec.key !== 'premise')
          .sort(
            (a, b) => dossierOrder.indexOf(a.key) - dossierOrder.indexOf(b.key),
          )
          .map((spec) => (
            <div className="dossier-field" data-field={spec.key} key={spec.key}>
              {dungeonField(spec)}
            </div>
          ))}
      </div>
      <div className="sheet-room-index">
        <span>ROOMS / 탐험 경로</span>
        <strong>{String(d.rooms.length).padStart(2, '0')} ENTRIES</strong>
      </div>
      <div className="sheet-room-grid">
        {d.rooms.map((room, i) => (
          <article
            className="sheet-room"
            key={room.id}
            aria-label={`Room ${i + 1}`}
          >
            <div className="sheet-room-heading">
              <span className="room-number">
                <small>ROOM</small>
                <strong>{String(i + 1).padStart(2, '0')}</strong>
              </span>
              <div>
                {campaign && (
                  <RoomState campaign={campaign} dungeonId={d.id} room={room} />
                )}
                <Button
                  className="icon-btn"
                  disabled={!ready}
                  aria-label={`방 ${i + 1} 전체 재굴림`}
                  onClick={() => rollRoom(room.id)}
                >
                  <Dices size={16} />
                </Button>
                {openRoom && (
                  <Button
                    className="icon-btn"
                    aria-label={`방 ${i + 1} 상세 열기`}
                    onClick={() => openRoom(room.id)}
                  >
                    <ArrowUpRight size={16} />
                  </Button>
                )}
              </div>
            </div>
            {openRoom ? (
              <div className="room-preview-body">
                <button
                  className="room-preview-name"
                  onClick={() => openRoom(room.id)}
                >
                  {room.name || 'Unnamed Room'}
                </button>
                <p className="room-preview-description">{room.description}</p>
                <div className="contents-counts">
                  <span>몬스터 {room.monsterIds.length}</span>
                  <span>NPC {room.npcIds.length}</span>
                  <span>조우 {room.encounterIds.length}</span>
                </div>
              </div>
            ) : (
              <details className="room-draft-detail">
                <summary>
                  <strong>{room.name || 'Unnamed Room'}</strong>
                  <span className="room-preview-description">
                    {room.description || '항목을 눌러 이 방을 기록하세요.'}
                  </span>
                  <span className="room-open-label">방 편집 / 출처 ›</span>
                </summary>
                <div className="room-draft-fields">
                  {roomFields.map((spec) => (
                    <Field
                      key={spec.key}
                      spec={{
                        ...spec,
                        label: spec.key === 'name' ? '방 이름' : spec.label,
                      }}
                      value={String(
                        (room as unknown as Record<string, string>)[spec.key] ??
                          '',
                      )}
                      source={room.sources?.[spec.key]}
                      onChange={(value, source) =>
                        patchRoom(room.id, spec.key, value, source)
                      }
                      reroll={
                        ready
                          ? () => generateRoomRoll(spec.key, d.region)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </details>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
