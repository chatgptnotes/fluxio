// IST Timezone Utilities (UTC+5:30 - Asia/Kolkata)
// All dates and times in reports and CSTPS pages are displayed in IST

/**
 * Format a date for display in IST timezone
 * Example output: "Jan 22, 2026"
 */
export function formatDateIST(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  })
}

/**
 * Format a date and time for display in IST timezone
 * Example output: "Jan 22, 2026, 10:30 AM"
 */
export function formatDateTimeIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  })
}

/**
 * Format time only for display in IST timezone
 * Example output: "10:30:45"
 */
export function formatTimeIST(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  })
}

/**
 * Format date only (DD/MM/YYYY format) in IST timezone
 * Example output: "22/01/2026"
 */
export function formatDateShortIST(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  })
}

/**
 * Format date with weekday in IST timezone
 * Example output: "Wed, Jan 22, 2026"
 */
export function formatDateWithWeekdayIST(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  })
}

/**
 * Format full datetime with weekday in IST timezone
 * Example output: "Wed, Jan 22, 2026 10:30:45"
 */
export function formatFullDateTimeIST(date: Date): string {
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  })
}
