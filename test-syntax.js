try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma import OK');

  const prisma = new PrismaClient();
  console.log('✅ PrismaClient created OK');

  prisma.$connect().then(() => {
    console.log('✅ Database connection OK');
    prisma.$disconnect();
    process.exit(0);
  }).catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
