import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { pipeline } from 'stream';
import { promisify } from 'util';
import sharp from 'sharp'; // 🟢 [新增] 引入强大的图片处理库
import 'dotenv/config';

const streamPipeline = promisify(pipeline);

// --- 1. 配置常量 ---

// 画质配置 (16:9)
const RESOLUTION_CONFIG = {
    "576p": { width: 1024, height: 576 },
    "720p": { width: 1280, height: 720 }
};

// 时长配置 (基于 16fps，公式: 秒数 * 16 + 1)
const DURATION_MAP = {
    "1": 17,
    "2": 33,
    "3": 49,
    "4": 65,
    "5": 81
};

// --- 2. 基础配置 ---
const app = express();
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 确保视频保存目录存在
const videosDir = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
    console.log(`📁 创建视频目录: ${videosDir}`);
}

app.use(cors());
app.use(express.json());

// 配置静态目录，让前端能访问本地视频文件
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

const zhipu = new OpenAI({
    apiKey: process.env.ZHIPU_API_KEY, 
    baseURL: "https://open.bigmodel.cn/api/paas/v4/" 
});

// --- 3. 核心 AI 逻辑 (完美修复版) ---

/**
 * 视觉分析：完美处理各种图片格式 (AVIF, WebP, PNG)
 * 1. 使用 sharp 将任意输入转为标准 JPEG
 * 2. 处理 PNG 透明背景（防止变黑）
 * 3. 压缩体积以加快 AI 响应
 */
async function analyzeImageFeatures(filePath) {
    console.log("👀 [AI视觉] 正在预处理图片并深度解析...");
    
    try {
        // 🟢 [核心修改] 使用 sharp 进行标准化转换
        const jpegBuffer = await sharp(filePath)
            // 1. 扁平化处理：将透明背景(alpha通道)填充为白色
            // 解决 PNG 转 JPEG 后背景变黑导致 AI 误判的问题
            .flatten({ background: '#ffffff' }) 
            // 2. 强制转为 JPEG，质量 90 (保留细节但兼容性最好)
            .jpeg({ quality: 90 }) 
            .toBuffer();

        const base64Image = jpegBuffer.toString('base64');
        
        // 现在我们可以自信地声明这是 jpeg，不会报 400 错误了
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await zhipu.chat.completions.create({
            model: "glm-4v-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: "请用一段通顺、客观、详细的英文描述这张图片。重点描述：人物的外貌特征（发色、服饰、五官）、人物当前的姿势、以及背景环境的细节。请使用小说式的描写手法。不要包含任何动作指令（如 running），只描述静态画面。" 
                        },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ]
        });
        
        const description = response.choices[0].message.content;
        console.log("🤖 [视觉描述]:", description.substring(0, 60) + "...");
        return description;
    } catch (e) {
        console.error("❌ 视觉分析失败:", e.message);
        return "A character in anime style with detailed background."; // 保底
    }
}

/**
 * 提示词生成：视觉导演模式
 */
async function translatePrompt(userActionText, staticDescription, style) {
    console.log(`📝 [AI编剧] 正在构建高一致性动态场景...`);
    
    let styleSuffix = "anime style, 2D, flat color, cel shading, high quality, masterpiece, 4k, vivid colors, high contrast";
    
    const systemPrompt = `你是一个精通 Wan 2.1 视频模型的"视觉导演"。
    你的任务是将[静态画面描述]与[用户动作指令]融合，编写一段**具有电影感、空间感**的英文视频脚本。
    
    输入信息：
    1. 画面基础（视觉特征）：${staticDescription}
    2. 导演指令（用户动作）：${userActionText}
    
    编写核心原则：
    1. **环境空间构建**：详细描述环境空间关系 (e.g., "standing under a large cherry blossom tree", "blue sky above")。
    2. **动作与物理互动**：将简单指令转化为连贯动作，加入环境互动 (e.g., "hair flowing in the wind", "light and shadow changing").
    3. **运镜与质感**：加入微小运镜 (e.g., "slow cinematic camera movement", "depth of field")。
    4. **结构**：[环境与光影] + [人物外貌与姿势] + [动作与互动] + [风格后缀]。
    直接输出一段通顺的英文段落。`;

    const completion = await zhipu.chat.completions.create({
        model: "glm-4-flash", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "开始编写" }
        ],
    });
    return completion.choices[0].message.content;
}

