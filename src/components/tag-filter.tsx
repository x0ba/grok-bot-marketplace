import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'

export function TagFilter({
  activeTag,
  onClear,
}: {
  activeTag: string
  onClear: () => void
}) {
  return (
    <div className="tag-filter">
      <span className="field-meta">Filtered by</span>
      <Badge variant="secondary">{activeTag}</Badge>
      <button type="button" className="tag-clear" onClick={onClear}>
        Clear
      </button>
      <Link to="/" search={{}} className="sr-only">
        Clear filter
      </Link>
    </div>
  )
}
