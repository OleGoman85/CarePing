import type { Weekday } from '../../hooks/useLocalReminders'
import { formatMMSS, msSince } from '../../lib/time'
import type { CheckInEvent } from '../../lib/api'

export type CheckInSettings = {
  days: Weekday[]
  timeHHMM: string
  intervalHours: 1 | 2 | 3
}

export const CHECKIN_LS_KEY = 'careping_checkin_settings'

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
  { key: 'SAT', label: 'Sat' },
  { key: 'SUN', label: 'Sun' },
]

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export type ReceiverUI = {
  title: string
  okColor: string
  okDisabled: boolean
  okLabel: string
  timerText: string
  hintText: string
}

export function buildReceiverUI(
  active: CheckInEvent | null,
  nowMs: number,
): ReceiverUI {
  if (!active) {
    return {
      title: 'No active check-in',
      okColor: 'bg-emerald-500',
      okDisabled: true,
      okLabel: 'OK',
      timerText: 'Press “Start simulation” to run the demo flow.',
      hintText: 'Demo flow: Green 0–30s → Red 30–60s → Escalate at 60s.',
    }
  }

  const elapsed = msSince(active.scheduledFor, nowMs)
  const isRed = elapsed >= 30_000
  const okDisabled = active.status !== 'PENDING'

  const msToRed = 30_000 - elapsed
  const msToEsc = 60_000 - elapsed

  const timerText =
    active.status === 'PENDING'
      ? `to RED: ${formatMMSS(msToRed)} • to ESCALATE: ${formatMMSS(msToEsc)}`
      : `status: ${active.status}`

  const okLabel = active.status === 'PENDING' ? 'OK' : active.status

  return {
    title: active.plan.title,
    okColor: isRed ? 'bg-red-500' : 'bg-emerald-500',
    okDisabled,
    okLabel,
    timerText,
    hintText:
      'If no OK: system reminds once → then escalates to caregiver (right phone shows alert).',
  }
}
