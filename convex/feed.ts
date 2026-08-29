import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { query } from './_generated/server'
import { normalizeTags } from './lib/parseBotPage'

const botDoc = v.object({
  _id: v.id('bots'),
  _creationTime: v.number(),
  botId: v.string(),
  url: v.string(),
  name: v.string(),
  creatorName: v.optional(v.string()),
  ogImageUrl: v.optional(v.string()),
  promptExcerpt: v.optional(v.string()),
  description: v.optional(v.string()),
  tags: v.array(v.string()),
  submitterId: v.id('users'),
  score: v.number(),
})

const pageResult = v.object({
  page: v.array(botDoc),
  isDone: v.boolean(),
  continueCursor: v.string(),
})

function normalizeTagFilter(tag: string | undefined): string | undefined {
  if (!tag) return undefined
  return normalizeTags([tag])[0]
}

/** Convex allows one paginate() per query, so tag filters overscan then filter. */
function tagScanOpts(paginationOpts: {
  numItems: number
  cursor: string | null
  id?: number
}, tag: string | undefined) {
  if (!tag) return paginationOpts
  return {
    ...paginationOpts,
    numItems: Math.min(Math.max(paginationOpts.numItems * 10, paginationOpts.numItems), 100),
  }
}

export const listTop = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tag: v.optional(v.string()),
  },
  returns: pageResult,
  handler: async (ctx, args) => {
    const tag = normalizeTagFilter(args.tag)
    const results = await ctx.db
      .query('bots')
      .withIndex('by_score')
      .order('desc')
      .paginate(tagScanOpts(args.paginationOpts, tag))

    const page = tag
      ? results.page.filter((bot) => bot.tags.includes(tag))
      : results.page

    return {
      page,
      isDone: results.isDone,
      continueCursor: results.continueCursor,
    }
  },
})

export const listNew = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tag: v.optional(v.string()),
  },
  returns: pageResult,
  handler: async (ctx, args) => {
    const tag = normalizeTagFilter(args.tag)
    const results = await ctx.db
      .query('bots')
      .order('desc')
      .paginate(tagScanOpts(args.paginationOpts, tag))

    const page = tag
      ? results.page.filter((bot) => bot.tags.includes(tag))
      : results.page

    return {
      page,
      isDone: results.isDone,
      continueCursor: results.continueCursor,
    }
  },
})

export const getByBotId = query({
  args: { botId: v.string() },
  returns: v.union(botDoc, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('bots')
      .withIndex('by_botId', (q) => q.eq('botId', args.botId))
      .unique()
  },
})

export const searchBots = query({
  args: {
    query: v.string(),
    tag: v.optional(v.string()),
    limit: v.number(),
  },
  returns: v.array(botDoc),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Math.floor(args.limit), 50))
    const tag = normalizeTagFilter(args.tag)
    // Tag filter runs after search; scan the full search window (50) then trim.
    const hits = await ctx.db
      .query('bots')
      .withSearchIndex('search_name', (q) => q.search('name', args.query))
      .take(tag ? 50 : limit)

    const filtered = tag
      ? hits.filter((bot) => bot.tags.includes(tag))
      : hits
    return filtered.slice(0, limit)
  },
})
