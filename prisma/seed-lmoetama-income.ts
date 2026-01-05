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
    // May 2025
    { accountingMonth: '2025-05-01', platform: 'TWITCH', refValue: 55.14, actualValue: 53.80, actualUSD: 53.80, description: 'Ganancias Mayo Twitch' },
    // June 2025
    { accountingMonth: '2025-06-01', platform: 'TWITCH', refValue: 62.62, actualValue: 61.14, actualUSD: 61.14, description: 'Ganancias Junio Twitch' },
    { accountingMonth: '2025-06-01', platform: 'STREAMLOOTS', refValue: 24.10, actualValue: 24.10, actualUSD: 24.10, description: 'Venta de cofres Mayo y Junio' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 15.00, actualValue: 13.14, actualUSD: 13.14, description: 'One-off Aislayers' },
    { accountingMonth: '2025-06-01', platform: 'ADJUSTMENT', refValue: 1.30, actualValue: 2.89, actualUSD: 2.89, description: 'Ajuste diferencia mes anterior (Mayo 2025)' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
    // July 2025
    { accountingMonth: '2025-07-01', platform: 'TWITCH', refValue: 69.74, actualValue: 68.14, actualUSD: 68.14, description: 'Ganancias Julio Twitch' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
    { accountingMonth: '2025-07-01', platform: 'ADJUSTMENT', refValue: 1.75, actualValue: 3.89, actualUSD: 3.89, description: 'Ajuste diferencia mes anterior (Junio 2025)' },
    // August 2025
    { accountingMonth: '2025-08-01', platform: 'TWITCH', refValue: 64.49, actualValue: 62.99, actualUSD: 62.99, description: 'Ganancias Agosto Twitch' },
    { accountingMonth: '2025-08-01', platform: 'ADJUSTMENT', refValue: -0.72, actualValue: -1.60, actualUSD: -1.60, description: 'Ajuste diferencia mes anterior (Julio 2025)' },
    { accountingMonth: '2025-08-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
    // September 2025
    { accountingMonth: '2025-09-01', platform: 'TWITCH', refValue: 69.93, actualValue: 69.93, actualUSD: 69.93, description: 'Ganancias Septiembre Twitch' },
    { accountingMonth: '2025-09-01', platform: 'ADJUSTMENT', refValue: -0.67, actualValue: -1.49, actualUSD: -1.49, description: 'Ajuste diferencia mes anterior (Agosto 2025)' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
    // October 2025
    { accountingMonth: '2025-10-01', platform: 'TWITCH', refValue: 61.66, actualValue: 60.22, actualUSD: 60.22, description: 'Ganancias Octubre Twitch' },
    { accountingMonth: '2025-10-01', platform: 'ADJUSTMENT', refValue: 0.14, actualValue: 0.31, actualUSD: 0.31, description: 'Ajuste diferencia mes anterior (Septiembre 2025)' },
    { accountingMonth: '2025-10-01', platform: 'STREAMLOOTS', refValue: 29.12, actualValue: 29.12, actualUSD: 29.12, description: 'Ganancias acumuladas a Octubre, Streamloots' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
    // November 2025
    { accountingMonth: '2025-11-01', platform: 'TWITCH', refValue: 94.08, actualValue: 94.08, actualUSD: 94.08, description: 'Ganancias Noviembre Twitch' },
    { accountingMonth: '2025-11-01', platform: 'ADJUSTMENT', refValue: 12.45, actualValue: 27.67, actualUSD: 27.67, description: 'Ajuste diferencia mes anterior (Octubre 2025)' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'Monthly Salazar' },
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

  const byMonth: Record<string, number> = {}
  incomes.forEach(i => {
    const month = i.accountingMonth.slice(0, 7)
    byMonth[month] = (byMonth[month] || 0) + i.actualUSD
  })
  console.log('\nMonthly breakdown:')
  Object.entries(byMonth).sort().forEach(([month, amount]) => {
    const rate = amount > 1000 ? '20%' : '45%'
    const share = amount > 1000 ? amount * 0.20 : amount * 0.45
    console.log(`  ${month}: $${amount.toFixed(2)} (Agency ${rate}: $${share.toFixed(2)})`)
  })
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

