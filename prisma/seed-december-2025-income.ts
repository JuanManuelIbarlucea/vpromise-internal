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
    { accountingMonth: '2025-12-01', platform: 'TWITCH', refValue: 81.21, actualValue: 81.21, actualUSD: 81.21, description: 'Ganancias Diciembre Twitch' },
    { accountingMonth: '2025-12-01', platform: 'STREAMLOOTS', refValue: 0.00, actualValue: 0.00, actualUSD: 0.00, description: 'Sin Venta de cofres en Octubre' },
    { accountingMonth: '2025-12-01', platform: 'ADJUSTMENT', refValue: -0.58, actualValue: -1.29, actualUSD: -1.29, description: 'Ajuste diferencia mes anterior (Noviembre 2025)' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'Monthly baiiser' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Khouren' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off Chrollo' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off XChavi' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 3.00, actualValue: 2.54, actualUSD: 2.54, description: 'One-off WadaWadah' },
    { accountingMonth: '2025-12-01', platform: 'KOFI', refValue: 10.00, actualValue: 9.16, actualUSD: 9.16, description: 'One-off Enfermito Chaqueta' },
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
