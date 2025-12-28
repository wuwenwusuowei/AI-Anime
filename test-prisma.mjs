import 'dotenv/config';
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log('✅ 数据库连接成功');
  process.exit(0);
} catch (error) {
  console.error('❌ 连接失败:', error.message);
  process.exit(1);
}
