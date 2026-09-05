/** Display aliases only. Canonical book names and stored citations stay unchanged. */
export const BOOK_ABBREVIATIONS = [
  {
    id: 'core',
    short: 'MB-BB',
    title: 'MÖRK BORG BARE BONES EDITION',
    aliases: ['MÖRK BORG Bare Bones', 'Bare Bones Edition'],
  },
  {
    id: 'core-full',
    short: 'MB-F',
    title: 'MÖRK BORG — Full Edition',
    aliases: [
      'MÖRK BORG Full Edition',
      'MÖRK BORG - Full Edition',
      'MÖRK BORG (Full Edition)',
    ],
  },
  {
    id: 'feretory',
    short: 'FER',
    title: 'MÖRK BORG CULT: FERETORY',
    aliases: ['FERETORY'],
  },
  {
    id: 'heretic',
    short: 'HER',
    title: 'MÖRK BORG CULT: HERETIC',
    aliases: ['HERETIC'],
  },
  {
    id: 'reclvse',
    short: 'RCL',
    title: 'RECLVSE — A Solo Engine for Mörk Borg',
    aliases: ['RECLVSE - A Solo Engine for Mörk Borg', 'RECLVSE'],
  },
  { id: 'sd', short: 'SD', title: 'Sölitary Defilement', aliases: [] },
  { id: 'depths', short: 'DEP', title: 'Sölitary Depths', aliases: [] },
  {
    id: 'mythic2',
    short: 'MGE2',
    title: 'Mythic Game Master Emulator Second Edition',
    aliases: [
      'Mythic Game Master Emulator 2nd Edition',
      'Mythic GME 2e',
      'Mythic 2e',
    ],
  },
  { id: 'aitc', short: 'AitC', title: 'Alöne in the Crowd', aliases: [] },
] as const;
const fold = (value: string) =>
  value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
const byId = new Map(
  BOOK_ABBREVIATIONS.map((book) => [book.id as string, book]),
);
const byTitle = new Map(
  BOOK_ABBREVIATIONS.flatMap((book) =>
    [book.title, ...book.aliases].map((title) => [fold(title), book] as const),
  ),
);

export function shortBookTitle(bookId?: string, fullTitle?: string) {
  return (
    (bookId ? byId.get(bookId) : undefined)?.short ??
    (fullTitle ? byTitle.get(fold(fullTitle))?.short : undefined) ??
    fullTitle ??
    bookId ??
    ''
  );
}

const replacements = BOOK_ABBREVIATIONS.flatMap((book) =>
  [book.title, ...book.aliases].flatMap((title) =>
    [title, title.normalize('NFKD').replace(/\p{M}/gu, '')].map((title) => ({
      title,
      short: book.short,
    })),
  ),
).sort((a, b) => b.title.length - a.title.length);
const replacementLabels = new Map(
  replacements.map(({ title, short }) => [fold(title), short]),
);
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const titlesPattern = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${[...new Set(replacements.map((item) => escaped(item.title)))].join('|')})(?![A-Za-z0-9])`,
  'giu',
);

/** Shorten known book mentions, preserving pages, sections, dice and unknown titles. */
export function compactSourceText(text: string) {
  return text
    .normalize('NFC')
    .replace(
      titlesPattern,
      (title) => replacementLabels.get(fold(title)) ?? title,
    );
}
