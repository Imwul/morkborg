import { resultTextDensity } from './ReferenceReadingText';

/** Render only the snapshot-bound helper, without guessing from the English vocabulary. */
export function DngngenResultText({ text, ko }: { text: string; ko?: string }) {
  return (
    <p className="dungeon-native-component" lang="en">
      <span
        className="reference-result-text"
        data-result-density={resultTextDensity(text)}
      >
        {text}
      </span>
      {ko && (
        <span className="generated-translation" lang="ko">
          {ko}
        </span>
      )}
    </p>
  );
}
