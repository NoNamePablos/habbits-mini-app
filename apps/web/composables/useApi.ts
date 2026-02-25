import type { ApiClient } from '~/types/api'

const DEFAULT_TIMEOUT = 10_000
const MAX_RETRIES_GET = 1
const RETRY_BASE_DELAY = 1_000

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

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

    const method = options.method || 'GET'
    const maxRetries = method === 'GET' ? MAX_RETRIES_GET : 0
    const url = `${config.public.apiBase}${path}`

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          const body = await response.json().catch(() => ({})) as Record<string, unknown>
          const message = typeof body?.message === 'string' ? body.message : `API Error: ${response.status}`

          if (response.status >= 500 && attempt < maxRetries) {
            await delay(RETRY_BASE_DELAY * (attempt + 1))
            continue
          }

          throw new Error(message)
        }

        return response.json() as Promise<T>
      } catch (error: unknown) {
        clearTimeout(timeoutId)

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Request timeout')
        }

        if (attempt < maxRetries) {
          await delay(RETRY_BASE_DELAY * (attempt + 1))
          continue
        }

        throw error
      }
    }

    throw new Error('Request failed')
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
