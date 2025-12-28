const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5173;

// 启用 CORS
app.use(cors());

// 静态文件服务
app.use(express.static(__dirname));

// 默认路由到 dashboard.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API 代理到后端
app.use('/api', (req, res) => {
    const { default: axios } = require('axios');
    const targetUrl = `http://localhost:3000${req.originalUrl}`;
    
    const proxyReq = axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: {
            ...req.headers,
            host: 'localhost:3000'
        },
        responseType: 'stream'
    }).then(response => {
        // 转发响应头
        Object.keys(response.headers).forEach(key => {
            if (key !== 'content-encoding') {
                res.setHeader(key, response.headers[key]);
            }
        });
        response.data.pipe(res);
    }).catch(error => {
        console.error('Proxy error:', error.message);
        if (error.response) {
            res.status(error.response.status).send(error.response.data);
        } else {
            res.status(500).send({ error: '代理服务器错误' });
        }
    });
});

// 处理所有其他路由，返回 index.html (Vue SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 前端服务器启动: http://localhost:${PORT}`);
});