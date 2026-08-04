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

export function errorResult<T>(
  error: any,
  table?: string,
  method?: string,
): RepositoryResult<T> {
  const errMsg = typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error)

  console.error(`[Repository Error] ${table || 'Unknown Table'} :: ${method || 'Unknown Method'}`)
  console.error(errMsg)

  return {
    success: false,
    data: null,
    error: errMsg,
  }
}

/**
 * Execute a repository action wrapped with console.group and console.time
 */
export async function traceRepoAction<T>(
  table: string,
  method: string,
  actionName: string,
  fn: () => Promise<RepositoryResult<T>>
): Promise<RepositoryResult<T>> {
  const label = `⏱️ [Repo Action] ${table}.${method}`
  console.group(label)
  console.time(label)
  try {
    const result = await fn()
    return result
  } finally {
    console.timeEnd(label)
    console.groupEnd()
  }
}
