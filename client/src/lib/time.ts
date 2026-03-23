// src/lib/time.ts
function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

export function formatMMSS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${pad2(mm)}:${pad2(ss)}`
}

export function msSince(iso: string, nowMs: number) {
  return nowMs - new Date(iso).getTime()
}
