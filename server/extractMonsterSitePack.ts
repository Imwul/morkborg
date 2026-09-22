import ts from 'typescript';
import {
  MONSTER_SITE_URL,
  monsterSitePackPayload,
  parseMonsterSitePack,
  type MonsterSiteEntry,
  type MonsterSitePack,
} from '../src/domain/monsterSitePack.js';
import { acquireFail, fetchOfficial, officialScript, sha256 } from './officialAcquire.js';

const ORIGIN = 'https://monster.makedatanotlore.dev';
const ANCHORS: Record<string, string[]> = {
  'generator/index.js': [
    'const hp = damageDice.roll() * 2;',
    'return highest % 2 === 0 ? DICE.d4 : DICE.d6;',
  ],
  'generator/weaponsAndArmor.js': [
    'const shouldHaveName = random(1, 4) === 4;',
    'const shouldHavePrefix = random(1, 10) === 10 && !result?.noPrefix;',
  ],
  'generator/wantsLairLoot.js': [
    'const shouldNotHaveAbility = random(1, 2) === 2;',
    'const shouldNotHaveLoot = random(1, 3) === 3;',
  ],
};

export async function acquireMonsterSitePack(fetcher = fetchOfficial): Promise<MonsterSitePack> {
  const page = await fetcher(ORIGIN, new URL(ORIGIN + '/'), 200_000);
  const script = officialScript(page, ORIGIN);
  const bundle = await fetcher(ORIGIN, script, 2_000_000);
  const map = JSON.parse(await fetcher(ORIGIN, new URL(`${script.pathname}.map`, ORIGIN), 4_000_000)) as {
    sources?: string[];
    sourcesContent?: (string | null)[];
  };
  const source = (name: string) => {
    const index = map.sources?.indexOf(name) ?? -1;
    const text = index >= 0 ? map.sourcesContent?.[index] : undefined;
    if (!text) acquireFail(`missing-source:${name}`);
    for (const anchor of ANCHORS[name] ?? []) if (!text.includes(anchor)) acquireFail('algorithm-drift');
    return text;
  };
  const pack = buildMonsterSitePack({
    bundle,
    bundleSha: sha256(bundle),
    tables: source('generator/theMonsterApproaches.js'),
    weapons: source('generator/weaponsAndArmor.js'),
    extras: source('generator/wantsLairLoot.js'),
  });
  parseMonsterSitePack(pack);
  auditMonsterMessages(pack);
  if (sha256(monsterSitePackPayload(pack)) !== pack.integrity.payloadSha256)
    acquireFail('checksum');
  return pack;
}

export function buildMonsterSitePack(input: {
  bundle: string;
  bundleSha: string;
  tables: string;
  weapons: string;
  extras: string;
}): MonsterSitePack {
  const messages = messageCatalog(input.bundle);
  const version = messages['app.version'];
  if (!version || !messages['theMonsterApproaches.introduction'])
    acquireFail('missing-english-catalog');
  const approaches = sourceFile(input.tables);
  const gear = sourceFile(input.weapons);
  const extras = sourceFile(input.extras);
  const face = (name: string) => faceTable(functionNamed(approaches, name));
  const tables = {
    A: face('tableA'),
    B: face('tableB'),
    C: face('tableC'),
    weapons: {
      ...switched(functionNamed(gear, 'weaponTable'), {
        'DICE.d4.id': 'd4',
        'DICE.d6.id': 'd6',
        'DICE.d8.id': 'd8',
        'DICE.d10.id': 'd10',
      }),
      natural: arrayLiteral(defaultReturn(functionNamed(gear, 'weaponTable'))),
    } as MonsterSitePack['tables']['weapons'],
    armor: switched(functionNamed(gear, 'armorTable'), {
      'DICE.d2.id': 'd2',
      'DICE.d4.id': 'd4',
      'DICE.d6.id': 'd6',
    }) as MonsterSitePack['tables']['armor'],
    prefixes: arrayLiteral(variable(gear, 'PREFIXES')),
    wants: arrayLiteral(variable(extras, 'wantTable')),
    lairs: arrayLiteral(variable(extras, 'lairTable')),
    abilities: arrayLiteral(variable(extras, 'abilityTable')),
    loot: arrayLiteral(variable(extras, 'lootTable')),
  };
  const draft: MonsterSitePack = {
    format: 'reference-desk.monster-site',
    version: 1,
    profile: 'monster-site-1',
    source: {
      project: 'The Monster Approaches',
      author: 'Karl Druid',
      url: MONSTER_SITE_URL,
      attribution:
        'The Monster Approaches by Karl Druid. Private local snapshot; not an official integration.',
    },
    snapshot: {
      id: `monster-site-${input.bundleSha.slice(0, 24)}`,
      version,
      auditedAt: new Date().toISOString().slice(0, 10),
    },
    messages,
    tables,
    integrity: { payloadSha256: '', messageCount: Object.keys(messages).length, faces: 12 },
  };
  draft.integrity.payloadSha256 = sha256(monsterSitePackPayload(draft));
  return draft;
}

