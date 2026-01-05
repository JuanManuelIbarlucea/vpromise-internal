import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Cleaning up all expenses and payments...\n')

  await prisma.payment.deleteMany({})
  await prisma.expense.deleteMany({})
  console.log('Deleted all expenses and payments.\n')

  const users = await prisma.user.findMany({
    where: { salary: { gt: 0 } },
    include: { talent: true },
  })

  console.log(`Found ${users.length} users to create expenses for.\n`)

  const startDate = new Date(2025, 3, 1) // April 2025
  const endDate = new Date(2026, 0, 1) // January 2026
  const months: Date[] = []

  let current = new Date(startDate)
  while (current <= endDate) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }

  console.log(`Creating expenses for ${months.length} months (April 2025 - January 2026).\n`)

  for (const user of users) {
    const talentName = user.talent?.name || user.username

    for (const month of months) {
      const isJanuary2026 = month.getFullYear() === 2026 && month.getMonth() === 0
      const status = isJanuary2026 ? 'PENDING' : 'PAID'

      const expense = await prisma.expense.create({
        data: {
          description: `Monthly Salary - ${talentName}`,
          amount: user.salary,
          category: 'Salary',
          isRecurring: true,
          isSalary: true,
          status,
          date: month,
          userId: user.id,
          talentId: user.talent?.id || null,
        },
      })

      if (!isJanuary2026) {
        await prisma.payment.create({
          data: {
            amount: expense.amount,
            type: 'SALARY',
            description: `Monthly Salary - ${talentName}`,
            date: month,
            userId: user.id,
            expenseId: expense.id,
          },
        })
      }
    }

    console.log(`  Created ${months.length} expenses for ${talentName}`)
  }

  console.log('\nCleanup complete!')

  const summary = await prisma.$transaction([
    prisma.expense.count({ where: { status: 'PAID' } }),
    prisma.expense.count({ where: { status: 'PENDING' } }),
    prisma.payment.count(),
  ])

  console.log('\nFinal state:')
  console.log(`  PAID expenses: ${summary[0]}`)
  console.log(`  PENDING expenses: ${summary[1]}`)
  console.log(`  Payments: ${summary[2]}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
