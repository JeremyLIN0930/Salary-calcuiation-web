/**
 * Number & Currency formatting utilities.
 */

export function formatCurrency(n: number | undefined | null): string {
  const val = n ?? 0
  if (val === 0) return '—'
  return val.toLocaleString('zh-TW')
}

export function parseNumber(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}
