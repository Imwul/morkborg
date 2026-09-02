import { getSnapshot, transact } from './storage/saveStore';
import { createCampaign } from './generators';
interface ModelContext {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ): void | Promise<void>;
}
export function registerCodexTools() {
  const context = (document as Document & { modelContext?: ModelContext })
    .modelContext;
  if (!context?.registerTool) return;
  const controller = new AbortController();
  const tools = [
    {
      name: 'list_campaigns',
      description:
        'List campaigns saved in this browser. Does not read full notes.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: () =>
        getSnapshot().save.campaigns.map((c) => ({
          id: c.id,
          title: c.title,
          dungeons: c.dungeons.length,
          characters: c.characters.length,
        })),
    },
    {
      name: 'create_campaign',
      description:
        'Create and open a new local campaign with the supplied title and optional subtitle.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          subtitle: { type: 'string' },
        },
        required: ['title'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: (input: unknown) => {
        if (
          !input ||
          typeof input !== 'object' ||
          !('title' in input) ||
          typeof input.title !== 'string' ||
          !input.title.trim() ||
          input.title.length > 200
        )
          throw new Error('A title of 1–200 characters is required.');
        if ('subtitle' in input && typeof input.subtitle !== 'string')
          throw new Error('Subtitle must be text.');
        if (
          Object.keys(input).some((key) => !['title', 'subtitle'].includes(key))
        )
          throw new Error('Unknown input field.');
        const c = createCampaign(
          input.title.trim(),
          'subtitle' in input ? (input.subtitle as string) : '',
        );
        transact((next) => {
          next.campaigns.push(c);
          next.activeCampaignId = c.id;
        });
        return { id: c.id, title: c.title, status: 'created' };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: controller.signal }),
      ).catch(() => {
        /* Optional proposed browser API. Core UI is unaffected. */
      });
    } catch {
      /* Optional registry unavailable. */
    }
  }
  return () => controller.abort();
}
