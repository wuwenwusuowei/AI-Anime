# 🚀 本地开发启动指南

## ✅ Vue.js 加载问题已修复

原问题：`unpkg.com` CDN 在国内访问不稳定，导致 Vue.js 加载失败
解决方案：已更换为国内稳定的 `cdn.staticfile.net` CDN 源

## 🔗 访问地址
- **主前端界面**：http://localhost:5173 (index.html)
- **备用界面**：http://localhost:5173/local-backup.html (带错误检测)
- **测试界面**：http://localhost:5173/test-clean.html
- **后端API**：http://localhost:3000

## 方法一：分别启动（推荐）
1. **启动后端服务**（终端1）：
   ```bash
   npm run dev
   ```
   - 后端将在 http://localhost:3000 启动
   - 支持热重载

2. **启动前端服务**（终端2）：
   ```bash
   cd frontend
   npm run dev
   ```
   - 前端将在 http://localhost:5173 启动
   - 支持热重载
   - Vue.js 已更换为国内 CDN，加载稳定

## 方法二：同时启动（便捷）
在项目根目录运行：
```bash
npm run dev:full
```
- 将同时启动前后端服务

## 方法三：仅前端开发
如果后端已启动，只需启动前端：
```bash
npm run frontend
```

## 📝 使用说明
1. 访问前端页面 http://localhost:5173
2. 上传图片并输入动画描述
3. 点击"生成视频"按钮
4. 等待处理完成并查看结果

## 🔧 CDN 配置
已将 Vue.js CDN 从：
```html
<!-- 原来（不稳定） -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

更换为：
```html
<!-- 现在（稳定） -->
<script src="https://cdn.staticfile.net/vue/3.3.4/vue.global.min.js"></script>
```

## 🆘 故障排除
如果仍然遇到 Vue.js 加载问题：
1. 访问 `local-backup.html` 版本，包含错误检测
2. 检查浏览器控制台是否有其他错误
3. 尝试直接打开 http://localhost:5173

## ⚙️ 环境要求
- Node.js 16+
- 确保后端服务的环境变量(.env)已正确配置
- ComfyUI 服务已启动并可访问