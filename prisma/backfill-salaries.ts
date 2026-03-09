import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const months = [
    new Date(2026, 1, 1), // Feb 2026
    new Date(2026, 2, 1), // Mar 2026
  ]

  const users = await prisma.user.findMany({
    where: { salary: { gt: 0 } },
    include: { talent: true },
  })

  console.log(`Found ${users.length} users with salary > 0.\n`)

  let created = 0
  let skipped = 0

  for (const user of users) {
    const talentName = user.talent?.name || user.username

    for (const month of months) {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1)
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)

      const existing = await prisma.expense.findFirst({
        where: {
          userId: user.id,
          isSalary: true,
          date: { gte: monthStart, lte: monthEnd },
        },
      })

      if (existing) {
        skipped++
        continue
      }

      await prisma.expense.create({
        data: {
          description: `Monthly Salary - ${talentName}`,
          amount: user.salary,
          category: 'Salary',
          isRecurring: true,
          isSalary: true,
          status: 'PENDING',
          date: month,
          userId: user.id,
          talentId: user.talent?.id || null,
        },
      })

      created++
      const label = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      console.log(`  Created ${label} salary expense for ${talentName}`)
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped (already existed).`)
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
