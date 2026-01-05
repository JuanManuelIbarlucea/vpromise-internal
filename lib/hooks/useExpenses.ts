import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface Expense {
  id: string
  description: string
  amount: number
  status: 'PENDING' | 'PAID'
  isRecurring: boolean
  isSalary: boolean
  date: string
  createdAt: string
  updatedAt: string
  userId: string
  talentId?: string | null
  user?: { id: string; username: string; type: string }
  talent?: { id: string; name: string } | null
}

export function useExpenses() {
  const { data, error, isLoading, mutate } = useSWR<Expense[]>('/api/expenses', fetcher)

  return {
    expenses: data,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useExpenseStats() {
  const { data, error, isLoading } = useSWR<{
    total: number
    count: number
  }>('/api/expenses/stats', fetcher)

  return {
    stats: data,
    isLoading,
    isError: error,
  }
}
