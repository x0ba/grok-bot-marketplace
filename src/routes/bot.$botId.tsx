import { useQuery } from 'convex/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { api } from '../../convex/_generated/api'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/bot/$botId')({
  component: BotDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: `Bot · Grok Bot Marketplace` },
      { property: 'og:title', content: params.botId },
      {
        property: 'og:description',
        content: 'Shared Grok bot template on Grok Bot Marketplace',
      },
    ],
  }),
})

function BotDetailPage() {
  const { botId } = Route.useParams()
  const bot = useQuery(api.feed.getByBotId, { botId })

  useEffect(() => {
    if (bot === undefined) return
    if (bot === null) {
      document.title = 'Bot not found · Grok Bot Marketplace'
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', 'Bot not found')
      const ogDesc = document.querySelector('meta[property="og:description"]')
      if (ogDesc) {
        ogDesc.setAttribute(
          'content',
          'Shared Grok bot template on Grok Bot Marketplace',
        )
      }
      return
    }

    document.title = bot.name
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', bot.name)
    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) {
      ogDesc.setAttribute(
        'content',
        bot.description ?? 'Shared Grok bot template on Grok Bot Marketplace',
      )
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
      <Button asChild className="bot-detail-cta">
        <a href={bot.url} target="_blank" rel="noreferrer">
          Add to Grok Bot
        </a>
      </Button>
    </main>
  )
}
