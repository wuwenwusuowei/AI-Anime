import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const app = express();
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 设置数据库路径为绝对路径
const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

console.log('🗃 数据库路径:', process.env.DATABASE_URL);

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ 创建数据库目录');
}

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '服务器运行正常',
    timestamp: new Date().toISOString(),
    dbPath: process.env.DATABASE_URL
  });
});

// 基础的历史记录路由（模拟数据）
app.get('/api/videos', (req, res) => {
  const mockData = [
    {
      id: '1',
      title: '示例视频1',
      description: '这是一个示例视频',
      videoUrl: null,
      thumbnailUrl: null,
      status: 'PENDING',
      duration: 3,
      resolution: '720p',
      userId: 'test-user-123',
      createdAt: new Date().toISOString()
    },
    {
      id: '2', 
      title: '示例视频2',
      description: '这是另一个示例视频',
      videoUrl: null,
      thumbnailUrl: null,
      status: 'COMPLETED',
      duration: 5,
      resolution: '720p',
      userId: 'test-user-123',
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json(mockData);
});

app.get('/api/tasks', (req, res) => {
  const mockData = [
    {
      id: 1,
      userPrompt: '生成一个可爱的动漫女孩',
      style: 'anime',
      translatedPrompt: 'Generate a cute anime girl',
      status: 'COMPLETED',
      promptId: 'test-prompt-123',
      videoUrl: null,
      userId: 'test-user-123',
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json(mockData);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 测试服务器已启动: http://localhost:${PORT}`);
  console.log(`📝 测试历史记录API: http://localhost:${PORT}/api/videos`);
  console.log(`📝 测试任务API: http://localhost:${PORT}/api/tasks`);
});