function auditMonsterMessages(pack: MonsterSitePack) {
  const missing: string[] = [];
  const need = (id: string) => {
    if (pack.messages[id] === undefined) missing.push(id);
  };
  need('theMonsterApproaches.introduction');
  for (const die of ['d2', 'd4', 'd6', 'd8', 'd10', 'd12']) need(`monster.${die}`);
  need('armor.noArmor');
  need('armor.armor');
  const rows = [
    ...pack.tables.A.flat(),
    ...pack.tables.B.flat(),
    ...pack.tables.C.flat(),
    ...pack.tables.wants,
  ];
  for (const entry of rows) need(`theMonsterApproaches.${entry.id}`);
  for (const entry of [...pack.tables.lairs, ...pack.tables.abilities, ...pack.tables.loot])
    need(`description.${entry.id}`);
  for (const group of Object.values(pack.tables.weapons))
    for (const entry of group) need(`weapon.${entry.id}`);
  for (const entry of pack.tables.prefixes) need(`weapon.prefix.${entry.id}`);
  for (const group of Object.values(pack.tables.armor))
    for (const entry of group) need(`armor.${entry.id}`);
  for (const table of [pack.tables.A, pack.tables.B, pack.tables.C])
    for (const entry of table.flat()) {
      if (entry.weapon?.id) need(`weapon.${entry.weapon.id}`);
      if (entry.armor?.id) need(`armor.${entry.armor.id}`);
    }
  if (missing.length) acquireFail(`missing-message:${missing.length}`);
}
function messageCatalog(bundle: string) {
  const file = sourceFile(bundle, 'monster.js');
  const merged: Record<string, string> = {};
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'parse' &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      node.arguments[0].text.startsWith('{')
    ) {
      let parsed: unknown;
      try { parsed = JSON.parse(node.arguments[0].text); } catch { acquireFail('asset-json'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) acquireFail('asset-json');
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value !== 'string') acquireFail('message-shape');
        if (key in merged && merged[key] !== value) acquireFail('message-conflict');
        merged[key] = value;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return merged;
}
function sourceFile(text: string, name = 'source.js') {
  const file = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if ((file as ts.SourceFile & { parseDiagnostics?: readonly unknown[] }).parseDiagnostics?.length)
    acquireFail('asset-syntax');
  return file;
}
function functionNamed(file: ts.SourceFile, name: string): ts.ArrowFunction | ts.FunctionExpression {
  let found: ts.ArrowFunction | ts.FunctionExpression | undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === name &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    )
      found = node.initializer;
    if (!found) ts.forEachChild(node, visit);
  };
  visit(file);
  if (!found) acquireFail(`missing-function:${name}`);
  return found;
}
function variable(file: ts.SourceFile, name: string) {
  let found: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && node.initializer)
      found = node.initializer;
    if (!found) ts.forEachChild(node, visit);
  };
  visit(file);
  if (!found) acquireFail(`missing-table:${name}`);
  return found;
}
function switchOf(fn: ts.ArrowFunction | ts.FunctionExpression) {
  let found: ts.SwitchStatement | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isSwitchStatement(node)) found = node;
    else if (!found) ts.forEachChild(node, visit);
  };
  visit(fn);
  if (!found) acquireFail('missing-switch');
  return found;
}
function caseLabel(node: ts.Expression) {
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isPropertyAccessExpression(node) && ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression))
    return `${node.expression.expression.text}.${node.expression.name.text}.${node.name.text}`;
  acquireFail('switch-label');
}
function returnedArray(clause: ts.CaseOrDefaultClause) {
  const returned = clause.statements.find(
    (statement): statement is ts.ReturnStatement =>
      ts.isReturnStatement(statement) && !!statement.expression && ts.isArrayLiteralExpression(statement.expression),
  );
  if (!returned?.expression || !ts.isArrayLiteralExpression(returned.expression))
    acquireFail('switch-return');
  return returned.expression;
}
function faceTable(fn: ts.ArrowFunction | ts.FunctionExpression) {
  const rows: MonsterSiteEntry[][] = [[]];
  for (const clause of switchOf(fn).caseBlock.clauses) {
    if (!ts.isCaseClause(clause)) continue;
    const label = caseLabel(clause.expression);
    const face = Number(label);
    if (!Number.isInteger(face) || face < 1 || face > 12) acquireFail('face-label');
    rows[face] = arrayLiteral(returnedArray(clause));
  }
  if (rows.length !== 13 || rows.slice(1).some((row) => !row?.length)) acquireFail('face-table');
  return rows;
}
function switched(
  fn: ts.ArrowFunction | ts.FunctionExpression,
  labels: Record<string, string>,
) {
  const tables: Record<string, MonsterSiteEntry[]> = {};
  for (const clause of switchOf(fn).caseBlock.clauses) {
    if (!ts.isCaseClause(clause)) continue;
    const key = labels[caseLabel(clause.expression)];
    if (!key) acquireFail('switch-label');
    tables[key] = arrayLiteral(returnedArray(clause));
  }
  if (Object.keys(labels).some((label) => !tables[labels[label]])) acquireFail('switch-label');
  return tables;
}
function defaultReturn(fn: ts.ArrowFunction | ts.FunctionExpression) {
  const clause = switchOf(fn).caseBlock.clauses.find(ts.isDefaultClause);
  if (!clause) acquireFail('missing-default');
  return returnedArray(clause);
}
function arrayLiteral(node: ts.Expression): MonsterSiteEntry[] {
  if (!ts.isArrayLiteralExpression(node)) acquireFail('table-shape');
  return node.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) acquireFail('table-shape');
    return objectEntry(element);
  });
}
function objectEntry(node: ts.ObjectLiteralExpression): MonsterSiteEntry {
  const value: Record<string, unknown> = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
      acquireFail('table-property');
    value[property.name.text] = literal(property.initializer);
  }
  if (typeof value.id !== 'string') acquireFail('entry-id');
  return value as unknown as MonsterSiteEntry;
}
function literal(node: ts.Expression): unknown {
  if (ts.isParenthesizedExpression(node)) return literal(node.expression);
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => {
    if (ts.isSpreadElement(element)) acquireFail('table-spread');
    return literal(element);
  });
  if (ts.isObjectLiteralExpression(node)) {
    const value: Record<string, unknown> = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) acquireFail('table-property');
      const name = ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)
        ? property.name.text
        : acquireFail('table-property');
      value[name] = literal(property.initializer);
    }
    return value;
  }
  acquireFail('unsupported-table-value');
}
