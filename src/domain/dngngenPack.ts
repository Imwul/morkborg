/** A local, user-supplied snapshot. This module contains no source vocabulary. */
export const DNGNGEN_POOL_ROLES = ['A', 'B', 'C', 'D'] as const;
export type DngngenPoolRole = (typeof DNGNGEN_POOL_ROLES)[number];
export type DngngenValue = string | number;
export type DngngenValueRecipe =
  | { readonly op: 'literal'; readonly value: DngngenValue }
  | { readonly op: 'int'; readonly min: number; readonly max: number }
  | { readonly op: 'sample'; readonly values: readonly DngngenValue[] }
  | { readonly op: 'sum'; readonly terms: readonly DngngenValueRecipe[] };
export type DngngenTemplatePart =
  | { readonly type: 'text'; readonly text: string }
  | {
      readonly type: 'value';
      readonly name: string;
      readonly format?: 'text' | 'message';
    }
  | { readonly type: 'message'; readonly id: string }
  | {
      readonly type: 'select';
      readonly name: string;
      readonly cases: Readonly<Record<string, readonly DngngenTemplatePart[]>>;
      readonly other: readonly DngngenTemplatePart[];
    };
export interface DngngenEntry {
  readonly id: string;
  readonly messageId: string;
  /** Source evaluation order, including zero-draw values, is preserved. */
  readonly values: readonly {
    readonly name: string;
    readonly recipe: DngngenValueRecipe;
  }[];
}
export interface DngngenPack {
  readonly format: 'reference-desk.dngngen';
  readonly version: 1;
  readonly profile: 'dngngen-1.0.0' | 'synthetic';
  readonly source: {
    readonly project: string;
    readonly author: string;
    readonly url: string;
    readonly attribution: string;
  };
  readonly snapshot: {
    readonly id: string;
    readonly version: string;
    readonly auditedAt: string;
  };
  readonly pools: Readonly<Record<DngngenPoolRole, readonly DngngenEntry[]>>;
  readonly messages: Readonly<Record<string, readonly DngngenTemplatePart[]>>;
  readonly integrity: {
    readonly algorithm: 'sha256';
    readonly payloadSha256: string;
    readonly poolCounts: Readonly<Record<DngngenPoolRole, number>>;
  };
}