/**
 * 下载云端视频到本地
 */
async function downloadVideoToLocal(cloudUrl, filename) {
    console.log(`📥 [下载] 正在将视频搬运到本地...`);
    
    try {
        const response = await fetch(cloudUrl);
        if (!response.ok) throw new Error(`下载失败: ${response.statusText}`);

        const saveDir = path.join(__dirname, 'public', 'videos');
        const localFilename = `${Date.now()}_${filename}`;
        const localFilePath = path.join(saveDir, localFilename);

        await streamPipeline(response.body, fs.createWriteStream(localFilePath));

        console.log(`💾 [保存] 视频已保存至: ${localFilePath}`);
        
        // 返回本地可访问的 URL
        return `http://localhost:${process.env.PORT || 3000}/videos/${localFilename}`;
    } catch (error) {
        console.error(`❌ [下载失败] ${error.message}`);
        throw error;
    }
}

// --- 4. ComfyUI 工具函数 ---

async function uploadImageToComfy(localFilePath, originalFilename) {
    console.log(`📤 [上传] 正在上传: ${originalFilename}`);
    const formData = new FormData();
    formData.append('image', fs.createReadStream(localFilePath));
    formData.append('overwrite', 'true');

    try {
        const response = await fetch(`${process.env.COMFY_API_URL}/upload/image`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error(`Upload Failed: ${response.statusText}`);
        const data = await response.json();
        return data.name; 
    } catch (error) {
        throw new Error(`连接失败: ${error.message}`);
    }
}

async function triggerComfyUI(positivePrompt, cloudImageName, resolutionKey = "576p", durationKey = "3") {
    const workflowPath = path.join(__dirname, 'Image-to-Video.json');
    let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    // --- ID 配置 (请根据实际 workflow 调整) ---
    const TEXT_NODE = "30";
    const IMAGE_NODE = "43";
    const PAINTER_NODE = "56";
    const RESIZE_NODE = "59";
    const SAMPLER_IDS = ["38", "39"];
    // ------------------------------------

    const resConfig = RESOLUTION_CONFIG[resolutionKey] || RESOLUTION_CONFIG["576p"];
    const targetFrames = DURATION_MAP[durationKey] || 49;

    console.log(`🔧 [配置] 画质: ${resConfig.width}x${resConfig.height} | 时长: ${durationKey}s (${targetFrames}帧)`);

    // 修改参数
    if (workflow[PAINTER_NODE]) {
        workflow[PAINTER_NODE].inputs.width = resConfig.width;
        workflow[PAINTER_NODE].inputs.height = resConfig.height;
        workflow[PAINTER_NODE].inputs.length = targetFrames;
    }
    if (workflow[RESIZE_NODE]) {
        workflow[RESIZE_NODE].inputs.width = resConfig.width;
        workflow[RESIZE_NODE].inputs.height = resConfig.height;
    }
    if (workflow[TEXT_NODE]) workflow[TEXT_NODE].inputs.text = positivePrompt;
    if (workflow[IMAGE_NODE]) workflow[IMAGE_NODE].inputs.image = cloudImageName;

    // 随机种子
    const randomSeed = Math.floor(Math.random() * 1000000000000);
    SAMPLER_IDS.forEach(id => {
        if (workflow[id]) workflow[id].inputs.noise_seed = randomSeed;
    });

    console.log(`🚀 [触发] 发送任务... 种子: ${randomSeed}`);
    
    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) throw new Error(`ComfyUI Error: ${response.statusText}`);
    const data = await response.json();
    return data.prompt_id;
}

// --- 5. API 路由 ---

// 用户相关接口
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: '请填写完整信息' });
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: '邮箱已被注册' });

        const user = await prisma.user.create({ data: { username, email, password } });
        const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: '请填写完整信息' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.password !== password) return res.status(401).json({ error: '邮箱或密码错误' });

        const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');
        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: '未授权' });

        const token = authHeader.replace('Bearer ', '');
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, email] = decoded.split(':');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.id.toString() !== userId) return res.status(401).json({ error: 'token无效' });

        res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 生成任务接口
