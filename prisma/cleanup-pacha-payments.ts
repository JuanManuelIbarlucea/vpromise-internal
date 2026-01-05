import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Finding Pacha payments to delete...\n')

  const pacha = await prisma.talent.findFirst({
    where: { name: { contains: 'Pacha', mode: 'insensitive' } },
    include: { user: true },
  })

  if (!pacha || !pacha.user) {
    console.log('Pacha not found!')
    return
  }

  console.log(`Found Pacha (userId: ${pacha.user.id})\n`)

  const payments = await prisma.payment.findMany({
    where: { userId: pacha.user.id },
    orderBy: { date: 'asc' },
  })

  console.log(`Total payments for Pacha: ${payments.length}`)

  const toDelete = payments.filter((p) => {
    const month = new Date(p.date).getMonth()
    const year = new Date(p.date).getFullYear()
    const isNovDec2025 = year === 2025 && (month === 10 || month === 11)
    return !isNovDec2025
  })

  console.log(`Payments to delete (not Nov/Dec 2025): ${toDelete.length}`)
  console.log(`Payments to keep (Nov/Dec 2025): ${payments.length - toDelete.length}\n`)

  if (toDelete.length === 0) {
    console.log('Nothing to delete!')
    return
  }

  for (const payment of toDelete) {
    const dateStr = new Date(payment.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    console.log(`  Deleting: ${dateStr} - ${payment.description}`)
  }

  const expenseIds = toDelete.map((p) => p.expenseId).filter(Boolean) as string[]

  await prisma.payment.deleteMany({
    where: { id: { in: toDelete.map((p) => p.id) } },
  })

  if (expenseIds.length > 0) {
    await prisma.expense.updateMany({
      where: { id: { in: expenseIds } },
      data: { status: 'PENDING' },
    })
    console.log(`\nUpdated ${expenseIds.length} expenses to PENDING status`)
  }

  await prisma.expense.deleteMany({
    where: { id: { in: expenseIds } },
  })

  console.log(`\nDeleted ${toDelete.length} payments and ${expenseIds.length} associated expenses for Pacha`)
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

