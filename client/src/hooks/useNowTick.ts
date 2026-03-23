import { useEffect, useRef, useState } from 'react'

export function useNowTick(intervalMs: number = 250) {
  const nowRef = useRef<number>(0)
  const [, force] = useState(0)

  useEffect(() => {
    let alive = true

    // Update ref immediately after mount (no setState here)
    nowRef.current = Date.now()

    // First render tick - async, so no "setState synchronously in effect body"
    const kick = window.setTimeout(() => {
      if (!alive) return
      force((x) => x + 1)
    }, 0)

    const id = window.setInterval(() => {
      nowRef.current = Date.now()
      force((x) => x + 1)
    }, intervalMs)

    return () => {
      alive = false
      window.clearTimeout(kick)
      window.clearInterval(id)
    }
  }, [intervalMs])

  return nowRef
}
