export type UserPermission = 'ADMIN' | 'MANAGER' | 'USER'

export type UserType = 'TALENT' | 'MANAGER' | 'SERVICE'

export type ExpenseStatus = 'PENDING' | 'PAID'

export type PaymentType = 'SALARY' | 'EXPENSE'

export type Expense = {
  id: string
  description: string
  amount: number
  isRecurring: boolean
  isSalary: boolean
  status: ExpenseStatus
  date: Date
  createdAt: Date
  updatedAt: Date
  userId: string
  talentId?: string | null
  user?: User
  talent?: Talent | null
  payment?: Payment | null
}

export type Payment = {
  id: string
  amount: number
  type: PaymentType
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
  userId: string
  expenseId?: string | null
  user?: User
  expense?: Expense | null
}

export type User = {
  id: string
  username: string
  email?: string | null
  password: string
  mustChangePassword: boolean
  createdAt: Date
  updatedAt: Date
  salary: number
  type: UserType
  permission: UserPermission
  manager?: Manager
  talent?: Talent
  payments?: Payment[]
}

export type Talent = {
  id: string
  name: string
  contractDate: Date
  annualBudget: number
  expenses?: Expense[]
  createdAt: Date
  updatedAt: Date
  twitch?: string | null
  youtube?: string | null
  tiktok?: string | null
  instagram?: string | null
  twitter?: string | null
  user?: User | null
  userId?: string | null
  manager?: Manager | null
  managerId?: string | null
}

export type Manager = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  user?: User | null
  userId?: string | null
  talents?: Talent[]
}

