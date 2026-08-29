import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'
import { modules } from './lib/test.setup'

describe('feed listTop tag filter', () => {
  it('filters to bots carrying a normalized tag', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'u',
        name: 'U',
      })
      await ctx.db.insert('bots', {
        botId: 'a',
        url: 'https://x.ai/bot/a',
        name: 'Travel bot',
        tags: ['travel'],
        submitterId: user,
        score: 2,
      })
      await ctx.db.insert('bots', {
        botId: 'b',
        url: 'https://x.ai/bot/b',
        name: 'Tools bot',
        tags: ['tools'],
        submitterId: user,
        score: 5,
      })
    })

    const page = await t.query(api.feed.listTop, {
      paginationOpts: { numItems: 10, cursor: null },
      tag: ' Travel ',
    })
    expect(page.page.map((b) => b.botId)).toEqual(['a'])
  })
})

describe('searchBots tag normalize', () => {
  it('matches trimmed tags and excludes other tags in the search window', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'u2',
        name: 'U',
      })
      await ctx.db.insert('bots', {
        botId: 'peddler',
        url: 'https://x.ai/bot/peddler',
        name: 'point peddler',
        tags: ['travel'],
        submitterId: user,
        score: 3,
      })
      await ctx.db.insert('bots', {
        botId: 'other',
        url: 'https://x.ai/bot/other',
        name: 'point other',
        tags: ['tools'],
        submitterId: user,
        score: 2,
      })
    })

    const hits = await t.query(api.feed.searchBots, {
      query: 'point',
      tag: ' travel ',
      limit: 10,
    })
    expect(hits.map((b) => b.botId)).toEqual(['peddler'])
  })
})

describe('listTop sparse tag overscan', () => {
  it('returns a tagged bot past the first unfiltered page size', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      const user = await ctx.db.insert('users', {
        clerkId: 'u3',
        name: 'U',
      })
      for (let i = 0; i < 12; i++) {
        await ctx.db.insert('bots', {
          botId: `filler-${i}`,
          url: `https://x.ai/bot/filler-${i}`,
          name: `Filler ${i}`,
          tags: ['other'],
          submitterId: user,
          score: 100 - i,
        })
      }
      await ctx.db.insert('bots', {
        botId: 'needle',
        url: 'https://x.ai/bot/needle',
        name: 'Needle bot',
        tags: ['travel'],
        submitterId: user,
        score: 1,
      })
    })

    const page = await t.query(api.feed.listTop, {
      paginationOpts: { numItems: 10, cursor: null },
      tag: 'travel',
    })
    expect(page.page.map((b) => b.botId)).toContain('needle')
  })
})
