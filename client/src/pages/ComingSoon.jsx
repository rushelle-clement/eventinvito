// Placeholder for pages that will be built in later phases.

import { Link } from 'react-router-dom'

export default function ComingSoon({ eyebrow = 'Coming soon', title, message = 'This page is coming soon.', backTo = '/', backLabel = 'Back to home' }) {
  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-16 md:px-margin">
      <div className="card px-6 py-16 text-center">
        <p className="eyebrow justify-center">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-headline-md text-espresso">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">{message}</p>
        <Link to={backTo} className="btn-secondary mt-6">
          {backLabel}
        </Link>
      </div>
    </div>
  )
}
