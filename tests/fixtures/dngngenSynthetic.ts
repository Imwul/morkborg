import { createHash } from 'node:crypto';
import {
  DNGNGEN_POOL_ROLES,
  dngngenPackPayload,
  type DngngenEntry,
  type DngngenPack,
  type DngngenTemplatePart,
} from '../../src/domain/dngngenPack.ts';

/** Entirely invented test vocabulary. Never presented as an actual source pack. */
export function sealSyntheticDngngenPack(pack: DngngenPack): DngngenPack {
  return {
    ...pack,
    integrity: {
      ...pack.integrity,
      payloadSha256: createHash('sha256')
        .update(dngngenPackPayload(pack))
        .digest('hex'),
    },
  };
}
export function createSyntheticDngngenPack(): DngngenPack {
  const messages: Record<string, DngngenTemplatePart[]> = {};
  const pools = {} as Record<'A' | 'B' | 'C' | 'D', DngngenEntry[]>;
  for (const role of DNGNGEN_POOL_ROLES) {
    pools[role] = Array.from({ length: 6 }, (_, index) => {
      const id = `SYNTHETIC-${role}-${index + 1}`;
      messages[id] = [
        { type: 'text', text: `${role}-${index + 1} TEST DESCRIPTION` },
      ];
      return { id, messageId: id, values: [] };
    });
  }
  pools.A[1] = {
    ...pools.A[1],
    values: [{ name: 'count', recipe: { op: 'int', min: 1, max: 4 } }],
  };
  messages[pools.A[1].id] = [
    { type: 'text', text: 'A-2 COUNT ' },
    { type: 'value', name: 'count' },
    {
      type: 'select',
      name: 'count',
      cases: { '1': [{ type: 'text', text: ' UNIT' }] },
      other: [{ type: 'text', text: ' UNITS' }],
    },
  ];
  pools.A[2] = {
    ...pools.A[2],
    values: [
      {
        name: 'sum',
        recipe: {
          op: 'sum',
          terms: [
            { op: 'int', min: 1, max: 6 },
            { op: 'int', min: 1, max: 6 },
            { op: 'literal', value: 10 },
          ],
        },
      },
    ],
  };
  messages[pools.A[2].id] = [
    { type: 'text', text: 'A-3 SUM ' },
    { type: 'value', name: 'sum' },
  ];
  pools.A[3] = {
    ...pools.A[3],
    values: [
      {
        name: 'label',
        recipe: { op: 'sample', values: ['LABEL-RED', 'LABEL-BLUE'] },
      },
    ],
  };
  messages[pools.A[3].id] = [
    { type: 'text', text: 'A-4 LABEL ' },
    { type: 'value', name: 'label', format: 'message' },
  ];
  messages['LABEL-RED'] = [{ type: 'text', text: 'RED TEST LABEL' }];
  messages['LABEL-BLUE'] = [{ type: 'text', text: 'BLUE TEST LABEL' }];
  pools.A[4] = {
    ...pools.A[4],
    values: [{ name: 'label', recipe: { op: 'literal', value: 'CONSTANT' } }],
  };
  messages[pools.A[4].id] = [
    { type: 'text', text: 'A-5 ' },
    { type: 'value', name: 'label' },
  ];
  messages[pools.A[5].id] = [
    { type: 'text', text: 'A-6 ' },
    { type: 'message', id: 'COMMON-SUFFIX' },
  ];
  messages['COMMON-SUFFIX'] = [{ type: 'text', text: 'SHARED TEST SUFFIX' }];
  return sealSyntheticDngngenPack({
    format: 'reference-desk.dngngen',
    version: 1,
    profile: 'synthetic',
    source: {
      project: 'Synthetic DNGNGEN grammar test',
      author: 'Test fixture',
      url: 'https://example.invalid/synthetic',
      attribution: 'Synthetic test data — not DNGNGEN source content.',
    },
    snapshot: {
      id: 'synthetic-grammar-v1',
      version: 'test-1',
      auditedAt: '2026-09-20',
    },
    pools,
    messages,
    integrity: {
      algorithm: 'sha256',
      payloadSha256: '0'.repeat(64),
      poolCounts: { A: 6, B: 6, C: 6, D: 6 },
    },
  });
}
