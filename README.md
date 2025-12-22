# AI 视频生成项目后端

基于 Node.js + Express + Prisma 的 AI 视频生成服务后端 API。

## 项目结构

```
d:\Anime\
├── server.js              # 主入口文件
├── package.json           # 项目配置和依赖
├── .env                   # 环境变量配置
├── .gitignore            # Git 忽略文件
├── prisma/
│   └── schema.prisma     # 数据库模型定义
└── routes/
    ├── auth.js           # 用户认证路由
    ├── videos.js         # 视频管理路由
    ├── tasks.js          # 任务管理路由
    └── templates.js      # 模板管理路由
```

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js (v16+)
- PostgreSQL 数据库

### 2. 配置环境变量

复制 `.env` 文件并修改配置：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/ai_video_db"

# 服务器端口
PORT=3000

# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key

# 智谱 AI API 密钥
ZHIPU_API_KEY=your-zhipu-api-key
```

### 3. 数据库初始化

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库结构（开发环境）
npm run db:push

# 或者创建并运行迁移（生产环境）
npm run db:migrate
```

### 4. 启动服务器

```bash
# 生产环境启动
npm start

# 开发环境启动（需要安装 nodemon）
npm run dev
```

## API 端点

### 健康检查
- `GET /health` - 服务状态检查

### 用户认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 视频管理
- `GET /api/videos` - 获取视频列表
- `GET /api/videos/:id` - 获取单个视频
- `POST /api/videos` - 创建新视频
- `PATCH /api/videos/:id/status` - 更新视频状态
- `DELETE /api/videos/:id` - 删除视频

### 任务管理
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:id` - 获取单个任务
- `POST /api/tasks` - 创建新任务
- `PATCH /api/tasks/:id` - 更新任务状态
- `PATCH /api/tasks/:id/cancel` - 取消任务

### 模板管理
- `GET /api/templates` - 获取模板列表
- `GET /api/templates/:id` - 获取单个模板
- `POST /api/templates` - 创建新模板
- `PATCH /api/templates/:id` - 更新模板
- `DELETE /api/templates/:id` - 删除模板
- `GET /api/templates/categories/list` - 获取模板分类列表

## 数据库模型

### User (用户)
- id, email, username, password
- 创建时间、更新时间

### Video (视频)
- id, title, description, prompt
- 视频 URL、缩略图 URL
- 状态、时长、分辨率、文件大小
- 关联用户和任务

### Task (任务)
- id, type, status, progress
- 参数、结果、错误信息
- 关联用户和视频

### Template (模板)
- id, name, description, prompt
- 分类、标签、使用次数
- 是否公开

## 开发工具

```bash
# 查看数据库
npm run db:studio

# 重新生成客户端
npm run db:generate

# 查看数据库状态
npx prisma db status
```

## 注意事项

1. 生产环境请使用 HTTPS
2. 密码需要使用 bcrypt 加密
3. 需要实现 JWT 认证中间件
4. 文件上传需要配置合适的存储方案
5. 建议添加日志记录和监控