import type { ApiClient } from '~/types/api'

export const useApi = (): ApiClient => {
  const config = useRuntimeConfig()
  const { initData } = useTelegram()

  const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const rawInitData = toValue(initData)
    if (rawInitData) {
      headers['x-telegram-init-data'] = rawInitData
    }

    const response = await fetch(`${config.public.apiBase}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>
      const message = typeof body?.message === 'string' ? body.message : `API Error: ${response.status}`
      throw new Error(message)
    }

    return response.json() as Promise<T>
  }

  return {
    get: <T>(path: string): Promise<T> => request<T>(path),
    post: <T>(path: string, body?: unknown): Promise<T> =>
      request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown): Promise<T> =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    del: <T>(path: string): Promise<T> =>
      request<T>(path, { method: 'DELETE' }),
  }
}
