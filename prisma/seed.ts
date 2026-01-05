import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { permission: 'ADMIN' },
  })

  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin.username)
    return
  }

  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@vpromise.com',
      password: hashedPassword,
      permission: 'ADMIN',
      type: 'SERVICE',
      salary: 0,
      mustChangePassword: false,
    },
  })

  console.log('Admin user created:', admin.username)
  console.log('Password: admin123')
  console.log('Please change this password after first login!')
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
