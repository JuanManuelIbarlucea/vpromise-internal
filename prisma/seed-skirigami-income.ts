import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type Platform = 'YOUTUBE' | 'TWITCH' | 'STREAMLOOTS' | 'KOFI' | 'MERCHANDISE' | 'PAYPAL' | 'ADJUSTMENT'

async function main() {
  const skirigami = await prisma.talent.findFirst({
    where: { user: { username: 'skirigami' } },
  })

  if (!skirigami) {
    console.error('Skirigami not found in database')
    process.exit(1)
  }

  console.log(`Found ${skirigami.name} with ID: ${skirigami.id}`)

  const incomes: { accountingMonth: string; platform: Platform; refValue: number; actualValue: number; actualUSD: number; description: string }[] = [
    // May 2025
    { accountingMonth: '2025-05-01', platform: 'TWITCH', refValue: 115.77, actualValue: 113.25, actualUSD: 113.25, description: 'Ganancias Mayo Twitch' },
    { accountingMonth: '2025-05-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.39, actualUSD: 2.39, description: 'Monthly antoniichz' },
    // June 2025
    { accountingMonth: '2025-06-01', platform: 'TWITCH', refValue: 62.95, actualValue: 61.46, actualUSD: 61.46, description: 'Ganancias Junio Twitch' },
    { accountingMonth: '2025-06-01', platform: 'STREAMLOOTS', refValue: 21.29, actualValue: 21.29, actualUSD: 21.29, description: 'Venta de cofres Mayo y Junio' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.00, actualUSD: 9.00, description: 'One-off Troxquerok' },
    { accountingMonth: '2025-06-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off baiiser' },
    { accountingMonth: '2025-06-01', platform: 'ADJUSTMENT', refValue: -5.41, actualValue: -12.02, actualUSD: -12.02, description: 'Ajuste diferencia mes anterior (Mayo 2025)' },
    // July 2025
    { accountingMonth: '2025-07-01', platform: 'TWITCH', refValue: 199.80, actualValue: 195.64, actualUSD: 195.64, description: 'Ganancias Julio Twitch' },
    { accountingMonth: '2025-07-01', platform: 'STREAMLOOTS', refValue: 29.22, actualValue: 29.22, actualUSD: 29.22, description: 'Venta de cofres Julio' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off baiiser' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off hunterzog' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 30.00, actualValue: 28.08, actualUSD: 28.08, description: 'One-off baiiser' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 12.00, actualValue: 11.05, actualUSD: 11.05, description: 'One-off chrollo' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off apizarroc' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 12.00, actualValue: 11.05, actualUSD: 11.05, description: 'One-off peoconharina4' },
    { accountingMonth: '2025-07-01', platform: 'ADJUSTMENT', refValue: -1.14, actualValue: -2.53, actualUSD: -2.53, description: 'Ajuste diferencia mes anterior (Junio 2025)' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off hunterzog' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 20.00, actualValue: 18.62, actualUSD: 18.62, description: 'One-off chingue' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 150.00, actualValue: 141.60, actualUSD: 141.60, description: 'One-off Mejoral' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 50.00, actualValue: 47.00, actualUSD: 47.00, description: 'One-off Mejoral' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off hunterzog' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off hunterzog' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off super_waton' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off super_waton' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off ryuu' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off hunterzog' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off Cenmath' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off Madoka' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 20.00, actualValue: 18.62, actualUSD: 18.62, description: 'One-off Madoka' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 30.00, actualValue: 28.08, actualUSD: 28.08, description: 'One-off Suna' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 60.00, actualValue: 56.46, actualUSD: 56.46, description: 'One-off Mejoral' },
    { accountingMonth: '2025-07-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off Madoka' },
    // August 2025
    { accountingMonth: '2025-08-01', platform: 'TWITCH', refValue: 115.37, actualValue: 111.82, actualUSD: 111.82, description: 'Ganancias Agosto Twitch' },
    { accountingMonth: '2025-08-01', platform: 'ADJUSTMENT', refValue: 86.10, actualValue: 191.33, actualUSD: 191.33, description: 'Ajuste diferencia mes anterior (Julio 2025)' },
    { accountingMonth: '2025-08-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off baiiser' },
    // September 2025
    { accountingMonth: '2025-09-01', platform: 'TWITCH', refValue: 80.55, actualValue: 80.55, actualUSD: 80.55, description: 'Ganancias Septiembre Twitch' },
    { accountingMonth: '2025-09-01', platform: 'ADJUSTMENT', refValue: -1.60, actualValue: -3.56, actualUSD: -3.56, description: 'Ajuste diferencia mes anterior (Agosto 2025)' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off baiiser' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off hunterzog' },
    { accountingMonth: '2025-09-01', platform: 'KOFI', refValue: 60.00, actualValue: 56.46, actualUSD: 56.46, description: 'One-off MejoRal' },
    // October 2025
    { accountingMonth: '2025-10-01', platform: 'TWITCH', refValue: 67.22, actualValue: 65.67, actualUSD: 65.67, description: 'Ganancias Octubre Twitch' },
    { accountingMonth: '2025-10-01', platform: 'ADJUSTMENT', refValue: -0.36, actualValue: -0.80, actualUSD: -0.80, description: 'Ajuste diferencia mes anterior (Septiembre 2025)' },
    { accountingMonth: '2025-10-01', platform: 'ADJUSTMENT', refValue: 13.37, actualValue: 29.71, actualUSD: 29.71, description: 'Ajuste diferencia Presupuesto por Arte referencia Traje Idol' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 7.00, actualValue: 6.32, actualUSD: 6.32, description: 'One-off Leya' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'One-off Khouren' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Tio_Chaqueta' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off baiiser' },
    { accountingMonth: '2025-10-01', platform: 'KOFI', refValue: 6.00, actualValue: 5.38, actualUSD: 5.38, description: 'One-off Leya' },
    // November 2025
    { accountingMonth: '2025-11-01', platform: 'TWITCH', refValue: 53.31, actualValue: 53.31, actualUSD: 53.31, description: 'Ganancias Noviembre Twitch' },
    { accountingMonth: '2025-11-01', platform: 'ADJUSTMENT', refValue: -0.70, actualValue: -1.56, actualUSD: -1.56, description: 'Ajuste diferencia mes anterior (Octubre 2025)' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 20.00, actualValue: 18.62, actualUSD: 18.62, description: 'One-off Leya' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 20.00, actualValue: 18.62, actualUSD: 18.62, description: 'One-off Trox' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off apizarroc' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 5.00, actualValue: 4.43, actualUSD: 4.43, description: 'One-off khouren' },
    { accountingMonth: '2025-11-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off baiiser' },
  ]

  let created = 0
  for (const income of incomes) {
    await prisma.income.create({
      data: {
        talentId: skirigami.id,
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

  console.log(`\nTotal: ${created} income records created for ${skirigami.name}`)
  
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

