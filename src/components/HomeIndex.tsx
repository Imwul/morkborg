import { useRef } from 'react';

/** Utility menu shared by the Reference Desk home and reading pages. */
export function HomeIndex({
  onSources,
  onFate,
  onAbout,
}: {
  onSources: () => void;
  onFate: () => void;
  onAbout: () => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const choose = (action: () => void) => {
    menu.current?.removeAttribute('open');
    action();
  };

  return (
    <details ref={menu} className="desk-records-menu">
      <summary>더보기</summary>
      <div>
        <button aria-label="자료 및 규칙" onClick={() => choose(onSources)}>자료 및 규칙</button>
        <button aria-label="Mythic Fate" onClick={() => choose(onFate)}>Mythic Fate</button>
        <button aria-label="소개 및 출처" onClick={() => choose(onAbout)}>소개 및 출처</button>
      </div>
    </details>
  );
}
