import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const kimeru = await prisma.talent.findFirst({
    where: { 
      OR: [
        { name: { contains: 'imeru', mode: 'insensitive' } },
        { user: { username: 'kimeru' } }
      ]
    },
  })

  if (!kimeru) {
    console.error('Kimeru (Kana Imeru) not found in database')
    process.exit(1)
  }

  console.log(`Found ${kimeru.name} with ID: ${kimeru.id}`)

  const incomes = [
    { accountingMonth: '2025-07-01', platform: 'KOFI', amount: 102.00, description: 'Donaciones' },
    { accountingMonth: '2025-08-01', platform: 'YOUTUBE', amount: 52.62, description: 'Ganancias Agosto (4 - 28)' },
    { accountingMonth: '2025-09-01', platform: 'YOUTUBE', amount: 100.00, description: 'Ganancias Septiembre' },
    { accountingMonth: '2025-09-01', platform: 'TWITCH', amount: 50.00, description: 'Ganancias Septiembre' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', amount: 130.00, description: 'Donaciones' },
    { accountingMonth: '2025-10-01', platform: 'YOUTUBE', amount: 64.11, description: 'Ganancias Octubre' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', amount: 20.00, description: 'Venta merch digital' },
    { accountingMonth: '2025-12-01', platform: 'YOUTUBE', amount: 39.04, description: 'Ganancia de Noviembre' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', amount: 12.00, description: 'Ganancia de Noviembre' },
    { accountingMonth: '2025-12-01', platform: 'TWITCH', amount: 13.99, description: 'Ganancia de Noviembre' },
  ]

  for (const income of incomes) {
    const created = await prisma.income.create({
      data: {
        talentId: kimeru.id,
        accountingMonth: new Date(income.accountingMonth),
        platform: income.platform as 'YOUTUBE' | 'TWITCH' | 'STREAMLOOTS' | 'KOFI' | 'MERCHANDISE',
        currency: 'USD',
        referenceValue: income.amount,
        actualValue: income.amount,
        actualValueUSD: income.amount,
        description: income.description,
      },
    })
    console.log(`Created income: ${income.platform} ${income.accountingMonth} - $${income.amount} (${income.description})`)
  }

  console.log(`\nTotal: ${incomes.length} income records created for Kimeru`)
  
  const total = incomes.reduce((sum, i) => sum + i.amount, 0)
  console.log(`Total income: $${total.toFixed(2)}`)
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

