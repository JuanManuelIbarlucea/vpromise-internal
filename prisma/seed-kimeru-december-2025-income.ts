import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type Platform = 'YOUTUBE' | 'TWITCH' | 'STREAMLOOTS' | 'KOFI' | 'MERCHANDISE' | 'PAYPAL' | 'ADJUSTMENT'

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

  const incomes: { accountingMonth: string; platform: Platform; refValue: number; actualValue: number; actualUSD: number; description: string }[] = [
    { accountingMonth: '2025-12-01', platform: 'YOUTUBE', refValue: 39.04, actualValue: 39.04, actualUSD: 39.04, description: 'Ganancia de Noviembre' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 12.00, actualValue: 12.00, actualUSD: 12.00, description: 'Ganancia de Noviembre' },
    { accountingMonth: '2025-12-01', platform: 'TWITCH', refValue: 13.99, actualValue: 13.99, actualUSD: 13.99, description: 'Ganancia de Noviembre' },
  ]

  let created = 0
  for (const income of incomes) {
    await prisma.income.create({
      data: {
        talentId: kimeru.id,
        accountingMonth: new Date(income.accountingMonth),
        platform: income.platform,
        currency: 'USD',
        referenceValue: income.refValue,
        actualValue: income.actualValue,
        actualValueUSD: income.actualUSD,
        description: income.description,
      },
    })
    created++
    console.log(`Created: ${income.platform} ${income.accountingMonth.slice(0, 7)} - $${income.actualUSD.toFixed(2)} (${income.description.slice(0, 30)}...)`)
  }

  console.log(`\nTotal: ${created} income records created for ${kimeru.name}`)
  
  const totalUSD = incomes.reduce((sum, i) => sum + i.actualUSD, 0)
  console.log(`Total income (USD): $${totalUSD.toFixed(2)}`)
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
