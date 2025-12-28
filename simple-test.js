console.log('Step 1: Loading dotenv...');
require('dotenv').config();

console.log('Step 2: DATABASE_URL:', process.env.DATABASE_URL);

console.log('Step 3: Setting DATABASE_URL...');
process.env.DATABASE_URL = 'file:./prisma/dev.db';

console.log('Step 4: DATABASE_URL after override:', process.env.DATABASE_URL);

console.log('Step 5: Creating PrismaClient...');
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('Step 6: PrismaClient imported successfully');
  
  const prisma = new PrismaClient();
  console.log('Step 7: PrismaClient created successfully');
  
  prisma.$connect().then(() => {
    console.log('✅ Database connected!');
    prisma.$disconnect();
    process.exit(0);
  }).catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
}
