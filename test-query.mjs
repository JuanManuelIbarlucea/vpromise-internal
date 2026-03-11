import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const p = new PrismaClient({ adapter })

try {
  const r = await p.talent.findMany({
    include: {
      managers: { select: { id: true, name: true } },
      user: { select: { id: true, username: true, types: true } },
    },
    orderBy: { name: 'asc' },
  })
  console.log('Talents OK:', r.length)

  const m = await p.manager.findMany({
    include: {
      user: { select: { id: true, username: true, email: true } },
      talents: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  console.log('Managers OK:', m.length)
} catch (e) {
  console.error('ERR:', e)
} finally {
  await p['$disconnect']()
  await pool.end()
}
