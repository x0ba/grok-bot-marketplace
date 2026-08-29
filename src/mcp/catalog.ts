export type CatalogBot = {
  botId: string
  name: string
  creatorName?: string
  description?: string
  tags: Array<string>
  score: number
  url: string
}

export type ToolBotPayload = {
  name: string
  creator: string | null
  description: string | null
  tags: Array<string>
  score: number
  install_url: string
  bot_id: string
}

export function clampLimit(limit: number | undefined, fallback = 20): number {
  const n = limit === undefined ? fallback : Math.floor(limit)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(n, 50)
}

export function botToToolPayload(bot: CatalogBot): ToolBotPayload {
  return {
    name: bot.name,
    creator: bot.creatorName ?? null,
    description: bot.description ?? null,
    tags: bot.tags,
    score: bot.score,
    install_url: `https://x.ai/bot/${bot.botId}`,
    bot_id: bot.botId,
  }
}

export function getBotInstruction(botId: string): string {
  return `Open https://x.ai/bot/${botId} so the user can click Add to Grok Bot.`
}
