/** Offline, snapshot-specific conversion. Never evaluates imported JavaScript. */
import ts from 'typescript';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, lstat, mkdir, realpath, writeFile, rename, copyFile, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DNGNGEN_POOL_ROLES, dngngenPackPayload, parseDngngenPack,
  type DngngenEntry, type DngngenPack, type DngngenTemplatePart,
  type DngngenValue, type DngngenValueRecipe } from '../src/domain/dngngenPack.js';
import { readPrivateDngngenPack } from './privateDngngenPack.js';

export const AUDITED_MAP_SHA256 = 'b2805f31a42624d767c2fc5a7441b8bd271b1d7afbea05ea41e2f39f16f84d24';
const TABLE_MODULE = 'roll/Room/tables/index.tsx';
const EN_MODULE = 'translations/en_US/dungeon/rooms.json';
const sha = (input: string | Buffer) => createHash('sha256').update(input).digest('hex');
export class DngngenImportError extends Error {
  constructor(readonly code: string) { super(`Local DNGNGEN import stopped (${code}).`); }
}
const fail = (code: string): never => { throw new DngngenImportError(code); };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('object');
  return value as Record<string, unknown>;
}
function json(text: string): unknown { try { return JSON.parse(text); } catch { return fail('malformed-json'); } }
function ast(text: string) {
  const file = ts.createSourceFile('snapshot.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if ((file as ts.SourceFile & { parseDiagnostics: readonly unknown[] }).parseDiagnostics.length) fail('source-syntax');
  return file;
}
function unwrap(node: ts.Expression): ts.Expression {
  return ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) ? unwrap(node.expression) : node;
}
function literal(node: ts.Expression): DngngenValue {
  node = unwrap(node);
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node) && Number.isSafeInteger(Number(node.text))) return Number(node.text);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return -Number(node.operand.text);
  return fail('unsupported-literal');
}
function recipe(node: ts.Expression): DngngenValueRecipe {
  node = unwrap(node);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken)
    return { op: 'sum', terms: [recipe(node.left), recipe(node.right)] };
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const args = node.arguments;
    if (node.expression.text === 'random' && args.length === 2) {
      const min = literal(args[0]), max = literal(args[1]);
      if (typeof min !== 'number' || typeof max !== 'number') return fail('integer-range');
      return { op: 'int', min, max };
    }
    if (node.expression.text === 'sample' && args.length === 1 && ts.isArrayLiteralExpression(args[0]))
      return { op: 'sample', values: args[0].elements.map(literal) };
  }
  return { op: 'literal', value: literal(node) };
}
function properties(node: ts.Expression): Map<string, ts.Expression> {
  node = unwrap(node);
  if (!ts.isObjectLiteralExpression(node)) return fail('source-object');
  const result = new Map<string, ts.Expression>();
  for (const p of node.properties) {
    if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) return fail('source-property');
    if (result.has(p.name.text)) fail('duplicate-property');
    result.set(p.name.text, p.initializer);
  }
  return result;
}
export function extractDngngenPools(text: string): DngngenPack['pools'] {
  const file = ast(text);
  const declarations = new Map<string, ts.Expression>();
  for (const statement of file.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (!ts.isStringLiteral(statement.moduleSpecifier) ||
          !['types/dungeon', 'lodash/fp/random', 'lodash/fp/sample'].includes(statement.moduleSpecifier.text)) fail('source-import');
    } else if (ts.isVariableStatement(statement)) {
      for (const d of statement.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !d.initializer || declarations.has(d.name.text)) return fail('source-declaration');
        declarations.set(d.name.text, d.initializer);
      }
    } else if (!ts.isExportAssignment(statement)) fail('unsupported-source-statement');
  }
  if ([...declarations.keys()].some(name => !['description', 'descriptionWithValues', 'TableA', 'TableB', 'TableC', 'TableD', 'TableAB', 'TableCD'].includes(name))) fail('unknown-declaration');
  const pools = {} as Record<'A' | 'B' | 'C' | 'D', DngngenEntry[]>;
  for (const role of DNGNGEN_POOL_ROLES) {
    const table = declarations.get(`Table${role}`);
    if (!table) return fail('missing-pool');
    const fields = properties(table), result = fields.get('results');
    if (fields.size !== 2 || !fields.has('id') || !result || !ts.isArrayLiteralExpression(result)) return fail('pool-shape');
    pools[role] = result.elements.map(node => {
      if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return fail('entry-shape');
      const name = node.expression.text;
      if (!['description', 'descriptionWithValues'].includes(name) || node.arguments.length !== (name === 'description' ? 1 : 2)) return fail('entry-call');
      const id = literal(node.arguments[0]);
      if (typeof id !== 'string') return fail('entry-id');
      const values: DngngenEntry['values'][number][] = [];
      if (name === 'descriptionWithValues') {
        const fn = node.arguments[1];
        if (!ts.isArrowFunction(fn) || fn.parameters.length || ts.isBlock(fn.body)) return fail('value-function');
        for (const [name, expression] of properties(fn.body)) values.push({ name, recipe: recipe(expression) });
      }
      return { id, messageId: `room.details.${id}`, values };
    });
  }
  for (const [name, roles] of [['TableAB', ['A', 'B']], ['TableCD', ['C', 'D']]] as const) {
    const decl = declarations.get(name);
    if (!decl) return fail('missing-composed-view');
    const results = properties(decl).get('results');
    if (!results || !ts.isArrayLiteralExpression(results) || results.elements.length !== 2) return fail('composed-view');
    results.elements.forEach((node, i) => {
      if (!ts.isSpreadElement(node) || !ts.isPropertyAccessExpression(node.expression) ||
          !ts.isIdentifier(node.expression.expression) || node.expression.expression.text !== `Table${roles[i]}` || node.expression.name.text !== 'results') fail('composed-order');
    });
  }
  return pools;
}