app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        const { prompt, resolution, duration } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: "请上传图片" });

        console.log(`\n🆕 收到新任务: ${prompt}, 画质: ${resolution}, 时长: ${duration}s`);

        const task = await prisma.videoTask.create({
            data: { userPrompt: prompt || "动态视频", style: 'anime', status: 'PENDING' }
        });

        res.json({ success: true, taskId: task.id });

        // 异步执行任务
        (async () => {
            try {
                // A. 上传图片到 ComfyUI
                const cloudFileName = await uploadImageToComfy(file.path, file.originalname);
                
                // B. 视觉分析 (已增强兼容性)
                const staticDesc = await analyzeImageFeatures(file.path);
                
                // C. 提示词融合
                const finalPrompt = await translatePrompt(prompt || "natural movement", staticDesc, 'anime');
                
                await prisma.videoTask.update({ where: { id: task.id }, data: { translatedPrompt: finalPrompt } });

                // D. 触发 ComfyUI
                const promptId = await triggerComfyUI(finalPrompt, cloudFileName, resolution, duration);
                
                await prisma.videoTask.update({ where: { id: task.id }, data: { status: 'PROCESSING', promptId: promptId } });

            } catch (err) {
                console.error("❌ 任务失败:", err);
                await prisma.videoTask.update({ where: { id: task.id }, data: { status: 'FAILED' } });
            } finally {
                // 清理上传的临时文件
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }
        })();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 状态查询接口
app.get('/api/status/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await prisma.videoTask.findUnique({ where: { id: taskId } });
        if (!task) return res.status(404).json({ error: "任务不存在" });
        if (task.status === 'COMPLETED') return res.json({ status: 'COMPLETED', videoUrl: task.videoUrl });

        if (task.status === 'PROCESSING' && task.promptId) {
            try {
                const historyRes = await fetch(`${process.env.COMFY_API_URL}/history/${task.promptId}`);
                const historyData = await historyRes.json();
                
                if (historyData[task.promptId]) {
                    console.log("🏁 任务完成，正在解析...");
                    const outputs = historyData[task.promptId].outputs;
                    
                    let filename = null;
                    let subfolder = "";
                    let type = "output";

                    // 遍历寻找视频文件
                    for (const nodeId in outputs) {
                        const nodeOutput = outputs[nodeId];
                        if (nodeOutput.videos && nodeOutput.videos.length > 0) {
                            filename = nodeOutput.videos[0].filename;
                            subfolder = nodeOutput.videos[0].subfolder;
                            type = nodeOutput.videos[0].type;
                            break;
                        }
                        if (nodeOutput.gifs && nodeOutput.gifs.length > 0) {
                            filename = nodeOutput.gifs[0].filename;
                            subfolder = nodeOutput.gifs[0].subfolder;
                            type = nodeOutput.gifs[0].type;
                            break;
                        }
                    }

                    if (filename) {
                        const baseUrl = process.env.COMFY_API_URL.replace(/\/$/, "");
                        const params = new URLSearchParams();
                        params.append("filename", filename);
                        params.append("type", type);
                        if (subfolder) params.append("subfolder", subfolder);

                        const cloudUrl = `${baseUrl}/view?${params.toString()}`;
                        console.log("☁️ 发现云端视频，准备下载...");

                        // 下载并保存到本地
                        let finalUrl = cloudUrl; 
                        try {
                            finalUrl = await downloadVideoToLocal(cloudUrl, filename);
                        } catch (downloadErr) {
                            console.error("⚠️ 下载失败，回退到云端链接");
                        }

                        await prisma.videoTask.update({
                            where: { id: task.id },
                            data: { status: 'COMPLETED', videoUrl: finalUrl }
                        });
                        
                        return res.json({ status: 'COMPLETED', videoUrl: finalUrl });
                    }
                }
            } catch (e) {
                // ComfyUI 还没返回结果，继续等待
            }
        }
        res.json({ status: task.status, videoUrl: task.videoUrl });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
});