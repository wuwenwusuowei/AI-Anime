// 模拟用户登录状态
const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    avatar: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

const mockToken = `mock-token-${Date.now()}`;

// 保存到 localStorage
localStorage.setItem('token', mockToken);
localStorage.setItem('userInfo', JSON.stringify(mockUser));

console.log('✅ 模拟登录成功！');
console.log('Token:', mockToken);
console.log('User:', mockUser);
console.log('\n现在请刷新页面，应该能看到登录状态了。');