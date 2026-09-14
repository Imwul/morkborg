/** Visual emphasis only. Compound traces retain their complete original notation. */
export function ReferenceRollTrace({ text }: { text: string }) {
  const simple = /^([^=]+) = (-?\d+)$/.exec(text);
  return (
    <code>
      {simple ? (
        <>
          <span className="roll-expression">{simple[1]} = </span>
          <strong className="roll-value">{simple[2]}</strong>
        </>
      ) : (
        text
      )}
    </code>
  );
}
