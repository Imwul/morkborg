import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, randomBytes } from 'node:crypto';
import {
  decryptPrivateUpdate,
  mergeOracleTranslations,
  updateAAD,
} from '../src/storage/privateUpdates.ts';
import { parseUpdateConnection } from '../src/storage/privateUpdateConnection.ts';
import {
  importPrivateData,
  parsePrivateData,
} from '../src/storage/privateDataImport.ts';
import { getOraclePack } from '../src/storage/oracleStore.ts';
import { mergeRuleTranslations } from '../src/storage/ruleTranslations.ts';
import type { OraclePack } from '../src/domain/oracle.ts';
import type { RulesPack } from '../src/storage/rulesStore.ts';

const oracle: OraclePack = {
  schemaVersion: 1,
  books: [{ id: 'test', title: 'Test fixture' }],
  procedures: [],
  tables: [
    {
      id: 'test.table',
      sourceBookId: 'test',
      sourcePage: 1,
      title: 'Fixture',
      category: 'OTHER',
      dice: 'd6',
      tags: [],
      sourceVerified: true,
      entries: [
        { id: 'one', min: 1, max: 6, text: 'Signal', metadata: { ko: '신호' } },
      ],
    },
  ],
};
const connection = parseUpdateConnection({
  schemaVersion: 1,
  manifest: '/private-updates/latest.json',
  key: randomBytes(32).toString('base64'),
  revision: 0,
  enabled: true,
});
const bundle = {
  kind: 'morkborg-private-data',
  schemaVersion: 1,
  oracles: oracle,
};
function encrypt(revision = 123) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    'aes-256-gcm',
    Buffer.from(connection.key, 'base64'),
    iv,
  );
  cipher.setAAD(updateAAD(revision));
  const data = Buffer.concat([
    cipher.update(JSON.stringify({ revision, bundle })),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    schemaVersion: 1,
    iv: iv.toString('base64'),
    data: data.toString('base64'),
  };
}
test('Node publisher ciphertext is authenticated and decrypted by browser WebCrypto', async () => {
  const encrypted = encrypt();
  assert.ok(!JSON.stringify(encrypted).includes('Signal'));
  assert.deepEqual(
    (await decryptPrivateUpdate(encrypted, connection, 123)).oracles,
    oracle,
  );
});
test('wrong key, changed revision, and damaged ciphertext are rejected before import', async () => {
  const encrypted = encrypt();
  await assert.rejects(
    decryptPrivateUpdate(
      encrypted,
      { ...connection, key: randomBytes(32).toString('base64') },
      123,
    ),
  );
  await assert.rejects(decryptPrivateUpdate(encrypted, connection, 124));
  const damaged = Buffer.from(encrypted.data, 'base64');
  damaged[2] ^= 1;
  await assert.rejects(
    decryptPrivateUpdate(
      { ...encrypted, data: damaged.toString('base64') },
      connection,
      123,
    ),
  );
});
test('connection accepts only the same-origin manifest and valid key/version', () => {
  assert.throws(() =>
    parseUpdateConnection({
      ...connection,
      manifest: 'https://example.com/private',
    }),
  );
  assert.throws(() =>
    parseUpdateConnection({ ...connection, manifest: '//example.com/private' }),
  );
  assert.throws(() =>
    parseUpdateConnection({ ...connection, key: 'not a key' }),
  );
  assert.throws(() =>
    parseUpdateConnection({ ...connection, schemaVersion: 2 }),
  );
  assert.deepEqual(
    parsePrivateData({ ...bundle, updateConnection: connection })
      .updateConnection,
    connection,
  );
});
test('connection and imported pack commit together; failed storage preserves active data', async () => {
  let saved;
  await importPrivateData(
    [{ ...bundle, updateConnection: connection }],
    async (value) => {
      saved = value;
    },
  );
  assert.deepEqual(Object.keys(saved!), ['oracles', 'updateConnection']);
  const before = getOraclePack();
  const changed = structuredClone(oracle);
  changed.tables[0].entries[0].metadata!.ko = '교정';
  await assert.rejects(
    importPrivateData(
      [
        {
          ...bundle,
          oracles: changed,
          updateConnection: { ...connection, revision: 123 },
        },
      ],
      async () => {
        throw new Error('Storage failed');
      },
    ),
  );
  assert.equal(getOraclePack(), before);
});
test('Oracle updates preserve ranges, custom entries, notes and edited English', () => {
  const current = structuredClone(oracle);
  current.tables[0].entries[0] = {
    id: 'one',
    min: 1,
    max: 3,
    text: 'Signal',
    metadata: { note: 'keep' },
  };
  current.tables[0].entries.push({
    id: 'custom',
    min: 4,
    max: 6,
    text: 'My own result',
    metadata: { ko: '내 결과' },
  });
  const updated = mergeOracleTranslations(current, oracle);
  assert.equal(updated.tables[0].entries[0].metadata!.ko, '신호');
  assert.equal(updated.tables[0].entries[0].metadata!.note, 'keep');
  assert.equal(updated.tables[0].entries[0].max, 3);
  assert.deepEqual(updated.tables[0].entries[1], current.tables[0].entries[1]);
  current.tables[0].entries[0].text = 'My edited signal';
  assert.deepEqual(mergeOracleTranslations(current, oracle), current);
});
test('Rule translation updates respect nested and duplicate wording while preserving weights', () => {
  const current: RulesPack = {
    schemaVersion: 1,
    books: [],
    creatures: [],
    outcasts: [],
    notes: { custom: 'keep' },
    tables: {
      fixture: {
        title: 'Fixture',
        book: 'test',
        pages: [1],
        dice: 'd6',
        entries: [
          {
            text: 'Signal',
            weight: 7,
            meta: {},
            followup: [{ text: 'Echo', weight: 2, meta: {} }],
          },
          { text: 'Signal', weight: 1, meta: {} },
          { text: 'My entry', weight: 1, meta: { ko: '직접 작성' } },
        ],
      },
    },
  };
  const incoming = structuredClone(current);
  incoming.tables.fixture.entries[0].meta.ko = '첫 신호';
  incoming.tables.fixture.entries[0].followup![0].meta.ko = '메아리';
  incoming.tables.fixture.entries[1].meta.ko = '두 번째 신호';
  incoming.tables.fixture.entries.pop();
  const updated = mergeRuleTranslations(current, incoming);
  assert.equal(updated.tables.fixture.entries[0].meta.ko, '첫 신호');
  assert.equal(updated.tables.fixture.entries[1].meta.ko, '두 번째 신호');
  assert.equal(updated.tables.fixture.entries[0].weight, 7);
  assert.equal(
    updated.tables.fixture.entries[0].followup![0].meta.ko,
    '메아리',
  );
  assert.deepEqual(
    updated.tables.fixture.entries[2],
    current.tables.fixture.entries[2],
  );
  assert.equal(updated.notes.custom, 'keep');
});

