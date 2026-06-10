import { redirect } from 'next/navigation'
import { api, ApiError } from './api'

// Wrapper server-only do api client.
// Intercepta 401 e redireciona para /login automaticamente.
// Use este módulo em Server Components e Server Actions (nunca em Client Components).

function withAuthGuard<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err) => {
    if (err instanceof ApiError && err.status === 401) {
      redirect('/login')
    }
    throw err
  })
}

export const serverApi = {
  get: <T>(path: string, token?: string) => withAuthGuard(api.get<T>(path, token)),
  post: <T>(path: string, body: unknown, token?: string) => withAuthGuard(api.post<T>(path, body, token)),
  patch: <T>(path: string, body: unknown, token?: string) => withAuthGuard(api.patch<T>(path, body, token)),
  delete: <T>(path: string, token?: string) => withAuthGuard(api.delete<T>(path, token)),
}

export { ApiError } from './api'