export class DngngenPackError extends Error {
  constructor(readonly code: string) {
    // Do not include file paths, source text or identifiers in endpoint errors.
    super(`Private DNGNGEN pack is invalid (${code}).`);
    this.name = 'DngngenPackError';
  }
}
function fail(code: string): never {
  throw new DngngenPackError(code);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('object');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail('object');
  return value as Record<string, unknown>;
}
function shape(value: unknown, required: string[], optional: string[] = []) {
  const object = record(value);
  if (
    required.some((key) => !Object.hasOwn(object, key)) ||
    Object.keys(object).some(
      (key) => !required.includes(key) && !optional.includes(key),
    )
  )
    fail('fields');
  return object;
}
function text(value: unknown, maximum = 20000): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum)
    fail('text');
}
function identifier(value: unknown): asserts value is string {
  text(value, 200);
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_.:+-]*$/.test(value) ||
    ['__proto__', 'constructor', 'prototype'].includes(value)
  )
    fail('identifier');
}
function integer(value: unknown): asserts value is number {
  if (!Number.isSafeInteger(value)) fail('integer');
}
function scalar(value: unknown): asserts value is DngngenValue {
  if (typeof value === 'string') text(value);
  else integer(value);
}
function list(value: unknown, max = 4096): unknown[] {
  if (!Array.isArray(value) || !value.length || value.length > max)
    fail('array');
  return value;
}
function numericBounds(recipe: DngngenValueRecipe): [number, number] {
  switch (recipe.op) {
    case 'literal':
      return [recipe.value as number, recipe.value as number];
    case 'int':
      return [recipe.min, recipe.max];
    case 'sample':
      return [
        Math.min(...(recipe.values as number[])),
        Math.max(...(recipe.values as number[])),
      ];
    case 'sum': {
      const bounds = recipe.terms.map(numericBounds);
      return bounds.reduce<[number, number]>(
        (sum, term) => {
          const next: [number, number] = [sum[0] + term[0], sum[1] + term[1]];
          if (!next.every(Number.isSafeInteger)) fail('sum-range');
          return next;
        },
        [0, 0],
      );
    }
  }
}
function validateRecipe(value: unknown, depth = 0): boolean {
  if (depth > 4) fail('recipe-depth');
  const object = record(value);
  switch (object.op) {
    case 'literal':
      shape(value, ['op', 'value']);
      scalar(object.value);
      return typeof object.value === 'number';
    case 'int':
      shape(value, ['op', 'min', 'max']);
      integer(object.min);
      integer(object.max);
      if (
        object.max < object.min ||
        !Number.isSafeInteger(object.max - object.min + 1) ||
        Math.abs(object.min) > 1e9 ||
        Math.abs(object.max) > 1e9
      )
        fail('integer-range');
      return true;
    case 'sample': {
      shape(value, ['op', 'values']);
      const values = list(object.values);
      values.forEach(scalar);
      return values.every((item) => typeof item === 'number');
    }
    case 'sum':
      shape(value, ['op', 'terms']);
      if (
        !list(object.terms, 32).every((term) => validateRecipe(term, depth + 1))
      )
        fail('sum-nonnumeric');
      if (
        !numericBounds(value as DngngenValueRecipe).every(Number.isSafeInteger)
      )
        fail('sum-range');
      return true;
    default:
      return fail('unsupported-recipe');
  }
}
function validateParts(value: unknown, depth = 0): void {
  if (depth > 8) fail('template-depth');
  if (!Array.isArray(value) || value.length > 2048) fail('template');
  for (const part of value) {
    const object = record(part);
    switch (object.type) {
      case 'text':
        shape(part, ['type', 'text']);
        if (typeof object.text !== 'string' || object.text.length > 20000)
          fail('template-text');
        break;
      case 'value':
        shape(part, ['type', 'name'], ['format']);
        identifier(object.name);
        if (
          object.format !== undefined &&
          object.format !== 'text' &&
          object.format !== 'message'
        )
          fail('format');
        break;
      case 'message':
        shape(part, ['type', 'id']);
        identifier(object.id);
        break;
      case 'select': {
        shape(part, ['type', 'name', 'cases', 'other']);
        identifier(object.name);
        const cases = record(object.cases);
        if (Object.keys(cases).length > 256) fail('select-cases');
        for (const [key, parts] of Object.entries(cases)) {
          if (
            !key ||
            key.length > 200 ||
            ['__proto__', 'constructor', 'prototype'].includes(key)
          )
            fail('select-case');
          validateParts(parts, depth + 1);
        }
        validateParts(object.other, depth + 1);
        break;
      }
      default:
        fail('unsupported-template');
    }
  }
}
function walkParts(
  parts: readonly DngngenTemplatePart[],
  visit: (part: DngngenTemplatePart) => void,
) {
  for (const part of parts) {
    visit(part);
    if (part.type === 'select') {
      Object.values(part.cases).forEach((branch) => walkParts(branch, visit));
      walkParts(part.other, visit);
    }
  }
}
function messageValues(recipe: DngngenValueRecipe): readonly DngngenValue[] {
  if (recipe.op === 'literal') return [recipe.value];
  if (recipe.op === 'sample') return recipe.values;
  return fail('message-value-recipe');
}
function validateDependencies(pack: DngngenPack) {
  // Check even unused messages for missing static dependencies and cycles.
  const checked = new Set<string>();
  function staticVisit(id: string, active: Set<string>) {
    if (!Object.hasOwn(pack.messages, id)) fail('missing-template');
    if (active.has(id)) fail('template-cycle');
    if (checked.has(id)) return;
    const next = new Set(active).add(id);
    walkParts(pack.messages[id], (part) => {
      if (part.type === 'message') staticVisit(part.id, next);
    });
    checked.add(id);
  }
  Object.keys(pack.messages).forEach((id) => staticVisit(id, new Set()));
  for (const entry of Object.values(pack.pools).flat()) {
    const recipes = new Map(
      entry.values.map((value) => [value.name, value.recipe]),
    );
    const resolved = new Set<string>();
    function visit(id: string, active: Set<string>) {
      if (!Object.hasOwn(pack.messages, id)) fail('missing-template');
      if (active.has(id)) fail('template-cycle');
      if (resolved.has(id)) return;
      if (active.size > 32) fail('template-depth');
      const next = new Set(active).add(id);
      walkParts(pack.messages[id], (part) => {
        if (part.type === 'message') visit(part.id, next);
        if (part.type === 'value' || part.type === 'select') {
          const recipe = recipes.get(part.name);
          if (!recipe) fail('missing-variable');
          if (part.type === 'value' && part.format === 'message') {
            for (const target of messageValues(recipe)) {
              if (typeof target !== 'string') fail('message-value');
              visit(target, next);
            }
          }
        }
      });
      resolved.add(id);
    }
    visit(entry.messageId, new Set());
  }
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
/** Stable object keys; array order and repeated positions remain significant. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`,
      )
      .join(',')}}`;
  return JSON.stringify(value);
}
/** The private host verifies SHA-256 of this UTF-8 string, without browser crypto. */
export function dngngenPackPayload(pack: DngngenPack): string {
  const { payloadSha256: _digest, ...integrity } = pack.integrity;
  return stableJson({ ...pack, integrity });
}
/** Validates data, not licensing. No source execution, network request or RNG. */
export function parseDngngenPack(
  input: unknown,
  options: { allowSynthetic?: boolean } = {},
): DngngenPack {
  try {
    const raw = shape(input, [
      'format',
      'version',
      'profile',
      'source',
      'snapshot',
      'pools',
      'messages',
      'integrity',
    ]);
    if (raw.format !== 'reference-desk.dngngen' || raw.version !== 1)
      fail('format-version');
    if (
      raw.profile !== 'dngngen-1.0.0' &&
      !(raw.profile === 'synthetic' && options.allowSynthetic)
    )
      fail('snapshot-profile');
    const source = shape(raw.source, [
      'project',
      'author',
      'url',
      'attribution',
    ]);
    Object.values(source).forEach((value) => text(value));
    const url = new URL(source.url as string);
    if (url.protocol !== 'https:' || url.username || url.password)
      fail('source-url');
    const snapshot = shape(raw.snapshot, ['id', 'version', 'auditedAt']);
    identifier(snapshot.id);
    text(snapshot.version, 100);
    text(snapshot.auditedAt, 10);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.auditedAt) ||
      new Date(snapshot.auditedAt).toISOString().slice(0, 10) !==
        snapshot.auditedAt
    )
      fail('snapshot-date');
    if (raw.profile === 'dngngen-1.0.0' && snapshot.version !== '1.0.0')
      fail('snapshot-version');
    const pools = shape(raw.pools, [...DNGNGEN_POOL_ROLES]);
    const integrity = shape(raw.integrity, [
      'algorithm',
      'payloadSha256',
      'poolCounts',
    ]);
    if (
      integrity.algorithm !== 'sha256' ||
      typeof integrity.payloadSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(integrity.payloadSha256)
    )
      fail('integrity');
    const counts = shape(integrity.poolCounts, [...DNGNGEN_POOL_ROLES]);
    const byId = new Map<string, string>();
    let positions = 0;
    for (const role of DNGNGEN_POOL_ROLES) {
      const entries = list(pools[role]);
      positions += entries.length;
      if (counts[role] !== entries.length) fail('pool-count');
      if (
        raw.profile === 'dngngen-1.0.0' &&
        entries.length !== { A: 39, B: 39, C: 34, D: 34 }[role]
      )
        fail('snapshot-count');
      for (const value of entries) {
        const entry = shape(value, ['id', 'messageId', 'values']);
        identifier(entry.id);
        identifier(entry.messageId);
        if (!Array.isArray(entry.values) || entry.values.length > 32)
          fail('values');
        const names = new Set<string>();
        for (const variable of entry.values) {
          const named = shape(variable, ['name', 'recipe']);
          identifier(named.name);
          if (names.has(named.name)) fail('duplicate-variable');
          names.add(named.name);
          validateRecipe(named.recipe);
        }
        const serialized = stableJson(entry);
        if (byId.has(entry.id) && byId.get(entry.id) !== serialized)
          fail('conflicting-entry-id');
        byId.set(entry.id, serialized);
      }
    }
    if (positions > 8192) fail('pool-size');
    if (raw.profile === 'dngngen-1.0.0' && byId.size !== 146)
      fail('snapshot-ids');
    const messages = record(raw.messages);
    if (!Object.keys(messages).length || Object.keys(messages).length > 8192)
      fail('messages');
    for (const [id, parts] of Object.entries(messages)) {
      identifier(id);
      validateParts(parts);
    }
    const pack = raw as unknown as DngngenPack;
    validateDependencies(pack);
    // Isolate callers' raw JSON from runtime data; never freeze a caller-owned object.
    return deepFreeze(structuredClone(pack));
  } catch (error) {
    if (error instanceof DngngenPackError) throw error;
    return fail('malformed');
  }
}