test('publisher recovers the established key from a linked bundle and refuses silent rotation', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, resolve } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const cwd = mkdtempSync(join(tmpdir(), 'mork-update-publisher-'));
  const script = resolve('scripts/publish-private-update.mjs');
  try {
    mkdirSync(join(cwd, 'outputs'));
    mkdirSync(join(cwd, 'public/private-updates'), { recursive: true });
    writeFileSync(
      join(cwd, 'public/private-updates/latest.json'),
      JSON.stringify({ schemaVersion: 1, revision: 1, file: 'existing' }),
    );
    const input = join(cwd, 'outputs/morkborg-private-data.json');
    const plain = { ...bundle, library: {}, fateChart: {} };
    writeFileSync(input, JSON.stringify(plain));
    assert.notEqual(spawnSync(process.execPath, [script], { cwd }).status, 0);
    assert.equal(
      JSON.parse(
        readFileSync(join(cwd, 'public/private-updates/latest.json'), 'utf8'),
      ).revision,
      1,
    );
    writeFileSync(
      input,
      JSON.stringify({ ...plain, updateConnection: connection }),
    );
    assert.equal(spawnSync(process.execPath, [script], { cwd }).status, 0);
    const publisher = JSON.parse(
      readFileSync(join(cwd, 'outputs/private-update-publisher.json'), 'utf8'),
    );
    assert.equal(publisher.key, connection.key);
    const manifest = JSON.parse(
      readFileSync(join(cwd, 'public/private-updates/latest.json'), 'utf8'),
    );
    const cipher = readFileSync(join(cwd, 'public', manifest.file), 'utf8');
    assert.ok(!cipher.includes(connection.key));
    assert.ok(!cipher.includes('Signal'));
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
