import { useAuth } from '@clerk/tanstack-react-start'
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
<<<<<<< HEAD
import { useMemo, useRef, useState } from 'react'
=======
import { useEffect, useMemo, useState, useTransition } from 'react'
>>>>>>> 50283ad (fix(polish): auto-load more while tag-filtered pages are empty)
import { toast } from 'sonner'
import { z } from 'zod'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { BotCard } from '#/components/bot-card'
import { TagFilter } from '#/components/tag-filter'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'

const searchSchema = z.object({
  tag: z.string().optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  component: FeedPage,
  head: () => ({
    meta: [
      { title: 'Grok Bot Marketplace' },
      {
        name: 'description',
        content: 'Shared Grok bot templates, ranked by the crowd.',
      },
    ],
  }),
})

function FeedPage() {
  const { tag } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const { isSignedIn } = useAuth()
  const toggleUpvote = useMutation(api.votes.toggleUpvote)
  const pendingRef = useRef(new Set<Id<'bots'>>())
  const [pendingVotes, setPendingVotes] = useState(
    () => new Set<Id<'bots'>>(),
  )

  const listArgs = useMemo(
    () => ({ tag: tag?.toLowerCase().trim() || undefined }),
    [tag],
  )
  const top = usePaginatedQuery(
    api.feed.listTop,
    sort === 'top' ? listArgs : 'skip',
    { initialNumItems: 20 },
  )
  const newest = usePaginatedQuery(
    api.feed.listNew,
    sort === 'new' ? listArgs : 'skip',
    { initialNumItems: 20 },
  )

  const active = sort === 'top' ? top : newest
  const botIds = active.results.map((bot) => bot._id)
  const votedIds = useQuery(
    api.votes.myVoteBotIds,
    isSignedIn && botIds.length > 0 ? { botIds } : 'skip',
  )
  const votedSet = useMemo(() => new Set(votedIds ?? []), [votedIds])

<<<<<<< HEAD
  async function handleVote(botId: Id<'bots'>) {
    if (pendingRef.current.has(botId)) return
    pendingRef.current.add(botId)
    setPendingVotes(new Set(pendingRef.current))
    try {
      await toggleUpvote({ botId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Vote failed')
    } finally {
      pendingRef.current.delete(botId)
      setPendingVotes(new Set(pendingRef.current))
    }
  }
=======
  // Tag filter runs after pagination, so keep loading until a page has
  // matches or the catalog is exhausted (Convex allows one paginate/query).
  useEffect(() => {
    if (!tag) return
    if (active.status !== 'CanLoadMore') return
    if (active.results.length >= 20) return
    active.loadMore(20)
  }, [tag, active.status, active.results.length, active])
>>>>>>> 50283ad (fix(polish): auto-load more while tag-filtered pages are empty)

  function setTag(next: string | undefined) {
    void navigate({
      search: (prev) => ({ ...prev, tag: next }),
    })
  }

  const showEmpty =
    active.results.length === 0 &&
    (active.status === 'Exhausted' || active.status === 'CanLoadMore') ===
      false &&
    active.status !== 'LoadingFirstPage' &&
    active.status !== 'LoadingMore'

  const trulyEmpty =
    active.results.length === 0 &&
    active.status === 'Exhausted'

  return (
    <main className="page-wrap feed-page">
      <header className="feed-header">
        <h1 className="feed-title">Catalog</h1>
        <p className="feed-lede">
          Shared Grok bot templates, ranked by the crowd.
        </p>
      </header>

      {tag ? (
        <TagFilter activeTag={tag} onClear={() => setTag(undefined)} />
      ) : null}

      <Tabs
        value={sort}
        onValueChange={(value) => setSort(value as 'top' | 'new')}
      >
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
        <TabsContent value={sort} className="feed-list">
          {active.status === 'LoadingFirstPage' ||
          (tag &&
            active.results.length === 0 &&
            active.status === 'CanLoadMore') ||
          (tag &&
            active.results.length === 0 &&
            active.status === 'LoadingMore') ? (
            <div className="bot-list" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="feed-skeleton" />
              ))}
            </div>
          ) : trulyEmpty || showEmpty ? (
            <p className="catalog-empty-copy">
              {tag ? `No bots tagged ${tag}` : 'No bots yet'}
            </p>
          ) : (
            <ul className="bot-list">
              {active.results.map((bot) => (
                <li key={bot._id}>
                  <BotCard
                    bot={bot}
                    voted={votedSet.has(bot._id)}
                    signedIn={!!isSignedIn}
                    onRequireSignIn={() => undefined}
                    voteDisabled={pendingVotes.has(bot._id)}
                    onTagClick={(t) => setTag(t)}
                    onVote={() => {
                      void handleVote(bot._id)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {active.status === 'CanLoadMore' && active.results.length > 0 ? (
            <Button
              type="button"
              variant="secondary"
              className="feed-more"
              onClick={() => active.loadMore(20)}
            >
              Load more
            </Button>
          ) : null}
          {active.status === 'LoadingMore' && active.results.length > 0 ? (
            <p className="field-meta">Loading…</p>
          ) : null}
        </TabsContent>
      </Tabs>
    </main>
  )
}
