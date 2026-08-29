import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { getOrCreateUser } from './lib/auth'

export const toggleUpvote = mutation({
  args: { botId: v.id('bots') },
  returns: v.object({
    voted: v.boolean(),
    score: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx)
    const bot = await ctx.db.get(args.botId)
    if (!bot) {
      throw new Error('Bot not found')
    }

    const existing = await ctx.db
      .query('votes')
      .withIndex('by_bot_user', (q) =>
        q.eq('botId', args.botId).eq('userId', user._id),
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      const score = bot.score - 1
      await ctx.db.patch(args.botId, { score })
      return { voted: false, score }
    }

    await ctx.db.insert('votes', {
      botId: args.botId,
      userId: user._id,
    })
    const score = bot.score + 1
    await ctx.db.patch(args.botId, { score })
    return { voted: true, score }
  },
})

export const myVoteBotIds = query({
  args: { botIds: v.array(v.id('bots')) },
  returns: v.array(v.id('bots')),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    // Cap lookup size — clients should pass the visible page window.
    const wanted = new Set(args.botIds.slice(0, 100))
    if (wanted.size === 0) return []

    const votes = await ctx.db
      .query('votes')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    const voted: Array<Id<'bots'>> = []
    for (const vote of votes) {
      if (wanted.has(vote.botId)) voted.push(vote.botId)
    }
    return voted
  },
})
