import { useQuery } from 'convex/react'
import { ConvexHttpClient } from 'convex/browser'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'

import { api } from '../../convex/_generated/api'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

function resolveConvexUrl(): string {
  const fromVite = import.meta.env.VITE_CONVEX_URL
  if (typeof fromVite === 'string' && fromVite.length > 0) return fromVite
  const fromProcess = process.env.VITE_CONVEX_URL
  if (fromProcess) return fromProcess
  throw new Error('VITE_CONVEX_URL is not configured')
}

const fallbackDescription =
  'Shared Grok bot template on Grok Bot Marketplace'

function BotNotFound() {
  const { botId } = Route.useParams()
  return (
    <main className="page-wrap catalog-empty bot-404">
      <p className="catalog-empty-copy">Bot not found</p>
      <p className="submit-lede">
        No listing matches <code>{botId}</code>.
      </p>
      <Link to="/" className="nav-text">
        Back to catalog
      </Link>
    </main>
  )
}

export const Route = createFileRoute('/bot/$botId')({
  loader: async ({ params }) => {
    const convex = new ConvexHttpClient(resolveConvexUrl())
    const bot = await convex.query(api.feed.getByBotId, {
      botId: params.botId,
    })
    if (!bot) throw notFound()
    return { bot }
  },
  head: ({ loaderData, params }) => {
    const bot = loaderData?.bot
    if (!bot) {
      return {
        meta: [
          { title: 'Bot not found · Grok Bot Marketplace' },
          { property: 'og:title', content: params.botId },
          { property: 'og:description', content: fallbackDescription },
        ],
      }
    }
    return {
      meta: [
        { title: `${bot.name} · Grok Bot Marketplace` },
        { property: 'og:title', content: bot.name },
        {
          property: 'og:description',
          content: bot.description ?? fallbackDescription,
        },
      ],
    }
  },
  notFoundComponent: BotNotFound,
  component: BotDetailPage,
})

function BotDetailPage() {
  const { botId } = Route.useParams()
  const { bot: loaded } = Route.useLoaderData()
  const queried = useQuery(api.feed.getByBotId, { botId })
  const bot = queried === undefined ? loaded : queried

  useEffect(() => {
    if (bot === undefined) return
    if (bot === null) {
      document.title = 'Bot not found · Grok Bot Marketplace'
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', 'Bot not found')
      const ogDesc = document.querySelector('meta[property="og:description"]')
      if (ogDesc) ogDesc.setAttribute('content', fallbackDescription)
      return
    }

    document.title = `${bot.name} · Grok Bot Marketplace`
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', bot.name)
    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) {
      ogDesc.setAttribute('content', bot.description ?? fallbackDescription)
    }
  }, [bot])

  if (bot === undefined) {
    return (
      <main className="page-wrap catalog-empty">
        <p className="field-meta">Loading…</p>
      </main>
    )
  }

  if (bot === null) {
    return (
      <main className="page-wrap catalog-empty bot-404">
        <p className="catalog-empty-copy">Bot not found</p>
        <p className="submit-lede">
          No listing matches <code>{botId}</code>.
        </p>
        <Link to="/" className="nav-text">
          Back to catalog
        </Link>
      </main>
    )
  }

  return (
    <main className="page-wrap bot-detail">
      <p className="field-meta">
        <Link to="/" className="nav-text">
          Catalog
        </Link>
      </p>
      <h1 className="bot-detail-name">{bot.name}</h1>
      {bot.creatorName ? (
        <p className="bot-row-creator">by {bot.creatorName}</p>
      ) : null}
      <p className="bot-detail-score">{bot.score} upvotes</p>
      {bot.tags.length > 0 ? (
        <ul className="bot-row-tags">
          {bot.tags.map((tag) => (
            <li key={tag}>
              <Link to="/" search={{ tag }} className="tag-chip">
                <Badge variant="secondary">{tag}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {bot.description ? (
        <p className="bot-detail-copy">{bot.description}</p>
      ) : null}
      {bot.promptExcerpt ? (
        <p className="bot-detail-copy bot-detail-excerpt">{bot.promptExcerpt}</p>
      ) : null}
      <p className="bot-detail-cta">
        <Button asChild>
          <a href={bot.url} target="_blank" rel="noreferrer">
            Add to Grok Bot
          </a>
        </Button>
      </p>
    </main>
  )
}
