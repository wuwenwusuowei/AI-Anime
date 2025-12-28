const { spawn } = require('child_process');
const path = require('path');

console.log('正在启动前端应用...');

const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  shell: true,
  stdio: 'inherit'
});

frontendProcess.on('close', (code) => {
  console.log(`前端进程退出，代码: ${code}`);
});

frontendProcess.on('error', (err) => {
  console.error('启动前端失败:', err);
});

// 处理Ctrl+C
process.on('SIGINT', () => {
  console.log('\n正在关闭前端应用...');
  frontendProcess.kill('SIGINT');
  process.exit(0);
});