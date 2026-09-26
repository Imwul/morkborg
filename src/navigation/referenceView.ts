/** Transient DOM presentation only. No dungeon state, result history or stored records. */
export interface ReferenceView {
  details: { path: string; open: boolean }[];
  focus?: string;
}
function elementPath(root: Element, element: Element): string | undefined {
  if (root === element) return;
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== root) {
    const parent: Element | null = node.parentElement;
    if (!parent) return;
    parts.unshift(
      `${node.localName}:nth-child(${Array.from(parent.children).indexOf(node) + 1})`,
    );
    node = parent;
  }
  return node === root ? ':scope > ' + parts.join(' > ') : undefined;
}
export function captureReferenceView(root: HTMLElement): ReferenceView {
  return {
    details: Array.from(root.querySelectorAll('details')).map((el) => ({
      path: elementPath(root, el)!,
      open: el.open,
    })),
    focus: document.activeElement
      ? elementPath(root, document.activeElement)
      : undefined,
  };
}
export function restoreReferenceView(root: HTMLElement, view: ReferenceView) {
  for (const detail of view.details) {
    const el = root.querySelector<HTMLDetailsElement>(detail.path);
    if (el?.tagName === 'DETAILS') el.open = detail.open;
  }
  if (view.focus)
    root.querySelector<HTMLElement>(view.focus)?.focus({ preventScroll: true });
}
