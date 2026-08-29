export type ParsedBotPage = {
  name: string
  creatorName?: string
  ogImageUrl?: string
  promptExcerpt?: string
}

export type ValidBotUrl = {
  url: string
  botId: string
}

export function validateBotUrl(raw: string): ValidBotUrl | null {
  const trimmed = raw.trim()
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (parsed.protocol !== 'https:') return null
  if (parsed.hostname !== 'x.ai') return null
  if (parsed.search || parsed.hash) {
    // strip query/hash by rebuilding from pathname only
  }

  const match = parsed.pathname.match(/^\/bot\/([A-Za-z0-9_-]+)$/)
  if (!match) return null

  const botId = match[1]
  if (!botId) return null
  return {
    botId,
    url: `https://x.ai/bot/${botId}`,
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&copy;/gi, '©')
    .replace(/&reg;/gi, '®')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function metaAttr(tag: string, name: string): string | undefined {
  const doubleQuoted = tag.match(
    new RegExp(`(?:^|[\\s])${name}\\s*=\\s*"([^"]*)"`, 'i'),
  )
  if (doubleQuoted?.[1] !== undefined) {
    return decodeHtmlEntities(doubleQuoted[1])
  }
  const singleQuoted = tag.match(
    new RegExp(`(?:^|[\\s])${name}\\s*=\\s*'([^']*)'`, 'i'),
  )
  if (singleQuoted?.[1] !== undefined) {
    return decodeHtmlEntities(singleQuoted[1])
  }
  return undefined
}

function metaContent(html: string, property: string): string | undefined {
  const metaTags = html.match(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi) ?? []
  for (const tag of metaTags) {
    if (metaAttr(tag, 'property') !== property) continue
    const content = metaAttr(tag, 'content')
    if (content) return content
  }
  return undefined
}

function documentTitle(html: string): string | undefined {
  const match = html.match(/<title>([^<]*)<\/title>/i)
  if (!match?.[1]) return undefined
  return decodeHtmlEntities(match[1].trim())
}

function splitNameAndCreator(title: string): {
  name: string
  creatorName?: string
} {
  const idx = title.lastIndexOf(' by ')
  if (idx === -1) return { name: title }
  const name = title.slice(0, idx).trim()
  const creatorName = title.slice(idx + 4).trim()
  return {
    name: name || title,
    creatorName: creatorName || undefined,
  }
}

export function parseBotPage(html: string): ParsedBotPage | null {
  const title = metaContent(html, 'og:title') ?? documentTitle(html)
  if (!title) return null

  const { name, creatorName } = splitNameAndCreator(title)
  const ogImageUrl = metaContent(html, 'og:image')
  const promptExcerpt = metaContent(html, 'og:description')

  return {
    name,
    creatorName,
    ogImageUrl,
    promptExcerpt,
  }
}

export function normalizeTags(tags: Array<string>): Array<string> {
  const seen = new Set<string>()
  const out: Array<string> = []
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase().slice(0, 24)
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    out.push(tag)
    if (out.length >= 5) break
  }
  return out
}

export function normalizeDescription(
  description: string | undefined,
): string | undefined {
  if (description === undefined) return undefined
  const trimmed = description.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, 500)
}
