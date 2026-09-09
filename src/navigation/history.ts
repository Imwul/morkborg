/** Browser navigation contains view selectors only, never saved game objects. */
export interface ChannelState {
  value: unknown;
  key: string;
}
export interface NavigationEntry {
  version: 1;
  index: number;
  channels: Record<string, ChannelState>;
  roots: Record<string, number>;
  scroll: number;
}
export interface HistoryPort {
  read(): unknown;
  replace(entry: NavigationEntry): void;
  push(entry: NavigationEntry): void;
  go(delta: number): void;
  onPop(listener: (entry: unknown) => void): () => void;
  restoreScroll(y: number): void;
}
interface Channel {
  initial: ChannelState;
  restore(value: unknown): ChannelState;
  open?: (value: unknown) => boolean;
}
function validEntry(value: unknown): value is NavigationEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as NavigationEntry;
  return (
    v.version === 1 &&
    Number.isSafeInteger(v.index) &&
    v.index >= 0 &&
    !!v.channels &&
    typeof v.channels === 'object' &&
    !!v.roots &&
    typeof v.roots === 'object' &&
    Number.isFinite(v.scroll) &&
    Object.values(v.channels).every((c) => !!c && typeof c.key === 'string')
  );
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export class NavigationHistory {
  private current: NavigationEntry;
  private channels = new Map<string, Channel>();
  private listeners = new Set<() => void>();
  private pending = new Map<string, ChannelState>();
  private queued = false;
  private stop: () => void;
  constructor(private port: HistoryPort) {
    const saved = port.read();
    this.current = validEntry(saved)
      ? saved
      : { version: 1, index: 0, channels: {}, roots: {}, scroll: 0 };
    port.replace(this.current);
    this.stop = port.onPop((value) => {
      this.pending.clear();
      if (!validEntry(value)) return;
      this.current = structuredClone(value);
      for (const [name, channel] of this.channels) {
        const state = this.current.channels[name] ?? channel.initial;
        this.current.channels[name] = channel.restore(state.value);
      }
      this.port.replace(this.current);
      this.emit();
      this.port.restoreScroll(this.current.scroll);
    });
  }
  canBack = () => this.current.index > 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }
  register(name: string, channel: Channel) {
    this.channels.set(name, channel);
    const saved = this.current.channels[name];
    this.current.channels[name] = saved
      ? channel.restore(saved.value)
      : channel.initial;
    this.port.replace(this.current);
    return () => {
      this.channels.delete(name);
    };
  }
  observe(name: string, state: ChannelState) {
    if (same(this.pending.get(name) ?? this.current.channels[name], state))
      return;
    this.pending.set(name, state);
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      this.flush();
    });
  }
  flush() {
    if (!this.pending.size) return;
    const next = structuredClone(this.current);
    let changed = false;
    const changedNames: string[] = [];
    for (const [name, state] of this.pending) {
      if (state.key !== next.channels[name]?.key) {
        changed = true;
        changedNames.push(name);
      }
      next.channels[name] = state;
    }
    this.pending.clear();
    if (changed) {
      const closing = changedNames.filter((name) => {
        const open = this.channels.get(name)?.open;
        return (
          open?.(this.current.channels[name]?.value) &&
          !open(next.channels[name]?.value)
        );
      });
      const roots = closing.map((name) => this.current.roots[name]);
      if (
        closing.length === changedNames.length &&
        roots.length &&
        roots.every(
          (root) =>
            Number.isSafeInteger(root) &&
            root >= 0 &&
            root < this.current.index,
        )
      ) {
        this.port.go(Math.min(...roots) - this.current.index);
        return;
      }
      next.index++;
      next.scroll = 0;
      for (const [name, channel] of this.channels) {
        if (!channel.open) continue;
        const wasOpen = channel.open(this.current.channels[name]?.value);
        const isOpen = channel.open(next.channels[name]?.value);
        if (!wasOpen && isOpen) next.roots[name] = this.current.index;
        if (!isOpen) delete next.roots[name];
      }
      this.port.replace(this.current);
      this.current = next;
      this.port.push(next);
    } else {
      this.current = next;
      this.port.replace(next);
    }
    this.emit();
  }
  back = () => {
    this.flush();
    if (!this.canBack()) return false;
    this.port.go(-1);
    return true;
  };
  scroll(y: number) {
    if (this.pending.size || this.current.scroll === y) return;
    this.current = { ...this.current, scroll: y };
  }
  persistScroll() {
    this.port.replace(this.current);
  }
  destroy() {
    this.stop();
    this.listeners.clear();
  }
}
