import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { modules } from './lib/test.setup'

describe('toggleUpvote', () => {
  it('toggles on then off and restores score', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity({ subject: 'u1', name: 'One' })

    const botId = await asUser.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'u1',
        name: 'One',
      })
      return await ctx.db.insert('bots', {
        botId: 'b1',
        url: 'https://x.ai/bot/b1',
        name: 'Bot',
        tags: [],
        submitterId: user,
        score: 0,
      })
    })

    const on = await asUser.mutation(api.votes.toggleUpvote, { botId })
    expect(on).toEqual({ voted: true, score: 1 })

    const off = await asUser.mutation(api.votes.toggleUpvote, { botId })
    expect(off).toEqual({ voted: false, score: 0 })

    const votes = await t.run(async (ctx) => ctx.db.query('votes').collect())
    expect(votes).toHaveLength(0)
  })

  it('keeps at most one vote row per user per bot', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity({ subject: 'u1', name: 'One' })

    const botId = await asUser.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'u1',
        name: 'One',
      })
      return await ctx.db.insert('bots', {
        botId: 'b1',
        url: 'https://x.ai/bot/b1',
        name: 'Bot',
        tags: [],
        submitterId: user,
        score: 0,
      })
    })

    await asUser.mutation(api.votes.toggleUpvote, { botId })
    await asUser.mutation(api.votes.toggleUpvote, { botId })
    await asUser.mutation(api.votes.toggleUpvote, { botId })

    const votes = await t.run(async (ctx) => ctx.db.query('votes').collect())
    expect(votes).toHaveLength(1)
  })

  it('adds two points from two users', async () => {
    const t = convexTest(schema, modules)
    const a = t.withIdentity({ subject: 'a', name: 'A' })
    const b = t.withIdentity({ subject: 'b', name: 'B' })

    const botId = await a.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'a',
        name: 'A',
      })
      return await ctx.db.insert('bots', {
        botId: 'b1',
        url: 'https://x.ai/bot/b1',
        name: 'Bot',
        tags: [],
        submitterId: user,
        score: 0,
      })
    })

    await a.mutation(api.votes.toggleUpvote, { botId })
    const second = await b.mutation(api.votes.toggleUpvote, { botId })
    expect(second.score).toBe(2)
  })
})

describe('listTop pagination', () => {
  it('orders by score across page boundaries', async () => {
    const t = convexTest(schema, modules)

    await t.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'seed',
        name: 'Seed',
      })
      for (let score = 1; score <= 5; score++) {
        await ctx.db.insert('bots', {
          botId: `b${score}`,
          url: `https://x.ai/bot/b${score}`,
          name: `Bot ${score}`,
          tags: [],
          submitterId: user,
          score,
        })
      }
    })

    const page1 = await t.query(api.feed.listTop, {
      paginationOpts: { numItems: 2, cursor: null },
    })
    expect(page1.page.map((b) => b.score)).toEqual([5, 4])

    const page2 = await t.query(api.feed.listTop, {
      paginationOpts: { numItems: 2, cursor: page1.continueCursor },
    })
    expect(page2.page.map((b) => b.score)).toEqual([3, 2])
  })
})

describe('seedBots', () => {
  it('inserts n bots', async () => {
    const t = convexTest(schema, modules)
    const n = await t.mutation(internal.seed.seedBots, { n: 3 })
    expect(n).toBe(3)
    const bots = await t.run(async (ctx) => ctx.db.query('bots').collect())
    expect(bots).toHaveLength(3)
  })
})
