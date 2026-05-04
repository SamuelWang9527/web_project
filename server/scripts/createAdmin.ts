import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const username = 'admin'
  const password = 'Admin@123'
  const phone = '13800000000'

  const existing = await prisma.users.findFirst({ where: { OR: [{ username }, { phone }] } })
  if (existing) {
    console.log(`用户已存在 (id=${existing.id}, username=${existing.username})`)
    console.log('正在更新密码和角色...')
    const hashed = await bcrypt.hash(password, 10)
    await prisma.users.update({
      where: { id: existing.id },
      data: { password: hashed, role: 'super_admin' },
    })
    console.log('✅ 密码和角色已更新')
  } else {
    const hashed = await bcrypt.hash(password, 10)
    const now = new Date()
    const user = await prisma.users.create({
      data: {
        username,
        password: hashed,
        phone,
        email: 'admin@admin.com',
        brand: 'EL',
        role: 'super_admin',
        createdAt: now,
        updatedAt: now,
      },
    })
    console.log(`✅ 管理员账号创建成功 (id=${user.id})`)
  }

  console.log(`\n登录信息:\n  用户名: ${username}\n  密码: ${password}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
