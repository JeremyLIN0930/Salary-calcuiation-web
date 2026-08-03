export interface RepositoryResult<T> {
  success: boolean
  data: T | null
  error: any
}

export function successResult<T>(data: T): RepositoryResult<T> {
  return {
    success: true,
    data,
    error: null,
  }
}

export function errorResult<T>(error: any): RepositoryResult<T> {
  console.error('[Supabase Repository Error]:', error)
  return {
    success: false,
    data: null,
    error: typeof error === 'object' && error !== null && 'message' in error ? error.message : error,
  }
}
