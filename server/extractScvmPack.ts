import ts from 'typescript';
import {
  parseScvmPack,
  scvmPackPayload,
  SCVM_URL,
  type ScvmPack,
} from '../src/domain/scvmPack.js';
import { acquireFail, fetchOfficial, officialScript, sha256 } from './officialAcquire.js';

const ORIGIN = 'https://scvmbirther.makedatanotlore.dev';
const ANCHORS = [
  'const characterTale = (random(1, 10) > 8 && rollTale(tables.tales)) ?? {};',
  "const dieWithScroll = die < 'd6' ? die : 'd6';",
  "const dieWithScroll = 'd2';",
];

export async function acquireScvmPack(fetcher = fetchOfficial): Promise<ScvmPack> {
  const pageUrl = new URL(ORIGIN + '/');
  const page = await fetcher(ORIGIN, pageUrl, 200_000);
  const script = officialScript(page, ORIGIN);
  const bundle = await fetcher(ORIGIN, script, 2_000_000);
  const mapUrl = new URL(script.pathname + '.map', ORIGIN);
  const mapText = await fetcher(ORIGIN, mapUrl, 8_000_000);
  const map = JSON.parse(mapText) as { sources?: string[]; sourcesContent?: (string | null)[] };
  const sources = (map.sources ?? []).map((source, index) => map.sourcesContent?.[index] ?? '');
  if (ANCHORS.some((anchor) => !sources.some((source) => source.includes(anchor))))
    acquireFail('algorithm-drift');
  const pack = buildScvmPack(bundle, sha256(bundle));
  parseScvmPack(pack);
  auditScvmMessages(pack);
  if (sha256(scvmPackPayload(pack)) !== pack.integrity.payloadSha256)
    acquireFail('checksum');
  return pack;
}

export function buildScvmPack(bundle: string, bundleSha: string): ScvmPack {
  const file = ts.createSourceFile('scvm.js', bundle, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if ((file as ts.SourceFile & { parseDiagnostics?: readonly unknown[] }).parseDiagnostics?.length)
    acquireFail('asset-syntax');
  const catalogs: Record<string, string>[] = [];
  const resolvedTables = findTables(file);
  for (const node of calls(file)) {
    const value = jsonCall(node);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (Object.values(record).every((item) => typeof item === 'string'))
        catalogs.push(record as Record<string, string>);
    }
  }
  const english = catalogs.find(
    (catalog) => catalog['character.classes.fanged-deserter'] === 'Fanged Deserter',
  );
  if (!english) acquireFail('missing-english-catalog');
  const version = english['app.version'];
  if (!version) acquireFail('missing-version');
  const vanilla = resolvedTables.vanilla;
  const homebrew = resolvedTables.homebrew;
  const classCount = countClasses(vanilla);
  const homebrewClassCount = countClasses(homebrew);
  if (classCount < 1 || homebrewClassCount < classCount) acquireFail('class-tables');
  const draft = {
    format: 'reference-desk.scvmbirther' as const,
    version: 1 as const,
    profile: 'scvmbirther-1' as const,
    source: {
      project: 'SCVMBIRTHER',
      author: 'Karl Druid',
      url: SCVM_URL,
      attribution:
        'SCVMBIRTHER by Karl Druid. Private local snapshot; not an official integration.',
    },
    snapshot: {
      id: `scvmbirther-${bundleSha.slice(0, 24)}`,
      version,
      auditedAt: new Date().toISOString().slice(0, 10),
    },
    messages: english,
    tables: {
      vanilla: vanilla as ScvmPack['tables']['vanilla'],
      homebrew: homebrew as ScvmPack['tables']['homebrew'],
    },
    integrity: {
      payloadSha256: '',
      messageCount: Object.keys(english).length,
      classCount,
      homebrewClassCount,
    },
  };
  draft.integrity.payloadSha256 = sha256(scvmPackPayload(draft));
  return draft;
}

