import { debugLogger } from '../utils/debugLogger'

export interface RepositoryResult<T> {
  success: boolean
  data: T | null
  error: any
}

export function successResult<T>(data: T, actionName?: string): RepositoryResult<T> {
  if (actionName) {
    debugLogger.addLog(actionName, 'Success')
  }
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
  actionName?: string
): RepositoryResult<T> {
  const errMsg = typeof error === 'object' && error !== null && 'message' in error ? error.message : String(error)

  if (actionName) {
    debugLogger.addLog(actionName, 'Failed', errMsg)
  }

  // Enhanced Error Diagnostic Group
  console.group(`❌ [Repository Error] ${table || 'Unknown Table'} :: ${method || 'Unknown Method'}`)
  console.error('Table:', table || 'N/A')
  console.error('Method:', method || 'N/A')
  console.error('Error Details:', error)
  if (error && error.stack) {
    console.error('Stack Trace:', error.stack)
  }
  console.groupEnd()

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
