import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { action, internalMutation } from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { getOrCreateUser } from './lib/auth'
import {
  normalizeDescription,
  normalizeTags,
  parseBotPage,
  validateBotUrl,
} from './lib/parseBotPage'

const previewValidator = v.object({
  botId: v.string(),
  url: v.string(),
  name: v.string(),
  creatorName: v.optional(v.string()),
  ogImageUrl: v.optional(v.string()),
  promptExcerpt: v.optional(v.string()),
})

async function fetchAndParse(url: string) {
  const valid = validateBotUrl(url)
  if (!valid) {
    throw new ConvexError('Invalid bot URL. Use https://x.ai/bot/<id>.')
  }

  let response: Response
  try {
    response = await fetch(valid.url, {
      headers: { 'User-Agent': 'grok-bot-marketplace/1.0' },
    })
  } catch {
    throw new ConvexError('The bot page could not be read.')
  }

  if (!response.ok) {
    throw new ConvexError('The bot page could not be read.')
  }

  const html = await response.text()
  const parsed = parseBotPage(html)
  if (!parsed) {
    throw new ConvexError('The bot page could not be read.')
  }

  return {
    botId: valid.botId,
    url: valid.url,
    name: parsed.name,
    creatorName: parsed.creatorName,
    ogImageUrl: parsed.ogImageUrl,
    promptExcerpt: parsed.promptExcerpt,
  }
}

export const fetchBotPreview = action({
  args: { url: v.string() },
  returns: previewValidator,
  handler: async (_ctx, args) => {
    return await fetchAndParse(args.url)
  },
})

export const insertBot = internalMutation({
  args: {
    botId: v.string(),
    url: v.string(),
    name: v.string(),
    creatorName: v.optional(v.string()),
    ogImageUrl: v.optional(v.string()),
    promptExcerpt: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  returns: v.id('bots'),
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx)

    const existing = await ctx.db
      .query('bots')
      .withIndex('by_botId', (q) => q.eq('botId', args.botId))
      .unique()

    if (existing) {
      throw new ConvexError(`Bot already listed:${existing.botId}`)
    }

    return await ctx.db.insert('bots', {
      botId: args.botId,
      url: args.url,
      name: args.name,
      creatorName: args.creatorName,
      ogImageUrl: args.ogImageUrl,
      promptExcerpt: args.promptExcerpt,
      description: args.description,
      tags: args.tags,
      submitterId: user._id,
      score: 0,
    })
  },
})

export const submitBot = action({
  args: {
    url: v.string(),
    tags: v.array(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.object({
    botId: v.string(),
    listingId: v.id('bots'),
  }),
  handler: async (
    ctx: ActionCtx,
    args,
  ): Promise<{ botId: string; listingId: Id<'bots'> }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError('Not authenticated')
    }

    const parsed = await fetchAndParse(args.url)
    const tags = normalizeTags(args.tags)
    const description = normalizeDescription(args.description)

    const listingId: Id<'bots'> = await ctx.runMutation(
      internal.bots.insertBot,
      {
        ...parsed,
        tags,
        description,
      },
    )
    return { botId: parsed.botId, listingId }
  },
})
