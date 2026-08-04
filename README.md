# mcp-postscript

Postscript MCP Pack — SMS marketing for Shopify.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `postscript_list_subscribers` | List SMS subscribers for a Postscript (Shopify) shop. Supports filtering by email, phone number, Shopify customer ID, and created/updated timestamps, plus sorting. Page-based pagination: returns { page_info: { page, total_pages }, subscribers: [...] }; pass page to walk results. |
| `postscript_get_subscriber` | Get a single SMS subscriber by Postscript subscriber ID. Returns phone number, email, subscription status, Shopify customer linkage, and custom properties. |
| `postscript_list_keywords` | List all active SMS keywords for the shop. Keywords are the text-to-join words (e.g. "JOIN") subscribers text to opt in. Returns keyword IDs, the keyword text, and associated subscription settings. |
| `postscript_get_keyword` | Get a single SMS keyword by its ID. Returns the keyword text, status, and configuration (welcome message, list assignment). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "postscript": {
      "url": "https://gateway.pipeworx.io/postscript/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Postscript data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
