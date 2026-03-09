import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Fixing payment dates to match expense dates...\n')

  const payments = await prisma.payment.findMany({
    where: {
      expenseId: { not: null },
    },
    include: {
      expense: true,
    },
    orderBy: { date: 'asc' },
  })

  console.log(`Found ${payments.length} payments linked to expenses\n`)

  if (payments.length === 0) {
    console.log('No payments to fix!')
    return
  }

  let fixedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const payment of payments) {
    if (!payment.expense) {
      console.log(`  Skipping payment ${payment.id} - expense not found`)
      skippedCount++
      continue
    }

    const paymentDate = new Date(payment.date)
    const expenseDate = new Date(payment.expense.date)

    if (paymentDate.getTime() === expenseDate.getTime()) {
      skippedCount++
      continue
    }

    try {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { date: payment.expense.date },
      })

      const paymentDateStr = paymentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const expenseDateStr = expenseDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      console.log(
        `  Fixed payment ${payment.id}: ${paymentDateStr} -> ${expenseDateStr} (${payment.description})`
      )
      fixedCount++
    } catch (error) {
      console.error(`  Error fixing payment ${payment.id}:`, error)
      errorCount++
    }
  }

  console.log('\nSummary:')
  console.log(`  Fixed: ${fixedCount}`)
  console.log(`  Skipped (already correct): ${skippedCount}`)
  console.log(`  Errors: ${errorCount}`)
  console.log(`  Total: ${payments.length}`)
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
