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
import 'dotenv/config';

const streamPipeline = promisify(pipeline);

// --- 1. 配置常量 ---

// 画质配置 (16:9)
const RESOLUTION_CONFIG = {
    "576p": { width: 1024, height: 576 },
    "720p": { width: 1280, height: 720 }
};

// 时长配置 (基于 16fps，公式: 秒数 * 16 + 1)
// 显存预警：720p下超过 3秒(49帧) 容易爆显存，请注意
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

app.use(cors());
app.use(express.json());

// 🟢 [新增] 配置静态目录，让前端能访问本地视频文件
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

const zhipu = new OpenAI({
    apiKey: process.env.ZHIPU_API_KEY, 
    baseURL: "https://open.bigmodel.cn/api/paas/v4/" 
});

// --- 2. 核心 AI 逻辑 (重写版) ---

/**
 * 视觉分析：现在要求 AI 生成一段"静态画面描述"，而不是零散的标签
 */
async function analyzeImageFeatures(filePath) {
    console.log("👀 [AI视觉] 正在深度解析画面...");
    
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Image = fileBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await zhipu.chat.completions.create({
            model: "glm-4v-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            // 🌟 核心修改：要求生成通顺的英文段落
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
 * 提示词生成：升级为"视觉导演"模式，构建电影感和空间感
 */
async function translatePrompt(userActionText, staticDescription, style) {
    console.log(`📝 [AI编剧] 正在构建高一致性动态场景...`);
    
    // 黄金风格后缀 (保持不变)
    let styleSuffix = "anime style, 2D, flat color, cel shading, high quality, masterpiece, 4k, vivid colors, high contrast";
    
    const systemPrompt = `你是一个精通 Wan 2.1 视频模型的"视觉导演"。
    你的任务是将[静态画面描述]与[用户动作指令]融合，编写一段**具有电影感、空间感**的英文视频脚本。
    
    输入信息：
    1. 画面基础（视觉特征）：${staticDescription}
    2. 导演指令（用户动作）：${userActionText}
    
    编写核心原则（逻辑重构）：
    1. **环境空间构建（关键）**：
       - 不要只写"背景是静止的"。
       - **必须详细描述环境的空间关系**。例如："standing under a large cherry blossom tree", "school buildings in the distance", "blue sky above". 
       - 这样当视频产生镜头运动时，模型能依据这些逻辑自然扩写背景。
    
    2. **动作与物理互动**：
       - 将用户的简单指令（如"挥手"）转化为**连贯的物理动作**。
       - 必须加入环境互动细节。例如："hair flowing in the wind", "light and shadow changing on face", "cherry petals falling around".
    
    3. **运镜与质感**：
       - 除非用户明确要求静止，否则默认加入微小的运镜描述，如 "slow cinematic camera movement", "slight parallax", "depth of field".
       - 保持人物特征（Character Consistency）绝对稳定。
    
    4. **结构要求**：
       - [环境与光影] + [人物外貌与姿势] + [动作与互动] + [风格后缀]
       - 直接输出一段通顺的英文段落。`;

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
 * 功能：将云端视频下载到本地硬盘
 */
async function downloadVideoToLocal(cloudUrl, filename) {
    console.log(`📥 [下载] 正在将视频搬运到本地...`);
    
    try {
        // 1. 请求云端文件
        const response = await fetch(cloudUrl);
        if (!response.ok) throw new Error(`下载失败: ${response.statusText}`);

        // 2. 确保保存路径存在
        const saveDir = path.join(__dirname, 'public', 'videos');
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        // 3. 生成本地文件名 (加个时间戳防止重名)
        const localFilename = `${Date.now()}_${filename}`;
        const localFilePath = path.join(saveDir, localFilename);

        // 4. 写入硬盘
        await streamPipeline(response.body, fs.createWriteStream(localFilePath));

        console.log(`💾 [保存] 视频已保存至: ${localFilePath}`);
        
        // 5. 返回本地可访问的 URL (供前端使用)
        // 注意：这里返回的是指向你本地后端的链接
        return `http://localhost:${process.env.PORT || 3000}/videos/${localFilename}`;
    } catch (error) {
        console.error(`❌ [下载失败] ${error.message}`);
        throw error;
    }
}

// --- 3. ComfyUI 工具函数 ---

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

    // --- ID 配置 ---
    const TEXT_NODE = "30";
    const IMAGE_NODE = "43";
    const PAINTER_NODE = "56"; // 核心生成节点 (改分辨率 + 帧数)
    const RESIZE_NODE = "59";  // 图片缩放节点 (改分辨率)
    const SAMPLER_IDS = ["38", "39"];
    // --------------

    // 1. 计算参数
    const resConfig = RESOLUTION_CONFIG[resolutionKey] || RESOLUTION_CONFIG["576p"];
    const targetFrames = DURATION_MAP[durationKey] || 49; // 默认3秒

    console.log(`🔧 [配置] 画质: ${resConfig.width}x${resConfig.height} | 时长: ${durationKey}s (${targetFrames}帧)`);

    // 2. 修改分辨率 (Painter 和 Resize 都要改)
    if (workflow[PAINTER_NODE]) {
        workflow[PAINTER_NODE].inputs.width = resConfig.width;
        workflow[PAINTER_NODE].inputs.height = resConfig.height;
        workflow[PAINTER_NODE].inputs.length = targetFrames; // <--- 修改总帧数
    }
    if (workflow[RESIZE_NODE]) {
        workflow[RESIZE_NODE].inputs.width = resConfig.width;
        workflow[RESIZE_NODE].inputs.height = resConfig.height;
    }

    // 3. 注入提示词、图片、种子 (保持原逻辑)
    if (workflow[TEXT_NODE]) {
        workflow[TEXT_NODE].inputs.text = positivePrompt;
    } else {
        throw new Error(`找不到提示词节点 ID: ${TEXT_NODE}`);
    }

    if (workflow[IMAGE_NODE]) {
        workflow[IMAGE_NODE].inputs.image = cloudImageName;
    } else {
        throw new Error(`找不到图片节点 ID: ${IMAGE_NODE}`);
    }

    // 注入随机种子 (同时给两个采样器赋值)
    const randomSeed = Math.floor(Math.random() * 1000000000000);
    
    SAMPLER_IDS.forEach(id => {
        if (workflow[id]) {
            workflow[id].inputs.noise_seed = randomSeed;
        } else {
            console.warn(`⚠️ 警告: 找不到采样器节点 ID ${id}`);
        }
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

// --- 4. API 路由 ---

// 用户注册
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: '请填写完整信息' });
        }

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: '邮箱已被注册' });
        }

        // 创建用户（密码实际应该加密，这里简化处理）
        const user = await prisma.user.create({
            data: { username, email, password }
        });

        // 生成token（简化版）
        const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: '请填写完整信息' });
        }

        // 查找用户
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 验证密码（简化版，实际应该用bcrypt）
        if (user.password !== password) {
            return res.status(401).json({ error: '邮箱或密码错误' });
        }

        // 生成token
        const token = Buffer.from(`${user.id}:${user.email}`).toString('base64');

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 检查token验证（简化版）
app.get('/api/auth/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: '未授权' });
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId, email] = decoded.split(':');

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.id.toString() !== userId) {
            return res.status(401).json({ error: 'token无效' });
        }

        res.json({
            success: true,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        // 从 body 获取参数
        const { prompt, resolution, duration } = req.body;
        const file = req.file;
        if (!file) return res.status(400).json({ error: "请上传图片" });

        console.log(`\n🆕 收到新任务: ${prompt}, 画质: ${resolution}, 时长: ${duration}s, 图片: ${file.originalname}`);

        const task = await prisma.videoTask.create({
            data: { userPrompt: prompt || "动态视频", style: 'anime', status: 'PENDING' }
        });

        res.json({ success: true, taskId: task.id });

        (async () => {
            try {
                // A. 上传图片
                const cloudFileName = await uploadImageToComfy(file.path, file.originalname);
                
                // B. 视觉分析 (生成静态描述)
                const staticDesc = await analyzeImageFeatures(file.path);
                
                // C. 提示词融合 (静态 + 动作 + 风格)
                const finalPrompt = await translatePrompt(prompt || "natural movement", staticDesc, 'anime');
                
                await prisma.videoTask.update({ where: { id: task.id }, data: { translatedPrompt: finalPrompt } });

                // D. 触发任务
                const promptId = await triggerComfyUI(finalPrompt, cloudFileName, resolution, duration);
                
                await prisma.videoTask.update({ where: { id: task.id }, data: { status: 'PROCESSING', promptId: promptId } });

            } catch (err) {
                console.error("❌ 任务失败:", err);
                await prisma.videoTask.update({ where: { id: task.id }, data: { status: 'FAILED' } });
            } finally {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }
        })();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 查询接口 (保持之前的 MP4/Subfolder 解析逻辑)
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

                    for (const nodeId in outputs) {
                        const nodeOutput = outputs[nodeId];
                        // 优先找 MP4
                        if (nodeOutput.videos && nodeOutput.videos.length > 0) {
                            filename = nodeOutput.videos[0].filename;
                            subfolder = nodeOutput.videos[0].subfolder;
                            type = nodeOutput.videos[0].type;
                            break;
                        }
                        // 兼容 GIF
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

                        // 这是云端的临时链接 (稍后会失效)
                        const cloudUrl = `${baseUrl}/view?${params.toString()}`;
                        console.log("☁️ 云端临时地址:", cloudUrl);

                        // 🟢 [新增核心逻辑] 下载到本地！
                        let finalUrl = cloudUrl; // 默认先用云端的
                        try {
                            // 调用下载函数，把云端链接变成本地链接
                            finalUrl = await downloadVideoToLocal(cloudUrl, filename);
                        } catch (downloadErr) {
                            console.error("⚠️ 下载到本地失败，将使用云端链接:", downloadErr.message);
                        }

                        // 更新数据库 (存的是永久有效的本地链接)
                        await prisma.videoTask.update({
                            where: { id: task.id },
                            data: { status: 'COMPLETED', videoUrl: finalUrl }
                        });
                        
                        return res.json({ status: 'COMPLETED', videoUrl: finalUrl });
                    }
                }
            } catch (e) {
                // 忽略网络抖动
            }
        }
        res.json({ status: task.status, videoUrl: task.videoUrl });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

// 确保视频保存目录存在
const videosDir = path.join(__dirname, 'public', 'videos');
if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
    console.log(`📁 创建视频目录: ${videosDir}`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
});