/** Small ICU subset supported by this pack: literal text, arguments and selects.
 * Unknown ICU/HTML syntax fails closed; no guessed formatting or source execution. */
function recipeDomain(recipe: DngngenValueRecipe): DngngenValue[] {
  if (recipe.op === 'literal') return [recipe.value];
  if (recipe.op === 'sample') return [...recipe.values];
  if (recipe.op === 'int') {
    if (recipe.max - recipe.min > 4096) return fail('format-domain-size');
    return Array.from({length:recipe.max-recipe.min+1}, (_,i)=>recipe.min+i);
  }
  let sums=[0];
  for(const term of recipe.terms) {
    const values=recipeDomain(term);
    if(values.some(value=>typeof value !== 'number') || sums.length*values.length>8192) fail('format-domain-size');
    sums=[...new Set(sums.flatMap(sum=>values.map(value=>sum+Number(value))))];
  }
  return sums;
}
function plainSourceMarkup(input: string): string {
  // The audited room dictionary uses only italic emphasis and an HTML link.
  // Keep source words and link destination in plain-text output; never execute HTML.
  let output=input.replace(/<i>([\s\S]*?)<\/i>/g,'$1');
  output=output.replace(/<a\s+([^>]+)>([\s\S]*?)<\/a>/g,(_all,attributes:string,label:string)=>{
    const href=attributes.match(/\bhref=["']([^"']+)["']/)?.[1];
    if(!href) return fail('unsupported-message-markup');
    const url=new URL(href);
    if(!['https:','http:'].includes(url.protocol) || url.username || url.password) return fail('unsupported-message-link');
    const rest=attributes.replace(/\b(href|target|rel)=["'][^"']*["']/g,'').trim();
    if(rest) return fail('unsupported-message-markup');
    return `${label} (${href})`;
  });
  return output;
}
export function parseDngngenMessage(input: string, options: { auditedFormatting?: boolean; entry?: DngngenEntry } = {}): DngngenTemplatePart[] {
  if (options.auditedFormatting) input=plainSourceMarkup(input);
  if (input.length > 20000) fail('message-size');
  let at = 0;
  const spaces = () => { while (/\s/.test(input[at] ?? '') && at < input.length) at++; };
  const token = () => { spaces(); const start = at; while (at < input.length && !/[\s,{}]/.test(input[at])) at++; if (at === start) fail('message-token'); return input.slice(start, at); };
  function parts(nested: boolean, depth = 0): DngngenTemplatePart[] {
    if (depth > 8) return fail('message-depth');
    const result: DngngenTemplatePart[] = []; let text = '';
    const flush = () => { if (text) { result.push({ type: 'text', text }); text = ''; } };
    while (at < input.length) {
      const c = input[at++];
      if (c === '}') { if (!nested) fail('message-brace'); flush(); return result; }
      if (c === "'") {
        if (input[at] === "'") { text += "'"; at++; continue; }
        if (['{', '}'].includes(input[at])) {
          let closed = false;
          while (at < input.length) {
            const char = input[at++];
            if (char === "'") { if (input[at] === "'") { text += "'"; at++; } else { closed = true; break; } }
            else text += char;
          }
          if (!closed) fail('message-quote');
          continue;
        }
        text += c; continue;
      }
      if (c !== '{') { text += c; continue; }
      flush(); const name = token(); spaces();
      if (input[at] === '}') { at++; result.push({ type: 'value', name }); continue; }
      if (input[at++] !== ',') fail('unsupported-message-format');
      const format=token();
      if (format !== 'select' && !(options.auditedFormatting && format === 'plural')) fail('unsupported-message-format');
      spaces(); if (input[at++] !== ',') fail('message-select');
      const cases: Record<string, DngngenTemplatePart[]> = Object.create(null);
      while (true) {
        spaces(); if (input[at] === '}') { at++; break; }
        const key = token(); spaces();
        if (Object.hasOwn(cases, key) || input[at++] !== '{') fail('message-case');
        cases[key] = parts(true, depth + 1);
      }
      const variable=options.entry?.values.find(value=>value.name===name)?.recipe;
      if (format === 'plural') {
        if (!variable || !Object.hasOwn(cases,'other')) return fail('plural-domain-or-fallback');
        const domain=recipeDomain(variable), selected:Record<string,DngngenTemplatePart[]>=Object.create(null);
        const plural=new Intl.PluralRules('en-US');
        for(const value of domain) {
          if(typeof value !== 'number' || !Number.isInteger(value)) return fail('plural-domain');
          selected[String(value)]=cases[`=${value}`] ?? cases[plural.select(value)] ?? cases.other;
        }
        result.push({type:'select',name,cases:selected,other:cases.other});
      } else {
        if (!Object.hasOwn(cases, 'other')) {
          if (!options.auditedFormatting || !variable || recipeDomain(variable).some(value=>!Object.hasOwn(cases,String(value)))) fail('missing-explicit-fallback');
          // All possible source sample values have branches: fallback is unreachable.
          cases.other=[];
        }
        const { other, ...rest } = cases;
        result.push({ type: 'select', name, cases: rest, other });
      }
    }
    if (nested) fail('message-brace'); flush(); return result;
  }
  // Plain-text output preserves emphasis content. Unknown markup is not silently discarded.
  if (/<|&(?:[a-zA-Z]+|#\d+);/.test(input)) fail('unsupported-message-markup');
  return parts(false);
}

export function importDngngenSnapshot(bytes: Buffer, options: { synthetic?: boolean } = {}) {
  if (bytes.length > 16_000_000) fail('snapshot-size');
  const raw = object(json(bytes.toString('utf8')));
  const envelope = raw.format === 'reference-desk.dngngen-source-snapshot';
  if (envelope && (raw.version !== 1 || raw.sourceVersion !== '1.0.0' || typeof raw.sourceMap !== 'string')) fail('unsupported-source-version');
  const mapText = envelope ? raw.sourceMap as string : bytes.toString('utf8');
  const map = object(json(mapText)), mapHash = sha(mapText);
  if (map.version !== 3 || !Array.isArray(map.sources) || !Array.isArray(map.sourcesContent) || map.sources.length !== map.sourcesContent.length ||
      !map.sources.every(x => typeof x === 'string') || !map.sourcesContent.every(x => typeof x === 'string' || x === null) || new Set(map.sources).size !== map.sources.length) fail('source-map-shape');
  if (!options.synthetic && mapHash !== AUDITED_MAP_SHA256) fail('unsupported-source-snapshot');
  if (options.synthetic && (!envelope || raw.synthetic !== true)) fail('synthetic-marker');
  const sources = map.sources as string[], contents = map.sourcesContent as (string | null)[];
  const source = contents[sources.indexOf(TABLE_MODULE)];
  if (typeof source !== 'string') return fail('missing-room-module');
  const pools = extractDngngenPools(source);
  const variableEntries = Object.values(pools).flat().filter(entry => entry.values.length).length;
  if (!options.synthetic && variableEntries !== 32) fail('variable-entry-count');
  let messagesInput = raw.englishMessages;
  if (!envelope) {
    const en = contents[sources.indexOf(EN_MODULE)];
    if (typeof en === 'string') messagesInput = json(en);
  }
  if (!messagesInput) fail('missing-english-message-dependencies');
  const dictionary = object(messagesInput);
  const messages: Record<string, readonly DngngenTemplatePart[]> = Object.create(null);
  const visiting = new Set<string>();
  function add(id: string, entry: DngngenEntry) {
    if (!Object.hasOwn(dictionary, id)) fail('missing-message-dependency');
    if (visiting.has(id)) fail('message-cycle');
    visiting.add(id);
    const value = dictionary[id];
    // Structured parts are an explicit local formatting supplement, never evaluated code.
    const parsed = typeof value === 'string' ? parseDngngenMessage(value, {auditedFormatting: !options.synthetic, entry}) : value;
    if (!Array.isArray(parsed)) fail('message-shape');
    messages[id] = parsed as DngngenTemplatePart[];
    function scan(parts: readonly DngngenTemplatePart[]) {
      for (const part of parts) {
        if (part?.type === 'message') add(part.id, entry);
        else if (part?.type === 'value' && part.format === 'message') {
          const recipe = entry.values.find(v => v.name === part.name)?.recipe;
          const ids = recipe?.op === 'sample' ? recipe.values : recipe?.op === 'literal' ? [recipe.value] : fail('message-value-recipe');
          for (const target of ids) { if (typeof target !== 'string') fail('message-value-id'); add(target as string, entry); }
        } else if (part?.type === 'select') {
          if (!part.cases || !Array.isArray(part.other)) fail('message-select');
          for (const branch of Object.values(part.cases)) { if (!Array.isArray(branch)) fail('message-select'); scan(branch); }
          scan(part.other);
        }
      }
    }
    scan(messages[id]); visiting.delete(id);
  }
  for (const entry of Object.values(pools).flat()) add(entry.messageId, entry);
  const poolCounts = Object.fromEntries(DNGNGEN_POOL_ROLES.map(role => [role, pools[role].length])) as DngngenPack['integrity']['poolCounts'];
  const pack: DngngenPack = {
    format: 'reference-desk.dngngen', version: 1, profile: options.synthetic ? 'synthetic' : 'dngngen-1.0.0',
    source: options.synthetic ? { project: 'Synthetic importer test', author: 'Test fixture', url: 'https://example.invalid', attribution: 'Invented test data, not DNGNGEN content.' } :
      { project: 'DNGNGEN', author: 'Karl Druid', url: 'https://dngngen.makedatanotlore.dev/', attribution: 'DNGNGEN by Karl Druid. Private local snapshot; not an official integration. Redistribution rights remain unclear.' },
    snapshot: { id: `${options.synthetic ? 'synthetic' : 'dngngen'}-${sha(bytes).slice(0, 24)}`, version: options.synthetic ? 'test-1' : '1.0.0', auditedAt: '2026-09-20' },
    pools, messages, integrity: { algorithm: 'sha256', payloadSha256: '0'.repeat(64), poolCounts },
  };
  const sealed = { ...pack, integrity: { ...pack.integrity, payloadSha256: sha(dngngenPackPayload(pack)) } };
  const validated = parseDngngenPack(sealed, { allowSynthetic: options.synthetic });
  return { pack: validated, inputSha256: sha(bytes), sourceMapSha256: mapHash, variableEntries,
    dependencyCount: Object.keys(messages).length, totalPositions: Object.values(pools).flat().length,
    uniqueIds: new Set(Object.values(pools).flat().map(entry => entry.id)).size };
}

export function localSnapshotPath(input: string): string {
  if (!input || /^[a-z][a-z\d+.-]*:/i.test(input) || input.startsWith('//') || input.includes('\0')) return fail('local-file-required');
  return resolve(input);
}
export async function writeImportedPack(root: string, pack: DngngenPack, output = 'private/dngngen/pack.json') {
  const base = await realpath(root), target = resolve(base, output), rel = relative(base, target);
  if (!rel.startsWith('private/') || !target.endsWith('.json')) fail('private-output-required');
  for (const path of [join(base, 'private'), ...rel.split('/').slice(1).map((_, i) => join(base, ...rel.split('/').slice(0, i + 2)))]) {
    try { if ((await lstat(path)).isSymbolicLink()) fail('output-symlink'); }
    catch (e) { if (!(e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT')) throw e; }
  }
  try {
    execFileSync('git', ['check-ignore', '--quiet', '--no-index', rel], { cwd: base });
    if (execFileSync('git', ['ls-files', '--', rel], { cwd: base, encoding: 'utf8' }).trim()) fail('tracked-output');
  } catch { fail('output-must-be-ignored-untracked'); }
  parseDngngenPack(pack, { allowSynthetic: pack.profile === 'synthetic' });
  if (sha(dngngenPackPayload(pack)) !== pack.integrity.payloadSha256) fail('checksum');
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  const temp = `${target}.${randomUUID()}.tmp`;
  let backup: string | undefined;
  try {
    await writeFile(temp, JSON.stringify(pack, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    if ((await readPrivateDngngenPack(temp, pack.profile === 'synthetic')).status !== 'ready') fail('written-validation');
    try {
      await lstat(target);
      // Backup both valid and invalid previous input; no source text enters logs.
      const existing = await readPrivateDngngenPack(target, true);
      backup = `${target}.${new Date().toISOString().replace(/[:.]/g, '-')}.${existing.status}.${randomUUID()}.bak`;
      await copyFile(target, backup, constants.COPYFILE_EXCL);
    } catch (e) { if (!(e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT')) throw e; }
    await rename(temp, target);
    return { output: rel, backup: backup ? relative(base, backup) : undefined, validation: 'valid' };
  } finally { await unlink(temp).catch(() => {}); }
}
export async function importLocalDngngenFile(root: string, input: string) {
  const path = localSnapshotPath(input), stat = await lstat(path);
  if (!stat.isFile() || stat.size > 16_000_000) fail('local-file-required');
  const imported = importDngngenSnapshot(await readFile(path));
  const result = await writeImportedPack(root, imported.pack);
  return { input: path, inputSha256: imported.inputSha256, sourceMapSha256: imported.sourceMapSha256,
    profile: imported.pack.profile, version: imported.pack.snapshot.version, poolCounts: imported.pack.integrity.poolCounts,
    positions: imported.totalPositions, uniqueIds: imported.uniqueIds, variableEntries: imported.variableEntries,
    dependencyCount: imported.dependencyCount, payloadSha256: imported.pack.integrity.payloadSha256, ...result };
}
