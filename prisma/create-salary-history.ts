import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const startDate = new Date('2025-04-01')
  const now = new Date()
  
  const months: Date[] = []
  const current = new Date(startDate)
  while (current <= now) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }

  console.log(`Generating salary data for ${months.length} months (April 2025 - ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`)

  const usersWithSalary = await prisma.user.findMany({
    where: { salary: { gt: 0 } },
    include: {
      talent: { select: { id: true, name: true } },
      manager: { select: { id: true, name: true } },
    },
  })

  console.log(`Found ${usersWithSalary.length} users with salary > 0`)

  let expenseCount = 0
  let paymentCount = 0

  for (const user of usersWithSalary) {
    const name = user.talent?.name || user.manager?.name || user.username
    const talentId = user.talent?.id

    console.log(`\nProcessing: ${name} (${user.type}) - $${user.salary}/month`)

    for (const month of months) {
      const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      const existingExpense = await prisma.expense.findFirst({
        where: {
          userId: user.id,
          isSalary: true,
          date: {
            gte: new Date(month.getFullYear(), month.getMonth(), 1),
            lt: new Date(month.getFullYear(), month.getMonth() + 1, 1),
          },
        },
      })

      if (!existingExpense) {
        await prisma.expense.create({
          data: {
            description: `Monthly Salary - ${name}`,
            amount: user.salary,
            category: 'Salary',
            isRecurring: true,
            isSalary: true,
            status: 'PAID',
            userId: user.id,
            talentId: talentId || null,
            date: month,
          },
        })
        expenseCount++
      }

      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId: user.id,
          type: 'SALARY',
          date: {
            gte: new Date(month.getFullYear(), month.getMonth(), 1),
            lt: new Date(month.getFullYear(), month.getMonth() + 1, 1),
          },
        },
      })

      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            amount: user.salary,
            type: 'SALARY',
            description: `Salary - ${monthStr} - ${name}`,
            userId: user.id,
            date: month,
          },
        })
        paymentCount++
        console.log(`  Created payment for ${monthStr}`)
      } else {
        console.log(`  Skipped ${monthStr} (already exists)`)
      }
    }
  }

  console.log(`\n✓ Created ${expenseCount} salary expenses`)
  console.log(`✓ Created ${paymentCount} salary payments`)
  console.log('\nDone!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

