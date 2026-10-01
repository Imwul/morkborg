import type { ReactNode } from 'react';

/** Choices for the next roll stay visible without competing with the result. */
export function ReferenceRollSettings({
  children,
  label = '굴림 설정',
  description,
}: {
  children: ReactNode;
  label?: string;
  description?: ReactNode;
}) {
  return (
    <fieldset className="reference-roll-settings">
      <legend className="sr-only">{label}</legend>
      {children}
      {description && (
        <details className="reference-roll-settings-help">
          <summary>안내</summary>
          <div>{description}</div>
        </details>
      )}
    </fieldset>
  );
}
