// A still of a design's opening screen (envelope, palace gateway, photo title card, roses),
// drawn by the real invitation code on a 440 × 620 "phone" and scaled to fill its box like a
// photo crop. Used by the gallery, home page, dashboard and the editor's design picker.

import { useLayoutEffect, useRef, useState } from 'react'
import InvitationExperience from './experience/InvitationExperience'
import { sampleInvitation } from './themes'
import { sampleGuestName } from './strings'

const W = 440
const H = 620

export default function TemplateThumbnail({ templateKey, invitation, height = 300, guestName, occasion }) {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Real invitations show their own content; the gallery uses the sample (plus sample photos)
  const data = invitation ? { ...invitation, templateKey } : sampleInvitation(templateKey, occasion)
  const scale = width ? Math.max(width / W, height / H) : 0

  return (
    <div ref={ref} aria-hidden="true" inert className="relative w-full overflow-hidden" style={{ height }}>
      {scale > 0 && (
        <div className="absolute top-1/2 left-1/2" style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}>
          <InvitationExperience invitation={data} guestName={guestName ?? sampleGuestName(data.language)} poster />
        </div>
      )}
    </div>
  )
}
