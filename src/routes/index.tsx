import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="page-wrap catalog-empty">
      <p className="catalog-empty-copy">No bots yet</p>
    </main>
  )
}
