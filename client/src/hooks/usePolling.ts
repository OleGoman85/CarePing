import { useEffect } from 'react'

export function usePolling(fn: () => Promise<void>, everyMs: number) {
  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        await fn()
      } catch (e) {
        if (!cancelled) console.error(e)
      }
    }

    void run()

    const id = window.setInterval(() => {
      void run()
    }, everyMs)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [fn, everyMs])
}
