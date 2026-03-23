// client/src/hooks/useLocalReminders.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export type LocalReminder = {
  id: string
  title: string
  timeHHMM: string
  days: Weekday[]
  lastFiredKey?: string
}

const LS_KEY = 'careping_local_reminders_v1'

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function toWeekday(d: number): Weekday {
  switch (d) {
    case 1:
      return 'MON'
    case 2:
      return 'TUE'
    case 3:
      return 'WED'
    case 4:
      return 'THU'
    case 5:
      return 'FRI'
    case 6:
      return 'SAT'
    default:
      return 'SUN'
  }
}

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function makeMinuteKey(date: Date) {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const mm = pad2(date.getMinutes())
  return `${y}-${m}-${d}T${hh}:${mm}`
}

export function useLocalReminders(nowMs: number) {
  const [items, setItems] = useState<LocalReminder[]>(() =>
    safeJsonParse<LocalReminder[]>(localStorage.getItem(LS_KEY), []),
  )

  const [popup, setPopup] = useState<LocalReminder | null>(null)

  const lastShownKeyByIdRef = useRef<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  }, [items])

  const addReminder = useCallback(
    (r: { title: string; timeHHMM: string; days: Weekday[] }) => {
      const id = crypto.randomUUID()
      setItems((prev) => [
        ...prev,
        {
          id,
          title: r.title,
          timeHHMM: r.timeHHMM,
          days: r.days,
        },
      ])
    },
    [],
  )

  const removeReminder = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
    delete lastShownKeyByIdRef.current[id]
  }, [])

  const markDone = useCallback((id: string, minuteKey: string) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, lastFiredKey: minuteKey } : x)),
    )
  }, [])

  useEffect(() => {
    const tick = () => {
      if (popup) return

      const now = new Date()
      const weekday = toWeekday(now.getDay())
      const hh = pad2(now.getHours())
      const mm = pad2(now.getMinutes())
      const nowHHMM = `${hh}:${mm}`
      const minuteKey = makeMinuteKey(now)

      for (const r of items) {
        if (!r.days.includes(weekday)) continue
        if (r.timeHHMM !== nowHHMM) continue

        if (r.lastFiredKey === minuteKey) continue

        const lastShownKey = lastShownKeyByIdRef.current[r.id]
        if (lastShownKey === minuteKey) continue

        lastShownKeyByIdRef.current[r.id] = minuteKey
        setPopup(r)
        break
      }
    }

    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [items, popup])

  const popupMinuteKey = useMemo(() => {
    if (!popup) return null
    const d = new Date(nowMs)
    if (Number.isNaN(d.getTime())) return null
    return makeMinuteKey(d)
  }, [popup, nowMs])

  const closePopupDone = useCallback(() => {
    if (!popup) return
    const minuteKey = popupMinuteKey ?? makeMinuteKey(new Date())
    markDone(popup.id, minuteKey)
    setPopup(null)
  }, [popup, popupMinuteKey, markDone])

  const closePopup = useCallback(() => {
    setPopup(null)
  }, [])

  return {
    items,
    addReminder,
    removeReminder,
    popup,
    closePopupDone,
    closePopup,
  }
}
