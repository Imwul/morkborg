import { compactSourceText, shortBookTitle } from '../domain/sourceDisplay';

export function BookLabel({
  bookId,
  title,
}: {
  bookId?: string;
  title?: string;
}) {
  const short = shortBookTitle(bookId, title);
  return short === title ? (
    <>{title}</>
  ) : (
    <abbr className="book-abbreviation" title={title}>
      {short}
    </abbr>
  );
}
export function SourceText({ text }: { text?: string }) {
  if (!text) return null;
  const short = compactSourceText(text);
  return <span title={short === text ? undefined : text}>{short}</span>;
}
