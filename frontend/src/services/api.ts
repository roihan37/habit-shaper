export type ApiSuccess<T> = {
  data: T
}

export type ApiErrorResponse = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(status: number, response?: ApiErrorResponse) {
    super(response?.error.message ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = response?.error.code
    this.details = response?.error.details
  }
}

export const API_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
).replace(/\/$/, '')

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false
  }

  const error = value.error
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  )
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) return undefined
  return response.json()
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiSuccess<T> | undefined> {
  const headers = new Headers(options.headers)
  const hasBody = options.body !== undefined

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}/${path.replace(/^\//, '')}`, {
    ...options,
    headers,
    credentials: 'include',
    body: hasBody ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) return undefined

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      isApiErrorResponse(payload) ? payload : undefined,
    )
  }

  return payload as ApiSuccess<T>
}
