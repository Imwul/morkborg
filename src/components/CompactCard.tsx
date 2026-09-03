import type { ReactNode } from 'react';
export interface CompactAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}
export function CompactCard({
  title,
  secondary,
  metadata,
  onOpen,
  actions = [],
}: {
  title: string;
  secondary?: ReactNode;
  metadata?: ReactNode;
  onOpen: () => void;
  actions?: CompactAction[];
}) {
  return (
    <article className="compact-card">
      <button className="compact-card-main" onClick={onOpen}>
        <strong className="compact-card-title">{title}</strong>
        {secondary && <span className="compact-secondary">{secondary}</span>}
        {metadata && <span className="compact-metadata">{metadata}</span>}
      </button>
      {!!actions.length && (
        <details className="compact-overflow">
          <summary aria-label={title + ' 메뉴'}>⋯</summary>
          <fieldset className="compact-menu" aria-label={title + ' 작업'}>
            {actions.map((action) => (
              <button
                className={action.danger ? 'danger' : ''}
                key={action.label}
                onClick={(event) => {
                  const details = event.currentTarget.closest('details');
                  if (details) details.open = false;
                  action.onSelect();
                }}
              >
                {action.label}
              </button>
            ))}
          </fieldset>
        </details>
      )}
    </article>
  );
}
