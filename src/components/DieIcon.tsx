/** Unnumbered polyhedral outlines matching the supplied dice reference. */
export function DieIcon({ sides }: { sides: number }) {
  const outline: Record<number, string> = {
    4: 'M20 4 37 34H3Z',
    6: 'M20 3 36 12V29L20 38 4 29V12Z',
    8: 'M20 3 36 12V29L20 38 4 29V12Z',
    10: 'M20 3 38 20 20 38 2 20Z',
    12: 'M20 3 31 7 37 16V27L30 35 20 38 10 35 3 27V16L9 7Z',
    20: 'M20 3 36 12V29L20 38 4 29V12Z',
  };
  const facets: Record<number, string> = {
    4: 'M20 4 20 24 3 34M20 24 37 34',
    6: 'M4 12 20 21 36 12M20 21V38',
    8: 'M20 3 4 29H36Z',
    10: 'M20 3 12 20 20 24 28 20ZM2 20H12M28 20H38M20 24V38',
    12: 'M20 10 30 17 26 29H14L10 17ZM20 3V10M37 16 30 17M30 35 26 29M10 35 14 29M3 16 10 17',
    20: 'M20 3V11M4 12 20 11 36 12M20 11 11 26H29ZM4 12 11 26 4 29M36 12 29 26 36 29M11 26 20 38 29 26',
  };
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {sides === 2 ? (
        <>
          <ellipse cx="21" cy="20" rx="13" ry="16" strokeWidth="1.65" />
          <path d="M19 4C1 4 1 36 19 36M17 8C8 13 8 27 17 32" />
        </>
      ) : sides === 100 ? (
        <>
          <g transform="translate(-1 5) scale(.77)">
            <path d={outline[10]} strokeWidth="1.65" />
            <path d={facets[10]} />
          </g>
          <g transform="translate(13 0) scale(.67)">
            <path d={outline[10]} fill="var(--dice-face)" strokeWidth="1.65" />
            <path d={facets[10]} />
          </g>
        </>
      ) : (
        <>
          <path d={outline[sides]} strokeWidth="1.65" />
          <path d={facets[sides]} />
        </>
      )}
    </svg>
  );
}
