/**
 * Format a free-form date string into YYYY-MM-DD.
 * - Keeps only digits
 * - Limits year to 4 digits, month/day to 2 digits
 * - Inserts dashes automatically (YYYY-MM-DD)
 */
export function formatBirthDateInput(value: string) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 8)
  const year = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day = digits.slice(6, 8)

  let formatted = year
  if (month) formatted += `-${month}`
  if (day) formatted += `-${day}`
  return formatted
}

/**
 * @deprecated use formatBirthDateInput
 */
export function sanitizeBirthDateYear(value: string) {
  return formatBirthDateInput(value)
}
