import { translateGeneratedText } from '../generators/translation';
export function Translation({
  text,
  translation,
}: {
  text: string;
  translation?: string;
}) {
  const ko = translation ?? translateGeneratedText(text);
  return ko && ko.normalize('NFC') !== text.normalize('NFC') ? (
    <span className="generated-translation" lang="ko">
      {ko}
    </span>
  ) : null;
}
