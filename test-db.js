import { PrismaClient } from '@prisma/client';

console.log('开始测试数据库...');

try {
  console.log('✅ PrismaClient 加载成功');
  
  // 直接使用环境变量
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  
  const prisma = new PrismaClient();
  console.log('✅ PrismaClient 创建成功');
  
  prisma.$connect()
    .then(() => {
      console.log('✅ 数据库连接成功');
      return prisma.$disconnect();
    })
    .then(() => {
      console.log('✅ 数据库断开成功');
    })
    .catch(error => {
      console.error('❌ 数据库操作失败:', error.message);
      console.error('完整错误:', error);
    });
    
} catch (error) {
  console.error('❌ 初始化失败:', error.message);
  console.error('完整错误:', error);
}

console.log('脚本执行完成');