// A labelled input with an icon on the left, optional show/hide for passwords,
// and an error message linked to the input for screen readers.

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormField({ label, icon: Icon, error, type = 'text', labelAction, hint, ...inputProps }) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor={id} className="text-label-md text-espresso uppercase">
          {label}
        </label>
        {labelAction}
      </div>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant"
          />
        )}
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className="field-input"
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-2 text-body-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}
