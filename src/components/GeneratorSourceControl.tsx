import type { ReactNode } from 'react';
import {
  pendingGeneratorSource,
  type GeneratorSource,
} from '../domain/generatorSourceDisplay';

export function GeneratorSourceControl({
  children,
  current,
  next,
  description,
  status,
}: {
  children: ReactNode;
  current?: GeneratorSource;
  next: GeneratorSource;
  description: ReactNode;
  status?: string;
}) {
  const pending = pendingGeneratorSource(current, next);
  return (
    <div className="generator-source-control">
      <div className="generator-source-row">
        {children}
        <details className="generator-source-details" key={current ?? next}>
          <summary>안내</summary>
          <div>{description}</div>
        </details>
      </div>
      {pending && (
        <output className="generator-source-pending">{pending}</output>
      )}
      {status && <output className="generator-source-status">{status}</output>}
    </div>
  );
}
