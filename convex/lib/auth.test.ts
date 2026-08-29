import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { modules } from './test.setup'
import schema from '../schema'
import { getOrCreateUser } from './auth'

describe('getOrCreateUser', () => {
  it('inserts once and returns the same user on the second call', async () => {
    const t = convexTest(schema, modules)

    const asUser = t.withIdentity({
      subject: 'user_clerk_1',
      name: 'Ada',
      pictureUrl: 'https://example.com/ada.png',
    })

    const first = await asUser.run(async (ctx) => getOrCreateUser(ctx))
    const second = await asUser.run(async (ctx) => getOrCreateUser(ctx))

    expect(first._id).toEqual(second._id)
    expect(first.clerkId).toBe('user_clerk_1')
    expect(first.name).toBe('Ada')

    const users = await t.run(async (ctx) => ctx.db.query('users').collect())
    expect(users).toHaveLength(1)
  })

  it('throws when signed out', async () => {
    const t = convexTest(schema, modules)
    await expect(
      t.run(async (ctx) => getOrCreateUser(ctx)),
    ).rejects.toThrow('Not authenticated')
  })
})
