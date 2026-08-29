import { useAuth, Show, SignInButton } from '@clerk/tanstack-react-start'
import { useAction } from 'convex/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { api } from '../../convex/_generated/api'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { validateBotUrl } from '../../convex/lib/parseBotPage'

export const Route = createFileRoute('/submit')({
  component: SubmitPage,
  head: () => ({
    meta: [{ title: 'Submit · Grok Bot Marketplace' }],
  }),
})

type Preview = {
  botId: string
  url: string
  name: string
  creatorName?: string
  ogImageUrl?: string
  promptExcerpt?: string
}

function SubmitPage() {
  return (
    <Show
      when="signed-in"
      fallback={
        <main className="page-wrap submit-gate">
          <h1 className="submit-title">Submit a bot</h1>
          <p className="submit-lede">
            Sign in to paste an x.ai share link and list it in the catalog.
          </p>
          <SignInButton mode="modal">
            <button type="button" className="clerk-sign-in">
              Sign in
            </button>
          </SignInButton>
        </main>
      }
    >
      <SubmitForm />
    </Show>
  )
}

function SubmitForm() {
  const fetchPreview = useAction(api.bots.fetchBotPreview)
  const submitBot = useAction(api.bots.submitBot)
  const navigate = useNavigate()
  const { isSignedIn } = useAuth()

  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [duplicateBotId, setDuplicateBotId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<Array<string>>([])
  const [description, setDescription] = useState('')
  const [previewPending, startPreview] = useTransition()
  const [publishPending, startPublish] = useTransition()

  function onUrlBlur() {
    const valid = validateBotUrl(url)
    if (!url.trim()) {
      setUrlError(null)
      return
    }
    if (!valid) {
      setUrlError('Use a link like https://x.ai/bot/…')
      setPreview(null)
      return
    }
    setUrlError(null)
    setDuplicateBotId(null)
    startPreview(async () => {
      try {
        const result = await fetchPreview({ url: valid.url })
        setPreview(result)
        setUrl(valid.url)
      } catch (error) {
        setPreview(null)
        setUrlError(
          error instanceof Error
            ? error.message
            : 'The bot page could not be read.',
        )
      }
    })
  }

  function addTag() {
    const next = tagInput.trim().toLowerCase().slice(0, 24)
    if (!next) return
    if (tags.length >= 5) {
      setTagInput('')
      return
    }
    if (tags.includes(next)) {
      setTagInput('')
      return
    }
    setTags([...tags, next])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function onPublish() {
    if (!preview || !isSignedIn) return
    if (description.length > 500) return
    setDuplicateBotId(null)
    startPublish(async () => {
      try {
        await submitBot({
          url: preview.url,
          tags,
          description: description || undefined,
        })
        toast.success(`Listed ${preview.name}`)
        void navigate({ to: '/' })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Submit failed'
        const dup = message.match(/Bot already listed:([A-Za-z0-9_-]+)/)
        if (dup?.[1]) {
          setDuplicateBotId(dup[1])
          return
        }
        toast.error(message)
      }
    })
  }

  const descLen = description.length
  const canPublish =
    !!preview && !previewPending && !publishPending && descLen <= 500

  return (
    <main className="page-wrap submit-page">
      <header className="submit-header">
        <h1 className="submit-title">Submit a bot</h1>
        <p className="submit-lede">
          Paste an x.ai share link. We read the page and list what we find.
        </p>
      </header>

      <div className="submit-grid">
        <section className="submit-form-panel">
          <div className="field">
            <Label htmlFor="bot-url">x.ai bot link</Label>
            <Input
              id="bot-url"
              value={url}
              placeholder="https://x.ai/bot/…"
              onChange={(e) => {
                setUrl(e.target.value)
                setUrlError(null)
                setDuplicateBotId(null)
              }}
              onBlur={onUrlBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onUrlBlur()
                }
              }}
              aria-invalid={!!urlError}
            />
            {urlError ? <p className="field-error">{urlError}</p> : null}
            {duplicateBotId ? (
              <p className="field-error">
                This bot is already listed.{' '}
                <a href={`/bot/${duplicateBotId}`}>View listing</a>
              </p>
            ) : null}
          </div>

          <div className="field">
            <Label htmlFor="tags">Tags</Label>
            <div className="tag-row">
              <Input
                id="tags"
                value={tagInput}
                placeholder={
                  tags.length >= 5 ? 'Tag limit reached' : 'Add a tag'
                }
                disabled={tags.length >= 5}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 ? (
              <ul className="tag-list">
                {tags.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      className="tag-chip"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="field-meta">{tags.length}/5 tags</p>
          </div>

          <div className="field">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              maxLength={600}
              rows={4}
              placeholder="Optional note for browsers (max 500)"
              onChange={(e) => setDescription(e.target.value)}
            />
            <p
              className={
                descLen > 500 ? 'field-meta field-error' : 'field-meta'
              }
            >
              {descLen}/500
            </p>
          </div>

          <Button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
            className="submit-publish"
          >
            {publishPending ? 'Publishing…' : 'Publish'}
          </Button>
        </section>

        <aside className="submit-preview" aria-live="polite">
          {previewPending ? (
            <p className="submit-preview-empty">Reading bot page…</p>
          ) : preview ? (
            <article className="bot-preview">
              {preview.ogImageUrl ? (
                <img
                  src={preview.ogImageUrl}
                  alt=""
                  className="bot-preview-image"
                />
              ) : null}
              <h2 className="bot-preview-name">{preview.name}</h2>
              {preview.creatorName ? (
                <p className="bot-preview-creator">by {preview.creatorName}</p>
              ) : null}
              {preview.promptExcerpt ? (
                <p className="bot-preview-excerpt">{preview.promptExcerpt}</p>
              ) : null}
            </article>
          ) : (
            <p className="submit-preview-empty">
              Preview appears after a valid link.
            </p>
          )}
        </aside>
      </div>
    </main>
  )
}
