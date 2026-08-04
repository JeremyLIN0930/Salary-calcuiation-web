/**
 * Utility functions for cleaning UI text displays.
 * Strips internal development/scope tags like [shared], [local], [temp], [legacy], [debug], [test].
 */

export function stripSystemTags(text?: string | null): string {
  if (!text) return ''
  return text
    .replace(/\[(shared|local|temp|legacy|debug|test)\]/gi, '')
    .trim()
}
