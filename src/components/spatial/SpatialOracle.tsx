/* eslint-disable jsx-a11y/prefer-tag-over-role -- Interactive SVG groups need explicit roles; HTML buttons cannot be children of SVG. */
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import {
  SPATIAL_SCENES,
  inspectSpatialReference,
  type SpatialHotspot,
} from '../../domain/spatialScenes';
import { useReferenceDesk } from '../ReferenceContext';
import { spatialIllustrations } from './spatialIllustrations';
import { SPATIAL_VIEWBOX } from './spatialVisuals';

export function SpatialOracle({
  sceneId,
  onSceneChange,
  onBrowse,
  related,
  workbench,
}: {
  sceneId: string;
  onSceneChange: (id: string) => void;
  onBrowse: (scope: 'all' | 'recent' | 'pinned') => void;
  related: ReactNode;
  workbench: ReactNode;
}) {
  const desk = useReferenceDesk();
  const scene =
    SPATIAL_SCENES.find((item) => item.id === sceneId) ?? SPATIAL_SCENES[0];
  const illustration = spatialIllustrations[scene.id];
  if (!illustration) throw new Error(`Missing scene artwork: ${scene.id}`);
  const visuals = illustration.targets;
  const [reveal, setReveal] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLElement>(null);
  const targets = useRef<Record<string, SVGGElement | null>>({});
  const lastTarget = useRef<string | null>(null);
  const selected = scene.hotspots.find(
    (spot) => spot.referenceId === desk?.selectedId,
  );
  const pointed =
    scene.hotspots.find((spot) => spot.id === hovered) ?? selected;
  const hoverSpot = scene.hotspots.find((spot) => spot.id === hovered);
  const hoverLabel = hoverSpot?.accessibleLabel.split(' · ')[0] ?? '';
  const hoverPoint = hoverSpot
    ? visuals[hoverSpot.visualTarget].labelPoint
    : null;
  const missing = [
    ...scene.hotspots,
    ...scene.supportGroups.flatMap((group) => group.references),
  ].filter((item) => !desk?.byId[item.referenceId]);
  useEffect(() => {
    const element = viewport.current;
    if (element)
      element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
  }, [scene.id]);

  function inspectReference(referenceId: string, targetId: string | null) {
    if (!desk || !desk.byId[referenceId]) return;
    lastTarget.current = targetId;
    inspectSpatialReference(referenceId, desk);
    requestAnimationFrame(() => {
      reader.current?.focus({ preventScroll: true });
      const headerBottom =
        document.querySelector('.rdesk-header')?.getBoundingClientRect()
          .bottom ?? 0;
      if (
        window.matchMedia('(max-width: 1100px)').matches ||
        (reader.current?.getBoundingClientRect().top ?? 0) < headerBottom + 20
      )
        reader.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function inspect(hotspot: SpatialHotspot) {
    inspectReference(hotspot.referenceId, hotspot.id);
  }
  function focusTarget(id: string) {
    const target = targets.current[id];
    if (!target) return;
    target.focus({ preventScroll: true });
    const bounds = target.getBoundingClientRect(),
      box = viewport.current?.getBoundingClientRect();
    if (box && viewport.current) {
      if (bounds.left < box.left || bounds.right > box.right)
        viewport.current.scrollLeft +=
          (bounds.left + bounds.right - box.left - box.right) / 2;
    }
  }
  function key(event: KeyboardEvent<SVGGElement>, hotspot: SpatialHotspot) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!event.repeat) inspect(hotspot);
      return;
    }
    const direction = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const [x, y] = visuals[hotspot.visualTarget].labelPoint;
    const next = scene.hotspots
      .filter((s) => s.id !== hotspot.id)
      .map((s) => {
        const [xx, yy] = visuals[s.visualTarget].labelPoint;
        const dx = xx - x,
          dy = yy - y;
        return {
          id: s.id,
          along: dx * direction[0] + dy * direction[1],
          distance: Math.hypot(dx, dy),
        };
      })
      .filter((s) => s.along > 0)
      .sort((a, b) => a.distance - b.distance)[0];
    if (next) focusTarget(next.id);
  }
  function returnToScene() {
    const targetId = selected?.id ?? lastTarget.current;
    desk?.dismiss?.();
    requestAnimationFrame(() => {
      viewport.current?.scrollIntoView({
        block: 'center',
        behavior: 'instant',
      });
      if (targetId) focusTarget(targetId);
    });
  }
  return (
    <section
      className="spatial-oracle"
      aria-label="Spatial Oracle"
      data-scene={scene.id}
    >
      <header className="spatial-heading">
        <div>
          <p className="spatial-eyebrow">SPATIAL ORACLE / 장소에서 찾는 참조</p>
          <h2>어디에 있습니까?</h2>
        </div>
        <nav aria-label="장면 선택" className="spatial-scenes">
          {SPATIAL_SCENES.map((item) => (
            <button
              key={item.id}
              data-scene-tab={item.id}
              aria-pressed={scene.id === item.id}
              onClick={() => {
                if (item.id !== scene.id) {
                  desk?.dismiss?.();
                  onSceneChange(item.id);
                  setHovered(null);
                  lastTarget.current = null;
                  if (viewport.current) viewport.current.scrollLeft = 0;
                }
              }}
            >
              {item.title}
              <span>{item.subtitle}</span>
            </button>
          ))}
        </nav>
      </header>
      <div className="spatial-layout">
        <div className="spatial-plate-column">
          <div className="spatial-plate-caption">
            <h3>{scene.title}</h3>
            <span>{scene.subtitle}</span>
            <small>
              PLATE {String(SPATIAL_SCENES.indexOf(scene) + 1).padStart(2, '0')}
            </small>
          </div>
          <p className="spatial-description">{scene.description}</p>
          <div className="spatial-map-tools">
            <button aria-pressed={reveal} onClick={() => setReveal(!reveal)}>
              살펴볼 곳 {reveal ? '숨기기' : '표시'}
            </button>
            <div>
              <button
                aria-label="지도 왼쪽으로"
                onClick={() => viewport.current?.scrollBy({ left: -220 })}
              >
                ←
              </button>
              <button aria-pressed={zoom} onClick={() => setZoom(!zoom)}>
                {zoom ? '기본 크기' : '확대'}
              </button>
              <button
                aria-label="지도 오른쪽으로"
                onClick={() => viewport.current?.scrollBy({ left: 220 })}
              >
                →
              </button>
            </div>
          </div>
          <div className="spatial-map-viewport" ref={viewport} data-zoom={zoom}>
            <svg
              className="spatial-map"
              viewBox={SPATIAL_VIEWBOX}
              data-reveal={reveal}
              role="group"
              aria-label={`${scene.title} — 사물을 선택해 참조 열기`}
              aria-describedby="spatial-map-help"
            >
              <title>{scene.title} — interactive reference illustration</title>
              <desc>
                그려진 사물을 선택하면 참조가 열립니다. Tab과 방향키로 이동하고
                Enter 또는 Space로 엽니다. 굴림은 참조에서 별도로 실행합니다.
              </desc>
              <image
                className="spatial-illustration"
                href={illustration.imageSrc}
                width="760"
                height="620"
                preserveAspectRatio="none"
                aria-hidden="true"
                pointerEvents="none"
              />
              {[...scene.hotspots]
                .sort(
                  (a, b) =>
                    (visuals[a.visualTarget].layer ?? 1) -
                    (visuals[b.visualTarget].layer ?? 1),
                )
                .map((hotspot) => {
                  const visual = visuals[hotspot.visualTarget];
                  const entry = desk?.byId[hotspot.referenceId];
                  return (
                    <g
                      key={hotspot.id}
                      ref={(element) => {
                        targets.current[hotspot.id] = element;
                      }}
                      className="spatial-hotspot"
                      role="button"
                      tabIndex={0}
                      aria-label={`${hotspot.accessibleLabel} — ${entry?.title ?? '자료 필요'}`}
                      aria-pressed={selected?.id === hotspot.id}
                      aria-disabled={!entry || undefined}
                      aria-controls="spatial-reference-reader"
                      data-hotspot-id={hotspot.id}
                      data-reference-target={hotspot.referenceId}
                      data-feature-x={visual.featurePoint[0]}
                      data-feature-y={visual.featurePoint[1]}
                      onPointerEnter={() => setHovered(hotspot.id)}
                      onPointerLeave={() => setHovered(null)}
                      onFocus={(event) => {
                        setHovered(hotspot.id);
                        if (event.currentTarget.matches(':focus-visible'))
                          focusTarget(hotspot.id);
                      }}
                      onBlur={() => setHovered(null)}
                      onClick={() => inspect(hotspot)}
                      onKeyDown={(event) => key(event, hotspot)}
                    >
                      <path
                        className="spatial-hit"
                        d={visual.hitPath}
                        style={
                          visual.hitStrokeWidth
                            ? {
                                strokeWidth: visual.hitStrokeWidth,
                                fill: 'none',
                                stroke: 'transparent',
                                strokeDasharray: 'none',
                                pointerEvents: 'stroke',
                              }
                            : undefined
                        }
                      />
                      {visual.hitStrokeWidth && (
                        <path
                          className="spatial-route-outline"
                          d={visual.hitPath}
                          aria-hidden="true"
                          pointerEvents="none"
                        />
                      )}
                      <g
                        className="spatial-mark"
                        aria-hidden="true"
                        pointerEvents="none"
                        transform={`translate(${visual.labelPoint.join(' ')})`}
                      >
                        <circle r="8" />
                        <path d="m-3 0 2 3 5-6" />
                      </g>
                    </g>
                  );
                })}
              {hoverPoint && (
                <g
                  className="spatial-map-label"
                  aria-hidden="true"
                  pointerEvents="none"
                  transform={`translate(${Math.min(690, Math.max(70, hoverPoint[0]))} ${Math.min(594, hoverPoint[1] + 22)})`}
                >
                  <rect
                    x={-Math.max(44, hoverLabel.length * 8 + 12)}
                    y="-16"
                    width={Math.max(88, hoverLabel.length * 16 + 24)}
                    height="29"
                  />
                  <text textAnchor="middle" y="4">
                    {hoverLabel}
                  </text>
                </g>
              )}
            </svg>
          </div>
          <div
            className="spatial-hover-label"
            aria-live="polite"
            aria-atomic="true"
          >
            {pointed ? (
              <>
                <b>{pointed.accessibleLabel}</b>
                <span>선택하여 참조 열기 ↗</span>
              </>
            ) : (
              <>
                <b>사물을 가리켜 살펴보세요.</b>
                <span>{scene.hotspots.length}곳 · 자유롭게 탐색</span>
              </>
            )}
          </div>
          <p className="spatial-map-help" id="spatial-map-help">
            선택은 참조 열기, 굴림은 참조 안에서.{' '}
            <span>Tab / 방향키로 이동 · Enter로 선택.</span>
            <span className="spatial-pan-hint">
              {' '}
              지도를 좌우로 밀어 나머지 공간을 살펴보세요.
            </span>
          </p>
          {!!missing.length && (
            <output className="spatial-data-notice">
              아직 불러오지 못한 참조 {missing.length}개. 상단 자료 상태를
              확인하세요. 연결되지 않은 사물은 굴리지 않습니다.
            </output>
          )}
          <aside
            className="spatial-support"
            aria-label="장면을 상상하는 보조 오라클"
          >
            <div className="spatial-support-heading">
              <p className="spatial-eyebrow">BEYOND THE MAP / 지도 밖의 맥락</p>
              <h3>이곳을 상상할 단서</h3>
              <p>
                그려진 사물에 직접 붙지 않는 배경과 분위기입니다. 원하는 참조를
                열어 살펴보고, 굴림은 참조 안에서 선택하세요.
              </p>
            </div>
            <div className="spatial-support-groups">
              {scene.supportGroups.map((group) => (
                <section className="spatial-support-group" key={group.id}>
                  <h4>{group.title}</h4>
                  <p>{group.description}</p>
                  <div className="spatial-support-entries">
                    {group.references.map((item, index) => {
                      const entry = desk?.byId[item.referenceId];
                      return (
                        <button
                          key={item.id}
                          data-support-id={item.id}
                          data-reference-target={item.referenceId}
                          aria-controls="spatial-reference-reader"
                          aria-pressed={desk?.selectedId === item.referenceId}
                          disabled={!entry}
                          onClick={() =>
                            inspectReference(item.referenceId, null)
                          }
                        >
                          <small>{String(index + 1).padStart(2, '0')}</small>
                          <span>{item.label}</span>
                          <span aria-hidden="true">↗</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </aside>
        </div>
        <section
          className="spatial-reader"
          id="spatial-reference-reader"
          ref={reader}
          tabIndex={-1}
          aria-label="장면의 참조"
        >
          <nav className="spatial-reader-tools" aria-label="장면 참조 도구">
            {desk?.selectedId && (
              <button onClick={returnToScene}>← 지도로 돌아가기</button>
            )}
            <button onClick={() => onBrowse('recent')}>최근</button>
            <button onClick={() => onBrowse('pinned')}>고정</button>
            <button onClick={() => desk?.openTools?.('play')}>작업대</button>
          </nav>
          {desk?.content ? (
            <>
              {desk.content}
              {related}
            </>
          ) : (
            <div className="spatial-reader-empty">
              <p className="spatial-eyebrow">POINT. INSPECT. ROLL.</p>
              <h3>
                이름을 몰라도
                <br />
                가리킬 수 있습니다.
              </h3>
              <p>
                문, 길, 물건을 선택하세요.
                <br />
                그곳에 연결된 기존 참조를 여기서 펼칩니다.
              </p>
              <p className="spatial-empty-note">
                결과와 출처는 이 페이지에 남습니다.
                <br />
                지도는 계속 탐색할 수 있습니다.
              </p>
              <button onClick={() => onBrowse('all')}>
                찾는 참조를 알고 있다면 → Reference Desk
              </button>
            </div>
          )}
          {workbench}
        </section>
      </div>
    </section>
  );
}
