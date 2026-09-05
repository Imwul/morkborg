import { Component, Suspense, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey: string;
  label?: string;
  overlay?: boolean;
  active?: boolean;
}

class ViewBoundary extends Component<
  Omit<Props, 'resetKey'>,
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return this.props.active === false ? null : (
        <div
          role="alert"
          className={this.props.overlay ? 'toast' : 'empty-copy'}
        >
          <p>
            {this.props.label ?? '화면'}을 불러오지 못했습니다. 새로고침하거나
            다른 화면을 열어 주세요.
          </p>
          <button
            className="btn small"
            onClick={() => window.location.reload()}
          >
            새로고침
          </button>
        </div>
      );
    return this.props.children;
  }
}

/** Keep the navigation and reference provider available while an optional view loads. */
export function DeferredView({
  children,
  resetKey,
  label = '화면',
  overlay = false,
  active = true,
}: Props) {
  return (
    <ViewBoundary
      key={resetKey}
      label={label}
      overlay={overlay}
      active={active}
    >
      <Suspense
        fallback={
          active ? (
            <output className={overlay ? 'toast' : 'empty-copy'}>
              {label}을 불러오는 중…
            </output>
          ) : null
        }
      >
        {children}
      </Suspense>
    </ViewBoundary>
  );
}
