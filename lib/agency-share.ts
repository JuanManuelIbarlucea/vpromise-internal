/**
 * Calculate VPromise's agency share from a talent's monthly income.
 * - >= $1,000/month: 25%
 * - < $1,000/month: 45%
 */
export function calculateAgencyShare(monthlyTotal: number) {
  const rate = getAgencyRate(monthlyTotal)
  return monthlyTotal * rate
}

/**
 * Get the agency rate for a given monthly total.
 */
export function getAgencyRate(monthlyTotal: number) {
  return monthlyTotal >= 1000 ? 0.25 : 0.45
}
