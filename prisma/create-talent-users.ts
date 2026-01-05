import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function generateUsername(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].toLowerCase()
  }
  const firstInitial = parts[0].charAt(0).toLowerCase()
  const lastName = parts[parts.length - 1].toLowerCase()
  return `${firstInitial}${lastName}`
}

async function main() {
  const talentsWithoutUsers = await prisma.talent.findMany({
    where: { userId: null },
  })

  console.log(`Found ${talentsWithoutUsers.length} talents without user accounts\n`)

  for (const talent of talentsWithoutUsers) {
    let username = generateUsername(talent.name)
    
    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      const suffix = Math.floor(Math.random() * 1000)
      username = `${username}${suffix}`
    }

    const generatedPassword = uuidv4()
    const hashedPassword = await bcrypt.hash(generatedPassword, 12)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        type: 'TALENT',
        permission: 'USER',
        salary: 200,
        mustChangePassword: true,
      },
    })

    await prisma.talent.update({
      where: { id: talent.id },
      data: { userId: user.id },
    })

    console.log(`Created user for: ${talent.name}`)
    console.log(`  Username: ${username}`)
    console.log(`  Password: ${generatedPassword}`)
    console.log('')
  }

  console.log('Done!')
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

