import { Link } from '@tanstack/react-router'
import type { Doc } from '../../convex/_generated/dataModel'
import { VoteButton } from '#/components/vote-button'
import { Badge } from '#/components/ui/badge'

export function BotCard({
  bot,
  voted,
  onVote,
  signedIn,
  onRequireSignIn,
}: {
  bot: Doc<'bots'>
  voted: boolean
  onVote: () => void
  signedIn: boolean
  onRequireSignIn: () => void
}) {
  return (
    <article className="bot-row">
      <VoteButton
        score={bot.score}
        voted={voted}
        onVote={onVote}
        signedIn={signedIn}
        onRequireSignIn={onRequireSignIn}
      />
      <div className="bot-row-body">
        <Link
          to="/bot/$botId"
          params={{ botId: bot.botId }}
          className="bot-row-name"
        >
          {bot.name}
        </Link>
        {bot.creatorName ? (
          <p className="bot-row-creator">by {bot.creatorName}</p>
        ) : null}
        {bot.tags.length > 0 ? (
          <ul className="bot-row-tags">
            {bot.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary">{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
