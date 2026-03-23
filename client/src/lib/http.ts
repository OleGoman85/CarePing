import { API_BASE } from './config'

export type ApiOk<T> = { ok: true } & T
export type ApiErr = { ok: false; error: string; message: string }
export type ApiResp<T> = ApiOk<T> | ApiErr

export async function requestOk<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiOk<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = (await res.json()) as ApiResp<T>

  if (!res.ok || !data.ok) {
    const msg = !data.ok
      ? data.message
      : `Request failed: ${res.status} ${res.statusText}`
    throw new Error(msg)
  }

  return data
}
