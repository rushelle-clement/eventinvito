// Fades content in as it scrolls into view. With "reduce motion" turned on (or in very old
// browsers) the content is simply shown — nothing is ever hidden behind an animation.

import { useEffect, useRef, useState } from 'react'

export default function Reveal({ as: Tag = 'div', delay = 0, variant = 'up', className = '', children, ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (shown) return undefined
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  return (
    <Tag ref={ref} className={`ei-reveal ei-reveal-${variant} ${shown ? 'is-shown' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  )
}