function auditScvmMessages(pack: ScvmPack) {
  const missing = new Set<string>();
  const need = (id: string) => {
    if (id.includes('.') && pack.messages[id] === undefined) missing.add(id);
  };
  const walk = (value: unknown) => {
    if (typeof value === 'string') need(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(pack.tables);
  for (const tables of [pack.tables.vanilla, pack.tables.homebrew]) {
    for (const row of tables.classes) {
      for (const value of row) {
        if (!value || typeof value !== 'object') continue;
        const entry = value as { name?: string; origins?: { min: number; max: number; secondMin?: number; secondMax?: number }; powers?: { table: unknown[][] }; specials?: { id?: string; variants?: string[] }[] };
        if (!entry.name) continue;
        need(`character.classes.${entry.name}`);
        need(`character.classes.${entry.name}.origin.appendix`);
        for (let index = entry.origins?.min ?? 1; index <= (entry.origins?.max ?? 0); index += 1)
          need(`character.classes.${entry.name}.origin.${index}.description`);
        if (entry.origins?.secondMin !== undefined && entry.origins.secondMax !== undefined)
          for (let index = entry.origins.secondMin; index <= entry.origins.secondMax; index += 1)
            need(`character.classes.${entry.name}.secondOrigin.${index}.description`);
        const powers = [...(entry.specials ?? []), ...(entry.powers?.table.flat() ?? [])] as { id?: string; variants?: string[] }[];
        for (const power of powers) {
          const ids = power.variants?.length ? power.variants : power.id ? [power.id] : [];
          for (const id of ids) {
            need(`character.classes.${entry.name}.power.${id}.title`);
            need(`character.classes.${entry.name}.power.${id}.description`);
          }
        }
      }
    }
  }
  if (missing.size) acquireFail(`missing-message:${[...missing].slice(0, 8).join(',')}`);
}
function countClasses(tables: { classes?: unknown }): number {
  if (!Array.isArray(tables.classes)) acquireFail('class-tables');
  return tables.classes.flat().filter((entry) => entry && typeof entry === 'object').length;
}
function calls(node: ts.Node): ts.CallExpression[] {
  const found: ts.CallExpression[] = [];
  const visit = (current: ts.Node) => {
    if (ts.isCallExpression(current)) found.push(current);
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
}
function jsonCall(node: ts.CallExpression): unknown {
  if (
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== 'parse' ||
    node.arguments.length !== 1 ||
    !ts.isStringLiteralLike(node.arguments[0])
  )
    return undefined;
  const raw = node.arguments[0].text;
  if (!raw.startsWith('{') && !raw.startsWith('[')) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    acquireFail('asset-json');
  }
}
function findTables(file: ts.SourceFile) {
  let found: ts.ObjectLiteralExpression | undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isObjectLiteralExpression(node) &&
      node.properties.some(
        (property) =>
          ts.isPropertyAssignment(property) &&
          property.name &&
          ts.isIdentifier(property.name) &&
          property.name.text === 'homebrew',
      )
    )
      found = node;
    if (!found) ts.forEachChild(node, visit);
  };
  visit(file);
  if (!found) acquireFail('missing-table-graph');
  const scope = containingFunction(found);
  const bindings = bindingsIn(scope);
  const resolved = resolveNode(found, bindings, new Set());
  if (!resolved || typeof resolved !== 'object' || Array.isArray(resolved))
    acquireFail('missing-table-graph');
  const tables = resolved as { vanilla?: unknown; homebrew?: unknown };
  if (!tables.vanilla || !tables.homebrew) acquireFail('missing-table-graph');
  return { vanilla: tables.vanilla, homebrew: tables.homebrew };
}
function containingFunction(node: ts.Node): ts.Node {
  let current: ts.Node | undefined = node.parent;
  while (current && !ts.isFunctionLike(current) && !ts.isSourceFile(current))
    current = current.parent;
  return current ?? node.getSourceFile();
}
function bindingsIn(scope: ts.Node) {
  const bindings = new Map<string, ts.Expression>();
  const visit = (node: ts.Node) => {
    if (node !== scope && ts.isFunctionLike(node)) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer)
      bindings.set(node.name.text, node.initializer);
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    )
      bindings.set(node.left.text, node.right);
    ts.forEachChild(node, visit);
  };
  visit(scope);
  return bindings;
}
function resolveNode(
  node: ts.Node,
  bindings: Map<string, ts.Expression>,
  seen: Set<string>,
): unknown {
  if (ts.isParenthesizedExpression(node)) return resolveNode(node.expression, bindings, seen);
  if (ts.isIdentifier(node)) {
    const next = bindings.get(node.text);
    if (!next) acquireFail(`unresolved-table:${node.text}`);
    if (seen.has(node.text)) acquireFail('table-cycle');
    seen.add(node.text);
    const value = resolveNode(next, bindings, seen);
    seen.delete(node.text);
    return value;
  }
  if (ts.isCallExpression(node)) {
    const parsed = jsonCall(node);
    if (parsed !== undefined) return parsed;
    if (
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'slice' &&
      node.arguments.length === 2 &&
      ts.isNumericLiteral(node.arguments[0]) &&
      ts.isNumericLiteral(node.arguments[1])
    ) {
      const array = resolveNode(node.expression.expression, bindings, seen);
      if (!Array.isArray(array)) acquireFail('table-slice');
      return array.slice(Number(node.arguments[0].text), Number(node.arguments[1].text));
    }
    acquireFail('unsupported-table-call');
  }
  if (ts.isObjectLiteralExpression(node)) {
    const value: Record<string, unknown> = {};
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spread = resolveNode(property.expression, bindings, seen);
        if (!spread || typeof spread !== 'object' || Array.isArray(spread))
          acquireFail('table-spread');
        Object.assign(value, spread);
        continue;
      }
      if (!ts.isPropertyAssignment(property)) acquireFail('table-property');
      const name = propertyName(property.name);
      value[name] = resolveNode(property.initializer, bindings, seen);
    }
    return value;
  }
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) acquireFail('table-spread');
      return resolveNode(element, bindings, seen);
    });
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text);
  acquireFail('unsupported-table-value');
}
function propertyName(name: ts.PropertyName) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  acquireFail('table-property');
}
