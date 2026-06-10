const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1'

function normalizeBaseUrl(value?: string) {
  const baseUrl = value?.trim() || DEFAULT_API_BASE_URL
  return baseUrl.replace(/\/+$/, '')
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)
}

export function getPublicApiBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL)
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}

export function buildPublicApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getPublicApiBaseUrl()}${normalizedPath}`
}
