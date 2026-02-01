import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type Platform = 'YOUTUBE' | 'TWITCH' | 'STREAMLOOTS' | 'KOFI' | 'MERCHANDISE' | 'PAYPAL' | 'ADJUSTMENT'

async function main() {
  const leto = await prisma.talent.findFirst({
    where: { user: { username: 'lmoetama' } },
  })

  if (!leto) {
    console.error('Leto Moetama not found in database')
    process.exit(1)
  }

  console.log(`Found ${leto.name} with ID: ${leto.id}`)

  const incomes: { accountingMonth: string; platform: Platform; refValue: number; actualValue: number; actualUSD: number; description: string }[] = [
    { accountingMonth: '2025-12-01', platform: 'TWITCH', refValue: 62.49, actualValue: 62.49, actualUSD: 62.49, description: 'Ganancias Diciembre Twitch' },
    { accountingMonth: '2025-12-01', platform: 'ADJUSTMENT', refValue: -1.94, actualValue: -4.31, actualUSD: -4.31, description: 'Ajuste diferencia mes anterior (Noviembre 2025)' },
    { accountingMonth: '2025-12-01', platform: 'STREAMLOOTS', refValue: 0.00, actualValue: 0.00, actualUSD: 0.00, description: 'No se alcanzó umbral en Diciembre. Van: 4USD' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 12.00, actualValue: 5.38, actualUSD: 5.38, description: 'One-off Windsnake' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Khouren' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Subject' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Giskard' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 130.00, actualValue: 122.68, actualUSD: 122.68, description: 'One-off Mejoral' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'One-off Windsnake' },
  ]

  let created = 0
  for (const income of incomes) {
    await prisma.income.create({
      data: {
        talentId: leto.id,
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
    console.log(`Created: ${income.platform} ${income.accountingMonth.slice(0, 7)} - $${income.actualUSD.toFixed(2)} (${income.description.slice(0, 35)}...)`)
  }

  console.log(`\nTotal: ${created} income records created for ${leto.name}`)
  
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
