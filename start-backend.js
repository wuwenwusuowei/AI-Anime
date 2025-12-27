console.log('🚀 启动后端服务...');

const { spawn } = require('child_process');

const child = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('启动失败:', error);
});

child.on('close', (code) => {
  console.log(`服务退出，代码: ${code}`);
});

console.log('📡 服务运行在: http://localhost:3000');