import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type Platform = 'YOUTUBE' | 'TWITCH' | 'STREAMLOOTS' | 'KOFI' | 'MERCHANDISE' | 'PAYPAL' | 'ADJUSTMENT'

async function main() {
  const kasahi = await prisma.talent.findFirst({
    where: { user: { username: 'kasahi' } },
  })

  if (!kasahi) {
    console.error('Kasahi (Kotone Asahi) not found in database')
    process.exit(1)
  }

  console.log(`Found ${kasahi.name} with ID: ${kasahi.id}`)

  const incomes: { accountingMonth: string; platform: Platform; currency: string; refValue: number; actualValue: number; actualUSD: number; description: string }[] = [
    { accountingMonth: '2025-12-01', platform: 'TWITCH', currency: 'USD', refValue: 391.22, actualValue: 391.22, actualUSD: 391.22, description: 'Ganancias Diciembre Twitch' },
    { accountingMonth: '2025-12-01', platform: 'YOUTUBE', currency: 'CLP', refValue: 85049.00, actualValue: 85049.00, actualUSD: 93.45, description: 'Ganancias Acumuladas a Diciembre YouTube' },
    { accountingMonth: '2025-12-01', platform: 'STREAMLOOTS', currency: 'USD', refValue: 0.00, actualValue: 0.00, actualUSD: 0.00, description: 'Venta Cofres Streamloots: 4.81USD, umbral no alcanzado' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', currency: 'USD', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', currency: 'USD', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', currency: 'USD', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly Celito' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', currency: 'USD', refValue: 30.00, actualValue: 28.08, actualUSD: 28.08, description: 'Monthly MejoRal' },
  ]

  let created = 0
  for (const income of incomes) {
    await prisma.income.create({
      data: {
        talentId: kasahi.id,
        accountingMonth: new Date(income.accountingMonth),
        platform: income.platform,
        currency: income.currency,
        referenceValue: income.refValue,
        actualValue: income.actualValue,
        actualValueUSD: income.actualUSD,
        description: income.description,
      },
    })
    created++
    console.log(`Created: ${income.platform} ${income.accountingMonth.slice(0, 7)} - $${income.actualUSD.toFixed(2)} (${income.description.slice(0, 35)}...)`)
  }

  console.log(`\nTotal: ${created} income records created for ${kasahi.name}`)
  
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
