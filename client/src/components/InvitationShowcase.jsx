// Decorative sample invitation card shown beside the sign-in / sign-up forms.
// Purely visual (aria-hidden) — the sample names are fictional.

export default function InvitationShowcase({ quote }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-bone bg-surface-container bg-[radial-gradient(#d1c5b4_1px,transparent_1px)] bg-size-[18px_18px] p-10 shadow-sheet"
    >
      <div className="relative mx-auto max-w-sm rounded-lg bg-white px-8 pt-10 pb-8 text-center shadow-float">
        <div className="pointer-events-none absolute inset-1.5 rounded-md border border-gold/40" />
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold font-serif text-2xl text-white italic ring-8 ring-gold/15">
          A&amp;N
        </div>
        <p className="mt-5 text-label-sm text-gold-text uppercase">Pure Elegance · Wedding</p>
        <p className="mt-2 font-serif text-headline-sm text-espresso">Amaya &amp; Nuwan</p>
        <div className="mx-auto my-4 h-px w-16 bg-gold" />
        <p className="font-serif text-body-md text-on-surface-variant italic">
          Saturday, the Twelfth of December
          <br />
          Two Thousand Twenty-Six
          <br />
          Mount Lavinia Hotel, Colombo
        </p>
        <div className="mt-6 rounded-lg bg-blush-tint px-4 py-3 text-left">
          <p className="text-label-sm text-on-surface-variant uppercase">Dear Amal Perera</p>
          <p className="text-title-md text-espresso">Will you join us?</p>
        </div>
      </div>

      {quote && (
        <figure className="mt-10 text-center">
          <blockquote className="font-serif text-headline-sm text-espresso italic">“{quote}”</blockquote>
          <figcaption className="mt-3 text-label-sm text-on-surface-variant uppercase">
            Create · Invite · Celebrate
          </figcaption>
        </figure>
      )}
    </div>
  )
}
