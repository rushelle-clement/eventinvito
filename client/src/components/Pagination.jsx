// Page controls for long lists: "1–25 of 60", a per-page choice, and ‹ 1 2 … 9 › buttons.
// Used by the guest list and the import review.

import { ChevronLeft, ChevronRight } from 'lucide-react'

// Page buttons: the first, the last and those around the current page, with … between
function pageNumbers(page, count) {
  const keep = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count))
  const list = [...keep].sort((a, b) => a - b)
  const out = []
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push('…')
    out.push(n)
  })
  return out
}

export default function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [25, 50, 100], label = 'Pages', className = '' }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total <= sizes[0]) return null
  return (
    <nav className={`flex flex-col gap-3 text-body-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between ${className}`} aria-label={label}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="tabular-nums">
          {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        {onPageSize && (
          <label className="flex items-center gap-2">
            Show
            <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className="rounded-full border border-bone bg-ivory py-1 pr-7 pl-3 text-body-sm text-espresso outline-none focus:border-gold">
              {sizes.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            per page
          </label>
        )}
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-container disabled:opacity-40" onClick={() => onPage(page - 1)} disabled={page === 1} aria-label="Previous page">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          {pageNumbers(page, pageCount).map((n, i) =>
            n === '…' ? (
              <span key={`gap-${i}`} className="px-1">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                aria-current={n === page ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-full px-2 tabular-nums ${n === page ? 'bg-espresso text-white' : 'text-espresso hover:bg-surface-container'}`}
              >
                {n}
              </button>
            ),
          )}
          <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-container disabled:opacity-40" onClick={() => onPage(page + 1)} disabled={page === pageCount} aria-label="Next page">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      )}
    </nav>
  )
}
