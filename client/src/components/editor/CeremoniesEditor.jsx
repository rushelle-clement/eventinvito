// Editor: an optional programme of ceremonies (e.g. Mehendi, Sangeet, Wedding, Reception).
// The couple names each one themselves — no tradition is assumed.

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

const MAX = 8
// Quick-add suggestions. Church and Poruwa ceremonies come first for every wedding design;
// the Royal Indian Wedding design also suggests Mehendi, Haldi and Sangeet.
const COMMON = ['Church ceremony', 'Poruwa ceremony', 'Wedding ceremony', 'Reception', 'Homecoming', 'Engagement']
const INDIAN = ['Mehendi', 'Haldi', 'Sangeet']
const suggestionsFor = (templateKey) =>
  templateKey === 'royal-red' ? [COMMON[0], COMMON[1], ...INDIAN, ...COMMON.slice(2)] : COMMON
const EMPTY = { name: '', date: '', time: '', venue: '', note: '' }

const inputClass = 'w-full rounded-lg border border-bone bg-white px-3 py-2 text-body-md outline-none focus:border-gold'

export default function CeremoniesEditor({ value = [], onChange, error, templateKey }) {
  const set = (i, key, v) => onChange(value.map((c, j) => (j === i ? { ...c, [key]: v } : c)))
  const remove = (i) => onChange(value.filter((_, j) => j !== i))
  const move = (i, d) => {
    const next = [...value]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const add = (name = '') => onChange([...value, { ...EMPTY, name }])
  const unused = suggestionsFor(templateKey).filter((s) => !value.some((c) => c.name.trim().toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <p className="text-label-md text-espresso uppercase">Ceremonies (optional)</p>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        Only add these if your celebration has separate events, such as a church ceremony or Poruwa ceremony followed by a reception.
        For a single event, leave this empty: the invitation simply shows the main date, time and venue, with no celebrations section.
      </p>

      {value.length > 0 && (
        <ol className="mt-3 space-y-3">
          {value.map((c, i) => (
            <li key={i} className="rounded-lg border border-bone bg-surface-container-low p-3">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-label-sm text-espresso" aria-hidden="true">
                  {i + 1}
                </span>
                <label className="sr-only" htmlFor={`cer-name-${i}`}>
                  Ceremony {i + 1} name
                </label>
                <input id={`cer-name-${i}`} value={c.name} maxLength={60} onChange={(e) => set(i, 'name', e.target.value)} placeholder="Name, e.g. Sangeet" className={inputClass} />
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface-container disabled:opacity-30" aria-label={`Move ceremony ${i + 1} up`}>
                  <ArrowUp size={15} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-surface-container disabled:opacity-30" aria-label={`Move ceremony ${i + 1} down`}>
                  <ArrowDown size={15} />
                </button>
                <button type="button" onClick={() => remove(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-error hover:bg-error-container" aria-label={`Remove ceremony ${i + 1}`}>
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="block text-body-sm text-on-surface-variant">
                  Date
                  <input type="date" value={c.date} onChange={(e) => set(i, 'date', e.target.value)} className={`mt-0.5 ${inputClass}`} />
                </label>
                <label className="block text-body-sm text-on-surface-variant">
                  Time
                  <input type="time" value={c.time} onChange={(e) => set(i, 'time', e.target.value)} className={`mt-0.5 ${inputClass}`} />
                </label>
                <label className="block text-body-sm text-on-surface-variant sm:col-span-2">
                  Venue (if different)
                  <input value={c.venue} maxLength={120} onChange={(e) => set(i, 'venue', e.target.value)} className={`mt-0.5 ${inputClass}`} />
                </label>
                <label className="block text-body-sm text-on-surface-variant sm:col-span-2">
                  Note (optional)
                  <input value={c.note} maxLength={200} onChange={(e) => set(i, 'note', e.target.value)} placeholder="e.g. Traditional attire" className={`mt-0.5 ${inputClass}`} />
                </label>
              </div>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {error}
        </p>
      )}

      {value.length < MAX && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => add()} className="btn-secondary px-4 py-2 text-body-sm">
            <Plus size={15} aria-hidden="true" /> Add ceremony
          </button>
          {unused.slice(0, 6).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant hover:border-gold hover:text-espresso">
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
