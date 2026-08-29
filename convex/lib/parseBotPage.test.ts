import { describe, expect, it } from 'vitest'
import {
  normalizeTags,
  parseBotPage,
  validateBotUrl,
} from './parseBotPage'

const fixture = `<!DOCTYPE html>
<html>
<head>
<title>point peddler by Daniel</title>
<meta property="og:title" content="point peddler by Daniel"/>
<meta property="og:description" content="You are the user&#x27;s award-travel brain. Your one job is making credit-card and airline-points optimization effortless so they never think about it longer..."/>
<meta property="og:image" content="https://x.ai/bot/PFD95widaEeqjkYLLUZmD/opengraph-image-bntnog?ff10f2afb2aeb68b"/>
</head>
<body></body>
</html>
`

describe('validateBotUrl', () => {
  it('accepts a canonical x.ai bot url', () => {
    expect(validateBotUrl('https://x.ai/bot/PFD95widaEeqjkYLLUZmD')).toEqual({
      botId: 'PFD95widaEeqjkYLLUZmD',
      url: 'https://x.ai/bot/PFD95widaEeqjkYLLUZmD',
    })
  })

  it('rejects non-x.ai hosts', () => {
    expect(validateBotUrl('https://example.com/bot/x')).toBeNull()
  })

  it('rejects non-bot paths', () => {
    expect(validateBotUrl('https://x.ai/grok')).toBeNull()
  })

  it('rejects bad ids', () => {
    expect(validateBotUrl('https://x.ai/bot/bad id')).toBeNull()
    expect(validateBotUrl('https://x.ai/bot/')).toBeNull()
  })
})

describe('parseBotPage', () => {
  it('parses the point peddler fixture', () => {
    const parsed = parseBotPage(fixture)
    expect(parsed).toMatchObject({
      name: 'point peddler',
      creatorName: 'Daniel',
    })
    expect(parsed?.ogImageUrl).toContain('opengraph-image')
    expect(parsed?.promptExcerpt).toContain('award-travel')
  })

  it('keeps og:description when content contains the other quote', () => {
    const html = `<html><head>
<meta property="og:title" content="quoted bot by Ada"/>
<meta property='og:description' content='Say "hello" then go'/>
</head></html>`
    const parsed = parseBotPage(html)
    expect(parsed?.promptExcerpt).toBe('Say "hello" then go')
  })

  it('handles a title with no by suffix', () => {
    const html =
      '<html><head><meta property="og:title" content="solo bot"/></head></html>'
    expect(parseBotPage(html)).toEqual({
      name: 'solo bot',
      creatorName: undefined,
      ogImageUrl: undefined,
      promptExcerpt: undefined,
    })
  })

  it('falls back to title when og tags are missing', () => {
    const html = '<html><head><title>plain by Ada</title></head></html>'
    expect(parseBotPage(html)).toEqual({
      name: 'plain',
      creatorName: 'Ada',
      ogImageUrl: undefined,
      promptExcerpt: undefined,
    })
  })

  it('returns null when no title exists', () => {
    expect(parseBotPage('<html><head></head></html>')).toBeNull()
  })
})

describe('normalizeTags', () => {
  it('lowercases, trims, and caps at five', () => {
    expect(
      normalizeTags([' Travel ', 'POINTS', 'Travel', 'a', 'b', 'c', 'd']),
    ).toEqual(['travel', 'points', 'a', 'b', 'c'])
  })
})
