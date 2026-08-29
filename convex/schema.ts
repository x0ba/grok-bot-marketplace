import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  }).index('by_clerkId', ['clerkId']),

  bots: defineTable({
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
    .index('by_botId', ['botId'])
    .index('by_score', ['score'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['tags'],
    }),

  votes: defineTable({
    botId: v.id('bots'),
    userId: v.id('users'),
  })
    .index('by_bot_user', ['botId', 'userId'])
    .index('by_user', ['userId']),
})
