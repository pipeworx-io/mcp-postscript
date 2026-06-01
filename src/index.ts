interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Postscript MCP Pack — SMS marketing for Shopify.
 *
 * BYO key: the merchant passes their Postscript Private API token as _apiKey.
 * Obtain the token from Postscript Settings → API (app.postscript.io/account/api).
 * Auth: `Authorization: Bearer ${apiKey}` against the documented v2 REST API.
 *
 * Pagination note: the v2 subscribers/keywords list endpoints are PAGE-based, not
 * cursor-based. Pass `page` (1-indexed); responses include a `page_info` object
 * with `page` and `total_pages`. Iterate by incrementing `page` until
 * page === total_pages. (There is no opaque next-cursor token in v2.)
 *
 * Tools (all confirmed against the live v2 API surface; shop/campaigns/analytics
 * have no documented v2 GET endpoint, so they are intentionally omitted):
 *   - postscript_list_subscribers
 *   - postscript_get_subscriber
 *   - postscript_list_keywords
 *   - postscript_get_keyword
 */


const BASE = 'https://api.postscript.io/api/v2';
const UA = 'pipeworx-mcp-postscript/1.0 (+https://pipeworx.io)';

async function psGet(apiKey: string, path: string, params?: URLSearchParams): Promise<unknown> {
  const qs = params?.toString();
  const url = `${BASE}${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'User-Agent': UA,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Postscript: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

// -- Tool definitions --------------------------------------------------------

const tools: McpToolExport['tools'] = [
  {
    name: 'postscript_list_subscribers',
    description:
      'List SMS subscribers for a Postscript (Shopify) shop. Supports filtering by email, phone number, Shopify customer ID, and created/updated timestamps, plus sorting. Page-based pagination: returns { page_info: { page, total_pages }, subscribers: [...] }; pass page to walk results.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Postscript Private API token (Bearer). From Settings → API.' },
        page: { type: 'number', description: '1-indexed page number (default 1). Walk until page === page_info.total_pages.' },
        sort: { type: 'string', description: 'Sort spec like "created_at__desc" or "updated_at__asc".' },
        email__eq: { type: 'string', description: 'Exact email match.' },
        email__contains: { type: 'string', description: 'Substring email match.' },
        phone_number__eq: { type: 'string', description: 'Exact phone match (E.164, e.g. +15551234567).' },
        phone_number__contains: { type: 'string', description: 'Substring phone match.' },
        shopify_customer_id__eq: { type: 'string', description: 'Exact Shopify customer ID match.' },
        created_at__gte: { type: 'string', description: 'ISO timestamp; subscribers created on/after this time.' },
        created_at__lte: { type: 'string', description: 'ISO timestamp; subscribers created on/before this time.' },
        updated_at__gte: { type: 'string', description: 'ISO timestamp; subscribers updated on/after this time.' },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'postscript_get_subscriber',
    description:
      'Get a single SMS subscriber by Postscript subscriber ID. Returns phone number, email, subscription status, Shopify customer linkage, and custom properties.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Postscript Private API token (Bearer).' },
        subscriber_id: { type: 'string', description: 'Postscript subscriber ID.' },
      },
      required: ['_apiKey', 'subscriber_id'],
    },
  },
  {
    name: 'postscript_list_keywords',
    description:
      'List all active SMS keywords for the shop. Keywords are the text-to-join words (e.g. "JOIN") subscribers text to opt in. Returns keyword IDs, the keyword text, and associated subscription settings.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Postscript Private API token (Bearer).' },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'postscript_get_keyword',
    description:
      'Get a single SMS keyword by its ID. Returns the keyword text, status, and configuration (welcome message, list assignment).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Postscript Private API token (Bearer).' },
        keyword_id: { type: 'string', description: 'Postscript keyword ID.' },
      },
      required: ['_apiKey', 'keyword_id'],
    },
  },
];

// -- callTool dispatcher -----------------------------------------------------

const SUBSCRIBER_FILTERS = [
  'sort',
  'email__eq',
  'email__contains',
  'phone_number__eq',
  'phone_number__contains',
  'shopify_customer_id__eq',
  'created_at__gte',
  'created_at__lte',
  'updated_at__gte',
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string | undefined;
  delete args._context;
  delete args._apiKey;

  if (!apiKey) throw new Error('_apiKey is required: pass the merchant\'s Postscript Private API token (Settings → API).');

  switch (name) {
    case 'postscript_list_subscribers': {
      const params = new URLSearchParams();
      if (args.page) params.set('page', String(args.page));
      for (const k of SUBSCRIBER_FILTERS) {
        if (args[k] !== undefined && args[k] !== null && args[k] !== '') params.set(k, String(args[k]));
      }
      return psGet(apiKey, '/subscribers', params);
    }
    case 'postscript_get_subscriber':
      return psGet(apiKey, `/subscribers/${encodeURIComponent(args.subscriber_id as string)}`);
    case 'postscript_list_keywords':
      return psGet(apiKey, '/keywords');
    case 'postscript_get_keyword':
      return psGet(apiKey, `/keywords/${encodeURIComponent(args.keyword_id as string)}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
