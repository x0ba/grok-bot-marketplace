import { describe, expect, it } from 'vitest'
import {
  botToToolPayload,
  clampLimit,
  getBotInstruction,
} from './catalog'

describe('botToToolPayload', () => {
  it('builds install_url from bot id and drops internal fields', () => {
    const payload = botToToolPayload({
      botId: 'PFD95widaEeqjkYLLUZmD',
      name: 'point peddler',
      creatorName: 'Daniel',
      description: 'travel',
      tags: ['travel'],
      score: 3,
      url: 'https://x.ai/bot/PFD95widaEeqjkYLLUZmD',
    })
    expect(payload).toEqual({
      name: 'point peddler',
      creator: 'Daniel',
      description: 'travel',
      tags: ['travel'],
      score: 3,
      install_url: 'https://x.ai/bot/PFD95widaEeqjkYLLUZmD',
      bot_id: 'PFD95widaEeqjkYLLUZmD',
    })
    expect(payload).not.toHaveProperty('submitterId')
    expect(payload).not.toHaveProperty('_id')
  })
})

describe('clampLimit', () => {
  it('clamps to 50', () => {
    expect(clampLimit(500)).toBe(50)
    expect(clampLimit(0)).toBe(1)
    expect(clampLimit(undefined)).toBe(20)
  })
})

describe('getBotInstruction', () => {
  it('tells the agent to open the install link', () => {
    expect(getBotInstruction('abc')).toContain('https://x.ai/bot/abc')
  })
})
