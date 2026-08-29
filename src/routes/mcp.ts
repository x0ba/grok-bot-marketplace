import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createFileRoute } from '@tanstack/react-router'
import { ConvexHttpClient } from 'convex/browser'
import { z } from 'zod'

import { api } from '../../convex/_generated/api'
import { handleMcpRequest } from '#/utils/mcp-handler'
import {
  botToToolPayload,
  clampLimit,
  getBotInstruction,
} from '#/mcp/catalog'

function resolveConvexUrl(): string {
  const fromVite = import.meta.env.VITE_CONVEX_URL
  if (typeof fromVite === 'string' && fromVite.length > 0) return fromVite
  const fromProcess = process.env.VITE_CONVEX_URL
  if (fromProcess) return fromProcess
  throw new Error('VITE_CONVEX_URL is not configured')
}

function client() {
  return new ConvexHttpClient(resolveConvexUrl())
}

function createCatalogServer() {
  const server = new McpServer({
    name: 'grok-bot-marketplace',
    version: '1.0.0',
  })

  server.registerTool(
    'list_bots',
    {
      title: 'List bots',
      description: 'List catalog bots sorted by top score or newest first.',
      inputSchema: {
        sort: z.enum(['top', 'new']).default('top'),
        limit: z.number().optional(),
      },
    },
    async ({ sort, limit }) => {
      const take = clampLimit(limit)
      const convex = client()
      const page =
        sort === 'new'
          ? await convex.query(api.feed.listNew, {
              paginationOpts: { numItems: take, cursor: null },
            })
          : await convex.query(api.feed.listTop, {
              paginationOpts: { numItems: take, cursor: null },
            })
      const bots = page.page.map(botToToolPayload)
      return {
        content: [{ type: 'text', text: JSON.stringify(bots, null, 2) }],
      }
    },
  )

  server.registerTool(
    'search_bots',
    {
      title: 'Search bots',
      description: 'Search bots by name with an optional tag filter.',
      inputSchema: {
        query: z.string(),
        tag: z.string().optional(),
        limit: z.number().optional(),
      },
    },
    async ({ query, tag, limit }) => {
      const convex = client()
      const bots = await convex.query(api.feed.searchBots, {
        query,
        tag,
        limit: clampLimit(limit),
      })
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(bots.map(botToToolPayload), null, 2),
          },
        ],
      }
    },
  )

  server.registerTool(
    'get_bot',
    {
      title: 'Get bot',
      description: 'Get one bot by its x.ai bot id, with an install instruction.',
      inputSchema: {
        botId: z.string(),
      },
    },
    async ({ botId }) => {
      const convex = client()
      const bot = await convex.query(api.feed.getByBotId, { botId })
      if (!bot) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Bot not found: ${botId}`,
            },
          ],
        }
      }
      const payload = {
        ...botToToolPayload(bot),
        prompt_excerpt: bot.promptExcerpt ?? null,
        instruction: getBotInstruction(bot.botId),
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      }
    },
  )

  return server
}

export const Route = createFileRoute('/mcp')({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleMcpRequest(request, createCatalogServer()),
    },
  },
})
