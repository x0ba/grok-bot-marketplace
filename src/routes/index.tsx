import { useAuth } from '@clerk/tanstack-react-start'
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { BotCard } from '#/components/bot-card'
import { Button } from '#/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'

export const Route = createFileRoute('/')({
  component: FeedPage,
  head: () => ({
    meta: [{ title: 'Grok Bot Marketplace' }],
  }),
})

function FeedPage() {
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const { isSignedIn } = useAuth()
  const toggleUpvote = useMutation(api.votes.toggleUpvote)
  const pendingRef = useRef(new Set<Id<'bots'>>())
  const [pendingVotes, setPendingVotes] = useState(
    () => new Set<Id<'bots'>>(),
  )

  const listArgs = useMemo(() => ({}), [])
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

  return (
    <main className="page-wrap feed-page">
      <header className="feed-header">
        <h1 className="feed-title">Catalog</h1>
        <p className="feed-lede">
          Shared Grok bot templates, ranked by the crowd.
        </p>
      </header>

      <Tabs
        value={sort}
        onValueChange={(value) => setSort(value as 'top' | 'new')}
      >
        <TabsList>
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>
        <TabsContent value={sort} className="feed-list">
          {active.results.length === 0 && active.status === 'Exhausted' ? (
            <p className="catalog-empty-copy">No bots yet</p>
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
                    onVote={() => {
                      void handleVote(bot._id)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {active.status === 'CanLoadMore' ? (
            <Button
              type="button"
              variant="secondary"
              className="feed-more"
              onClick={() => active.loadMore(20)}
            >
              Load more
            </Button>
          ) : null}
          {active.status === 'LoadingMore' ||
          active.status === 'LoadingFirstPage' ? (
            <p className="field-meta">Loading…</p>
          ) : null}
        </TabsContent>
      </Tabs>
    </main>
  )
}
