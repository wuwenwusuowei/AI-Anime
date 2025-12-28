// 调试FormData问题
const FormData = require('form-data');
const fs = require('fs');

// 模拟文件
const file = fs.createReadStream('./test.jpg'); // 创建一个测试文件
const formData = new FormData();
formData.append('image', file, 'test.jpg');
formData.append('prompt', 'test animation');
formData.append('resolution', '576p');
formData.append('duration', '3');

console.log('FormData content:');
formData.forEach((value, key) => {
  console.log(`${key}:`, value);
});

// 测试发送到后端
const axios = require('axios');

axios.post('http://localhost:3000/api/generate', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
}).then(response => {
  console.log('✅ 成功:', response.data);
}).catch(error => {
  console.error('❌ 错误:', error.response?.data || error.message);
});