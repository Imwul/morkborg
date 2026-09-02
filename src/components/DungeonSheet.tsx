import { Dices, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dungeonFields, roomFields, type Dungeon } from '../domain/types';
import { generateDungeonRoll, generateRoomRoll } from '../generators';
import { Field } from './Field';

/** The same readable sheet is used before and after saving a candidate. */
export function DungeonSheet({
  dungeon: d,
  ready,
  patch,
  patchRoom,
  rollRoom,
  openRoom,
}: {
  dungeon: Dungeon;
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
  return (
    <section className="dungeon-sheet codex-sheet" aria-label="던전 전체 시트">
      <div className="sheet-caption">
        <span>DUNGEON DOSSIER</span>
        <span>항목을 누르면 편집 · 출처 보기</span>
      </div>
      <div className="sheet-dungeon-fields">
        {dungeonFields.map((spec) => (
          <Field
            key={`${d.id}:${spec.key}`}
            spec={spec}
            value={String(
              (d as unknown as Record<string, string>)[spec.key] ?? '',
            )}
            source={d.sources?.[spec.key]}
            onChange={(value, source) => patch(spec.key, value, source)}
            reroll={
              ready ? () => generateDungeonRoll(spec.key, d.region) : undefined
            }
          />
        ))}
      </div>
      <div className="sheet-room-grid">
        {d.rooms.map((room, i) => (
          <article
            className="sheet-room"
            key={room.id}
            aria-label={`Room ${i + 1}`}
          >
            <div className="sheet-room-heading">
              <span>ROOM {String(i + 1).padStart(2, '0')}</span>
              <div>
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
            {roomFields.map((spec) => (
              <Field
                key={spec.key}
                spec={{
                  ...spec,
                  label: spec.key === 'name' ? '방 이름' : spec.label,
                }}
                value={String(
                  (room as unknown as Record<string, string>)[spec.key] ?? '',
                )}
                source={room.sources?.[spec.key]}
                onChange={(value, source) =>
                  patchRoom(room.id, spec.key, value, source)
                }
                reroll={
                  ready ? () => generateRoomRoll(spec.key, d.region) : undefined
                }
              />
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
