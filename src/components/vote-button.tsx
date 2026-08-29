import { useAuth, SignInButton } from '@clerk/tanstack-react-start'

export function VoteButton({
  score,
  voted,
  onVote,
  signedIn,
  onRequireSignIn,
}: {
  score: number
  voted: boolean
  onVote: () => void
  signedIn: boolean
  onRequireSignIn: () => void
}) {
  const { isSignedIn } = useAuth()
  const canVote = signedIn && isSignedIn

  if (!canVote) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="vote-btn"
          aria-label={`Upvote, ${score} votes. Sign in to vote.`}
          onClick={onRequireSignIn}
        >
          <span className="vote-arrow" aria-hidden>
            ▲
          </span>
          <span className="vote-score">{score}</span>
        </button>
      </SignInButton>
    )
  }

  return (
    <button
      type="button"
      className={voted ? 'vote-btn is-voted' : 'vote-btn'}
      aria-pressed={voted}
      aria-label={voted ? `Remove upvote, ${score} votes` : `Upvote, ${score} votes`}
      onClick={onVote}
    >
      <span className="vote-arrow" aria-hidden>
        ▲
      </span>
      <span className="vote-score">{score}</span>
    </button>
  )
}
