// Editor: the wedding day agenda ("day plan") — a timed list of what happens on the day.
// Guests open it from a "Day plan" button on their invitation, and only when the couple switches
// it on. Part of Premium Plus and Signature (`limits.agenda`).

import { Eye, Plus, Trash2 } from 'lucide-react'

const MAX = 30
const EMPTY = { date: '', time: '', endTime: '', title: '', place: '', note: '' }
// Quick-add ideas; the couple can write anything
const IDEAS = ['Guests arrive', 'Poruwa ceremony', 'Church ceremony', 'Signing the register', 'Photos', 'Lunch', 'Cake cutting', 'First dance', 'Dinner', 'Going away']
const CORPORATE_IDEAS = ['Registration', 'Welcome address', 'Keynote', 'Panel discussion', 'Tea break', 'Lunch', 'Awards', 'Dinner', 'Networking', 'Closing']

const inputClass = 'w-full rounded-lg border border-bone bg-white px-3 py-2 text-body-md outline-none focus:border-gold'

export default function AgendaEditor({ value = [], visible = false, onChange, onVisible, error, allowed = true, planName, eventDate, onPreview, corporate = false }) {
  if (!allowed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-bone bg-surface-container-low px-4 py-3">
        <span className="mt-0.5 shrink-0 rounded-full bg-espresso px-2.5 py-0.5 text-label-sm text-ivory uppercase">Premium Plus</span>
        <p className="text-body-sm text-on-surface-variant">
          {corporate ? 'An event agenda' : 'A wedding day agenda'} — a timed plan of your day that guests open from your invitation, showing what’s happening now — is part of Premium Plus
          and Signature{planName ? `. Your package is ${planName}` : ''}. Contact EventInvito to upgrade.
        </p>
      </div>
    )
  }

  const set = (i, key, v) => onChange(value.map((a, j) => (j === i ? { ...a, [key]: v } : a)))
  const remove = (i) => onChange(value.filter((_, j) => j !== i))
  // A new item starts an hour after the last one, so the list grows in order
  const add = (title = '') => {
    const last = value[value.length - 1]
    let time = ''
    if (last?.time) {
      const [h, m] = last.time.split(':').map(Number)
      time = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    onChange([...value, { ...EMPTY, title, time, date: last?.date || '' }])
  }
  const unused = (corporate ? CORPORATE_IDEAS : IDEAS).filter((s) => !value.some((a) => a.title.trim().toLowerCase() === s.toLowerCase()))

  return (
    <div>
      <p className="text-body-sm text-on-surface-variant">
        {corporate ? 'Add the timings of your event — registration, the keynote, sessions, dinner and so on.' : 'Add the timings of your day — when guests should arrive, the ceremony, photos, lunch and so on.'} Guests open it from a <strong>Day plan</strong> button on
        their invitation, and on the day it highlights what’s happening now and what’s next. It’s saved in time order.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-bone bg-white px-4 py-3">
        <input type="checkbox" checked={visible} onChange={(e) => onVisible(e.target.checked)} className="mt-1 h-4 w-4 accent-[#b8964f]" />
        <span>
          <span className="block text-body-md text-espresso">Show the day plan to guests</span>
          <span className="block text-body-sm text-on-surface-variant">
            {visible ? 'Guests see a “Day plan” button on their invitation.' : 'Off: only you can see it. Switch it on when your timings are final.'}
          </span>
        </span>
      </label>

      {value.length > 0 && (
        <ol className="mt-4 space-y-3">
          {value.map((a, i) => (
            <li key={i} className="rounded-lg border border-bone bg-surface-container-low p-3">
              <div className="flex items-end gap-2">
                <label className="block w-36 shrink-0 text-body-sm text-on-surface-variant">
                  Time
                  <input type="time" value={a.time} onChange={(e) => set(i, 'time', e.target.value)} className={`mt-0.5 ${inputClass}`} aria-label={`Item ${i + 1} time`} />
                </label>
                <label className="block min-w-0 flex-1 text-body-sm text-on-surface-variant">
                  What happens
                  <input value={a.title} maxLength={80} onChange={(e) => set(i, 'title', e.target.value)} placeholder={corporate ? 'e.g. Keynote' : 'e.g. Poruwa ceremony'} className={`mt-0.5 ${inputClass}`} aria-label={`Item ${i + 1}: what happens`} />
                </label>
                <button type="button" onClick={() => remove(i)} className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-error hover:bg-error-container" aria-label={`Remove item ${i + 1}`}>
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="block text-body-sm text-on-surface-variant">
                  Until (optional)
                  <input type="time" value={a.endTime} onChange={(e) => set(i, 'endTime', e.target.value)} className={`mt-0.5 ${inputClass}`} />
                </label>
                <label className="block text-body-sm text-on-surface-variant">
                  Place (optional)
                  <input value={a.place} maxLength={120} onChange={(e) => set(i, 'place', e.target.value)} placeholder="e.g. Main lawn" className={`mt-0.5 ${inputClass}`} />
                </label>
                <label className="block text-body-sm text-on-surface-variant sm:col-span-2">
                  Note (optional)
                  <input value={a.note} maxLength={200} onChange={(e) => set(i, 'note', e.target.value)} placeholder="e.g. Please be seated by 10:15" className={`mt-0.5 ${inputClass}`} />
                </label>
                <label className="block text-body-sm text-on-surface-variant sm:col-span-2">
                  Day (only if it isn’t the main event day, e.g. after midnight)
                  <input type="date" value={a.date} onChange={(e) => set(i, 'date', e.target.value)} className={`mt-0.5 ${inputClass} sm:w-56`} placeholder={eventDate} />
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {value.length < MAX && (
          <>
            <button type="button" onClick={() => add()} className="btn-secondary px-4 py-2 text-body-sm">
              <Plus size={15} aria-hidden="true" /> Add to the plan
            </button>
            {unused.slice(0, 6).map((s) => (
              <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-outline-variant px-3 py-1 text-body-sm text-on-surface-variant hover:border-gold hover:text-espresso">
                + {s}
              </button>
            ))}
          </>
        )}
      </div>

      {value.length > 0 && (
        <button type="button" onClick={onPreview} className="btn-secondary mt-4 px-4 py-2 text-body-sm">
          <Eye size={15} aria-hidden="true" /> Preview the day plan
        </button>
      )}
    </div>
  )
}
