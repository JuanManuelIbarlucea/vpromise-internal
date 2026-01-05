import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const talents = await prisma.talent.findMany({
    include: { user: { select: { id: true, username: true } } },
  })
  console.log('Talents:')
  talents.forEach((t) => console.log(`  - ${t.name} (userId: ${t.user?.id}, username: ${t.user?.username})`))
}

main()
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

