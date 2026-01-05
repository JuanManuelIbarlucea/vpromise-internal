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

  const incomes: { accountingMonth: string; platform: Platform; refValue: number; actualValue: number; actualUSD: number; description: string }[] = [
    // May 2025
    { accountingMonth: '2025-05-01', platform: 'TWITCH', refValue: 202.96, actualValue: 202.90, actualUSD: 202.90, description: 'Ganancias Mayo Twitch' },
    { accountingMonth: '2025-05-01', platform: 'STREAMLOOTS', refValue: 26.98, actualValue: 25.73, actualUSD: 25.73, description: 'Venta Cofres Streamloots' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 7.00, actualValue: 6.32, actualUSD: 6.32, description: 'One-off monoloco8789' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off monoloco8789' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Qbertcl' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 30.00, actualValue: 28.08, actualUSD: 28.08, description: 'One-off Patethor' },
    // June 2025
    { accountingMonth: '2025-06-01', platform: 'TWITCH', refValue: 257.80, actualValue: 257.76, actualUSD: 257.76, description: 'Ganancias Junio Twitch' },
    { accountingMonth: '2025-06-01', platform: 'YOUTUBE', refValue: 73657.00, actualValue: 73657.00, actualUSD: 78.72, description: 'Ganancias Mayo + Junio' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 15.00, actualValue: 13.89, actualUSD: 13.89, description: 'One-off vorstob' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 50.00, actualValue: 47.00, actualUSD: 47.00, description: 'One-off MejoRal' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 40.00, actualValue: 37.54, actualUSD: 37.54, description: 'One-off MejoRal' },
    { accountingMonth: '2025-06-01', platform: 'ADJUSTMENT', refValue: 3.77, actualValue: 8.38, actualUSD: 8.38, description: 'Ajuste diferencia mes anterior (Mayo 2025)' },
    // July 2025
    { accountingMonth: '2025-07-01', platform: 'TWITCH', refValue: 1386.35, actualValue: 1386.30, actualUSD: 1386.30, description: 'Ganancias Julio Twitch' },
    { accountingMonth: '2025-07-01', platform: 'STREAMLOOTS', refValue: 415.45, actualValue: 415.45, actualUSD: 415.45, description: 'Venta Cofres Streamloots' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-07-01', platform: 'PAYPAL', refValue: 4.20, actualValue: 3.67, actualUSD: 3.67, description: 'Pfacto Paypal' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-07-01', platform: 'ADJUSTMENT', refValue: 2.84, actualValue: 6.31, actualUSD: 6.31, description: 'Ajuste diferencia mes anterior (Mayo 2025)' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 88.00, actualValue: 82.95, actualUSD: 82.95, description: 'One-off Pathetor' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 9.00, actualValue: 8.21, actualUSD: 8.21, description: 'One-off vorstob' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 20.00, actualValue: 18.62, actualUSD: 18.62, description: 'One-off Chingue' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 100.00, actualValue: 94.30, actualUSD: 94.30, description: 'One-off MejoRal' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'One-off RodSeiya' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off Wololo' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'One-off Matiux' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'One-off Celito' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 30.00, actualValue: 28.08, actualUSD: 28.08, description: 'One-off ShinjiQ' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 30.00, actualValue: 28.08, actualUSD: 28.08, description: 'One-off Chingue' },
    // August 2025
    { accountingMonth: '2025-08-01', platform: 'TWITCH', refValue: 198.43, actualValue: 198.38, actualUSD: 198.38, description: 'Ganancias Agosto Twitch' },
    { accountingMonth: '2025-08-01', platform: 'KOFI', refValue: 50.00, actualValue: 47.00, actualUSD: 47.00, description: 'One-off MejoRal' },
    { accountingMonth: '2025-08-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-08-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-08-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off monoloco8789' },
    // September 2025
    { accountingMonth: '2025-09-01', platform: 'TWITCH', refValue: 214.91, actualValue: 213.86, actualUSD: 213.86, description: 'Ganancias Septiembre Twitch' },
    { accountingMonth: '2025-09-01', platform: 'YOUTUBE', refValue: 79847.00, actualValue: 79847.00, actualUSD: 83.94, description: 'Ganancias Acumuladas YouTube Septiembre' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-09-01', platform: 'ADJUSTMENT', refValue: -0.03, actualValue: -0.07, actualUSD: -0.07, description: 'Ajuste diferencia mes anterior (Agosto 2025)' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 33.00, actualValue: 30.92, actualUSD: 30.92, description: 'One-off Leto' },
    // October 2025
    { accountingMonth: '2025-10-01', platform: 'TWITCH', refValue: 162.78, actualValue: 162.78, actualUSD: 162.78, description: 'Ganancias Octubre Twitch' },
    { accountingMonth: '2025-10-01', platform: 'YOUTUBE', refValue: 60373.00, actualValue: 60373.00, actualUSD: 63.47, description: 'Ganancias Acumuladas YouTube Octubre' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-10-01', platform: 'ADJUSTMENT', refValue: 0.01, actualValue: 0.02, actualUSD: 0.02, description: 'Ajuste diferencia mes anterior (Septiembre 2025)' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 20.00, actualValue: 18.62, actualUSD: 18.62, description: 'One-off Pfacto' },
    // November 2025
    { accountingMonth: '2025-11-01', platform: 'TWITCH', refValue: 157.67, actualValue: 157.67, actualUSD: 157.67, description: 'Ganancias Noviembre Twitch' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly JakkuCL' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.08, actualUSD: 5.08, description: 'Monthly Joaquin Salazar' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off monoloco8789' },
  ]

  let created = 0
  for (const income of incomes) {
    await prisma.income.create({
      data: {
        talentId: kasahi.id,
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

  console.log(`\nTotal: ${created} income records created for ${kasahi.name}`)
  
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

