import type { ReactNode } from 'react';
import { Translation } from './Translation';
export interface CompactAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}
export function CompactCard({
  title,
  secondary,
  metadata,
  titleTranslation,
  secondaryTranslation,
  metadataTranslation,
  onOpen,
  actions = [],
}: {
  title: string;
  secondary?: ReactNode;
  metadata?: ReactNode;
  titleTranslation?: string;
  secondaryTranslation?: string;
  metadataTranslation?: string;
  onOpen: () => void;
  actions?: CompactAction[];
}) {
  return (
    <article className="compact-card">
      <button className="compact-card-main" onClick={onOpen}>
        <strong className="compact-card-title">{title}</strong>
        {titleTranslation && (
          <Translation text={title} translation={titleTranslation} />
        )}
        {secondary && (
          <span className="compact-secondary">
            {secondary}
            {typeof secondary === 'string' && secondaryTranslation && (
              <Translation
                text={secondary}
                translation={secondaryTranslation}
              />
            )}
          </span>
        )}
        {metadata && (
          <span className="compact-metadata">
            {metadata}
            {typeof metadata === 'string' && metadataTranslation && (
              <Translation text={metadata} translation={metadataTranslation} />
            )}
          </span>
        )}
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
