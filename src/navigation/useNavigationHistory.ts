import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { NavigationHistory, type NavigationEntry } from './history';

const KEY = 'morkborgNavigationV1';
let driver: NavigationHistory | undefined;
export function browserNavigation() {
  if (typeof window === 'undefined') return undefined;
  if (!driver) {
    const write = (entry: NavigationEntry, push: boolean) => {
      const state = { ...window.history.state, [KEY]: entry };
      if (push) window.history.pushState(state, '');
      else window.history.replaceState(state, '');
    };
    let restoring = false;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    driver = new NavigationHistory({
      read: () => window.history.state?.[KEY],
      replace: (e) => write(e, false),
      push: (e) => write(e, true),
      go: (delta) => window.history.go(delta),
      onPop: (fn) => {
        const pop = (event: PopStateEvent) => fn(event.state?.[KEY]);
        window.addEventListener('popstate', pop);
        return () => window.removeEventListener('popstate', pop);
      },
      restoreScroll: (y) => {
        restoring = true;
        clearTimeout(scrollTimer);
        scrollTimer = undefined;
        let frames = 0;
        const apply = () => {
          // Give React and a lazy route time to restore the previous document height.
          if (
            ++frames < 12 &&
            (frames < 3 ||
              document.documentElement.scrollHeight < y + innerHeight)
          ) {
            requestAnimationFrame(apply);
            return;
          }
          window.scrollTo({ top: y, behavior: 'instant' });
          requestAnimationFrame(() => {
            restoring = false;
          });
        };
        requestAnimationFrame(apply);
      },
    });
    window.history.scrollRestoration = 'manual';
    window.addEventListener(
      'scroll',
      () => {
        if (!restoring) {
          driver?.scroll(window.scrollY);
          if (scrollTimer === undefined)
            scrollTimer = setTimeout(() => {
              scrollTimer = undefined;
              driver?.persistScroll();
            }, 1000);
        }
      },
      { passive: true },
    );
  }
  return driver;
}
const noSubscribe = () => () => {};
const noBack = () => false;
export function useNavigationBack() {
  const history = browserNavigation();
  return {
    canBack: useSyncExternalStore(
      history?.subscribe ?? noSubscribe,
      history?.canBack ?? noBack,
      noBack,
    ),
    back: () => history?.back() ?? false,
  };
}
export function useNavigationChannel<T>(
  name: string,
  value: T,
  restore: (value: T) => void,
  options: {
    normalize: (raw: unknown) => T;
    identity?: (value: T) => unknown;
    open?: (value: T) => boolean;
  },
) {
  const latest = useRef({ value, restore, options });
  useLayoutEffect(() => {
    latest.current = { value, restore, options };
  });
  const restoring = useRef<string | null>(null);
  useLayoutEffect(() => {
    const history = browserNavigation();
    const state = (value: T) => ({
      value,
      key: JSON.stringify(latest.current.options.identity?.(value) ?? value),
    });
    return history?.register(name, {
      initial: state(latest.current.value),
      restore: (raw) => {
        const next = latest.current.options.normalize(raw);
        const key = JSON.stringify(next);
        restoring.current =
          key !== JSON.stringify(latest.current.value) ? key : null;
        if (restoring.current !== null) {
          latest.current.restore(next);
        }
        return state(next);
      },
      open: latest.current.options.open
        ? (raw) => latest.current.options.open?.(raw as T) ?? false
        : undefined,
    });
    // The callbacks always read latest. Register once for this mounted view.
  }, [name]);
  useLayoutEffect(() => {
    if (restoring.current !== null) {
      if (restoring.current !== JSON.stringify(value)) return;
      restoring.current = null;
    }
    browserNavigation()?.observe(name, {
      value,
      key: JSON.stringify(options.identity?.(value) ?? value),
    });
  });
}
