import { AlertCircle } from 'lucide-react'

// Error banner shown at the top of a form (e.g. "Incorrect email or password.")
export default function FormAlert({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
      <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
