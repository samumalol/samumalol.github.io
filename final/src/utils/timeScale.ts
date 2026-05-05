export function durationToHeight(minutes: number): number {
  const base = 0.6
  return base * Math.log1p(Math.max(0, minutes))
}

export function formatDuration(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes))
  if (rounded < 60) {
    return `${rounded} min`
  }

  const hours = Math.floor(rounded / 60)
  const mins = rounded % 60
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

export function minutesBetween(startIso: string, endIso = new Date().toISOString()): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}
