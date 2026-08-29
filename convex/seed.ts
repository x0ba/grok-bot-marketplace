import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

export const seedBots = internalMutation({
  args: { n: v.number() },
  returns: v.number(),
  handler: async (ctx, args) => {
    const count = Math.max(0, Math.min(Math.floor(args.n), 500))
    let submitter = await ctx.db.query('users').first()
    if (!submitter) {
      const id = await ctx.db.insert('users', {
        clerkId: 'seed_user',
        name: 'Seed',
      })
      submitter = (await ctx.db.get(id))!
    }

    for (let i = 0; i < count; i++) {
      const botId = `seed_${i}_${Date.now().toString(36)}`
      await ctx.db.insert('bots', {
        botId,
        url: `https://x.ai/bot/${botId}`,
        name: `Seed bot ${i}`,
        creatorName: 'Seeder',
        description: `Seeded listing ${i}`,
        tags: i % 2 === 0 ? ['travel'] : ['tools'],
        submitterId: submitter._id,
        score: count - i,
      })
    }
    return count
  },
})
