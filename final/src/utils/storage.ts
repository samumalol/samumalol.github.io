export const storageKey = 'axon-focus-calendar-v1'

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}
