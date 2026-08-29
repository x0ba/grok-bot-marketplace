import type { Doc } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

export async function getOrCreateUser(
  ctx: MutationCtx,
): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }

  const clerkId = identity.subject
  const existing = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .unique()

  if (existing) {
    return existing
  }

  const userId = await ctx.db.insert('users', {
    clerkId,
    name: identity.name ?? identity.nickname ?? 'Anonymous',
    imageUrl: identity.pictureUrl,
  })

  const user = await ctx.db.get(userId)
  if (!user) {
    throw new Error('Failed to create user')
  }
  return user
}
