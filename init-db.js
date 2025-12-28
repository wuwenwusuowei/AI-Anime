const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🔧 初始化数据库...');
  
  // 确保数据库目录存在
  const dbDir = path.dirname('./prisma/dev.db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ 创建数据库目录');
  }
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./prisma/dev.db'
      }
    }
  });
  
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 检查是否已有用户
    const userCount = await prisma.user.count();
    console.log(`📊 当前用户数量: ${userCount}`);
    
    // 检查是否已有视频
    const videoCount = await prisma.video.count();
    console.log(`📊 当前视频数量: ${videoCount}`);
    
    // 检查是否已有任务
    const taskCount = await prisma.videoTask.count();
    console.log(`📊 当前任务数量: ${taskCount}`);
    
    console.log('✅ 数据库初始化完成');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await prisma.$disconnect();
    console.log('✅ 数据库连接已关闭');
  }
}

initDatabase();