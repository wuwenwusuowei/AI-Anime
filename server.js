import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch'; // 如果Node版本较低可能需要这个，Node 18+自带fetch可忽略
import 'dotenv/config';

// --- 1. 基础配置 ---
const app = express();
const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置中间件
app.use(cors());
app.use(express.json());

// 配置 Multer (文件上传临时目录)
const upload = multer({ dest: 'uploads/' });

// 配置智谱 AI
const zhipu = new OpenAI({
    apiKey: process.env.ZHIPU_API_KEY, 
    baseURL: "https://open.bigmodel.cn/api/paas/v4/" 
});

// --- 2. 核心工具函数 ---

/**
 * 功能：利用智谱 GLM-4V (视觉模型) 分析图片特征
 * 作用：解决"人物一致性"问题，让AI看懂原图长什么样
 */
async function analyzeImageFeatures(filePath) {
    console.log("👀 [AI视觉] 正在全方位分析图片 (人物 + 背景)...");
    
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Image = fileBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        const response = await zhipu.chat.completions.create({
            model: "glm-4v-flash", // 免费且快速的视觉模型
            messages: [
                {
                    role: "user",
                    content: [
                        { 
                            type: "text", 
                            text: "请分析这张图片，提取以下三个维度的英文特征 Tags：\n1. 人物外观（发色、服饰）。\n2. 人物当前姿势（站立、坐着、侧身）。\n3. 背景环境细节（树木、建筑、天空颜色、室内/室外）。\n\n请直接输出英文单词，用逗号分隔，不要分类，不要输出任何解释。" 
                        },
                        { type: "image_url", image_url: { url: dataUrl } }
                    ]
                }
            ]
        });
        
        const tags = response.choices[0].message.content;
        console.log("🤖 [AI视觉] 提取结果:", tags);
        return tags;
    } catch (e) {
        console.error("❌ 智谱视觉分析失败:", e.message);
        return "1girl, anime style, standing, outdoor"; // 保底词，防止流程中断
    }
}

/**
 * 功能：利用智谱 GLM-4 (语言模型) 组合最终提示词
 */
async function translatePrompt(userActionText, featureTags, style) {
    console.log(`📝 [AI翻译] 组合提示词...`);
    
    // 🔴 修改点1：加入 "background consistency" 相关的魔法词
    let stylePrompt = "anime style, 2D, flat color, high quality, 4k, vivid colors, highly detailed background, consistent background";
    
    const systemPrompt = `你是一个视频生成提示词专家。
    任务：基于图片特征和用户指令生成提示词。
    
    输入：
    1. 图片视觉特征（人物+背景）：${featureTags}
    2. 用户指令：${userActionText}
    
    规则：
    1. **必须保留图片中的背景描述**，放在提示词前部。
    2. **必须保留图片中的姿势描述**（如 standing, sitting），除非用户指令明确要求改变姿势。
    3. 将用户指令翻译为微小的动态描述（如 subtle breathing, hair floating, slight head movement），避免大幅度动作导致背景崩坏。
    4. 加上风格词：${stylePrompt}。
    5. 只输出英文 Tags。`;

    const completion = await zhipu.chat.completions.create({
        model: "glm-4-flash", 
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "开始处理" }
        ],
    });
    return completion.choices[0].message.content;
}

/**
 * 功能：将图片上传到云端 ComfyUI 服务器
 */
async function uploadImageToComfy(localFilePath, originalFilename) {
    console.log(`📤 [上传] 正在上传图片到 ComfyUI: ${originalFilename}`);
    
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
        console.log(`✅ [上传] 成功，云端文件名: ${data.name}`);
        return data.name; 
    } catch (error) {
        throw new Error(`连接 ComfyUI 上传接口失败: ${error.message}`);
    }
}

/**
 * 功能：加载 JSON 模板并触发生成任务
 */
async function triggerComfyUI(positivePrompt, cloudImageName) {
    // 确保你的 JSON 文件名是这个
    const workflowPath = path.join(__dirname, 'Image-to-Video.json'); 
    
    if (!fs.existsSync(workflowPath)) {
        throw new Error("找不到工作流模板文件: Image-to-Video.json");
    }

    let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    // --- 🚨 [ID 配置区] 请务必核对你的 JSON ID ---
    const TEXT_NODE_ID = "9";   // 正向提示词 (CLIPTextEncode)
    const SEED_NODE_ID = "12";  // 随机种子 (KSampler)
    const IMAGE_NODE_ID = "6";  // 图片上传 (LoadImage)
    // ------------------------------------------

    // 1. 注入提示词
    if (workflow[TEXT_NODE_ID]) {
        workflow[TEXT_NODE_ID].inputs.text = positivePrompt;
    } else {
        throw new Error(`找不到提示词节点 ID: ${TEXT_NODE_ID}`);
    }
    
    // 2. 注入图片文件名
    if (workflow[IMAGE_NODE_ID]) {
        workflow[IMAGE_NODE_ID].inputs.image = cloudImageName;
    } else {
        throw new Error(`找不到图片加载节点 ID: ${IMAGE_NODE_ID}`);
    }

    // 3. 注入随机种子
    const randomSeed = Math.floor(Math.random() * 1000000000000);
    if (workflow[SEED_NODE_ID]) {
        workflow[SEED_NODE_ID].inputs.seed = randomSeed;
    }

    console.log(`🚀 [触发] 发送任务给 ComfyUI... 种子: ${randomSeed}`);
    
    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) throw new Error(`ComfyUI Error: ${response.statusText}`);
    
    const data = await response.json();
    return data.prompt_id;
}

// --- 3. API 路由接口 ---

// POST: 创建生成任务
app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        const { prompt, style } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ error: "请上传一张图片！" });

        console.log(`\n🆕 收到新任务: ${prompt || "默认动作"}, 图片: ${file.originalname}`);

        // 1. 数据库建档
        const task = await prisma.videoTask.create({
            data: { 
                userPrompt: prompt || "动态视频", 
                style: style || 'anime', 
                status: 'PENDING' 
            }
        });

        // 2. 异步处理流水线 (不阻塞前端响应)
        (async () => {
            try {
                // A. 上传图片到 ComfyUI
                const cloudFileName = await uploadImageToComfy(file.path, file.originalname);
                
                // B. 智谱看图提取特征
                const charFeatures = await analyzeImageFeatures(file.path);
                
                // C. 组合最终提示词
                const finalPrompt = await translatePrompt(prompt || "moving, high quality", charFeatures, style);
                
                // 更新数据库记录翻译结果
                await prisma.videoTask.update({ 
                    where: { id: task.id }, 
                    data: { translatedPrompt: finalPrompt } 
                });

                // D. 触发 ComfyUI
                const promptId = await triggerComfyUI(finalPrompt, cloudFileName);
                
                // E. 更新状态为进行中
                await prisma.videoTask.update({
                    where: { id: task.id }, 
                    data: { status: 'PROCESSING', promptId: promptId }
                });

                console.log(`✅ 任务 ${task.id} 处理中, PromptID: ${promptId}`);

            } catch (err) {
                console.error("❌ 后台任务执行失败:", err);
                await prisma.videoTask.update({ 
                    where: { id: task.id }, 
                    data: { status: 'FAILED' } 
                });
            } finally {
                // 清理本地上传的临时图片
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            }
        })();

        // 立即返回任务ID
        res.json({ success: true, taskId: task.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET: 查询任务状态 (包含 MP4/GIF 解析 + 子目录修复)
app.get('/api/status/:id', async (req, res) => {
    try {
        const taskId = parseInt(req.params.id);
        const task = await prisma.videoTask.findUnique({ where: { id: taskId } });
        
        if (!task) return res.status(404).json({ error: "任务不存在" });

        // 如果已完成，直接返回结果
        if (task.status === 'COMPLETED') {
            return res.json({ status: 'COMPLETED', videoUrl: task.videoUrl });
        }

        // 如果是处理中，去 ComfyUI 查历史
        if (task.status === 'PROCESSING' && task.promptId) {
            try {
                const historyRes = await fetch(`${process.env.COMFY_API_URL}/history/${task.promptId}`);
                const historyData = await historyRes.json();
                
                // 如果历史数据里有这个 ID，说明跑完了
                if (historyData[task.promptId]) {
                    console.log("🏁 ComfyUI 任务结束，正在解析输出文件...");
                    const outputs = historyData[task.promptId].outputs;
                    
                    let filename = null;
                    let subfolder = "";
                    let type = "output";

                    // 遍历所有输出节点寻找视频文件
                    for (const nodeId in outputs) {
                        const nodeOutput = outputs[nodeId];

                        // 1. 优先找 videos (MP4)
                        if (nodeOutput.videos && nodeOutput.videos.length > 0) {
                            const fileData = nodeOutput.videos[0];
                            filename = fileData.filename;
                            subfolder = fileData.subfolder;
                            type = fileData.type;
                            console.log(`👉 找到 MP4: ${filename} (目录: ${subfolder})`);
                            break;
                        }

                        // 2. 其次找 gifs (兼容旧配置)
                        if (nodeOutput.gifs && nodeOutput.gifs.length > 0) {
                            const fileData = nodeOutput.gifs[0];
                            filename = fileData.filename;
                            subfolder = fileData.subfolder;
                            type = fileData.type;
                            console.log(`👉 找到 GIF: ${filename} (目录: ${subfolder})`);
                            break;
                        }
                    }

                    if (filename) {
                        // --- URL 拼接逻辑 (修复子目录和双斜杠问题) ---
                        
                        // 1. 去掉 .env 里 URL 可能多余的末尾斜杠
                        const baseUrl = process.env.COMFY_API_URL.replace(/\/$/, "");
                        
                        // 2. 构造查询参数
                        const params = new URLSearchParams();
                        params.append("filename", filename);
                        params.append("type", type);
                        if (subfolder) params.append("subfolder", subfolder);

                        // 3. 生成最终链接
                        const fullVideoUrl = `${baseUrl}/view?${params.toString()}`;

                        console.log("🔗 视频最终地址:", fullVideoUrl);

                        // 更新数据库
                        await prisma.videoTask.update({
                            where: { id: task.id },
                            data: { status: 'COMPLETED', videoUrl: fullVideoUrl }
                        });
                        
                        return res.json({ status: 'COMPLETED', videoUrl: fullVideoUrl });
                    } else {
                        console.warn("⚠️ 任务显示完成，但未找到视频输出文件");
                    }
                }
            } catch (e) {
                console.error("查询 ComfyUI 历史出错:", e.message);
            }
        }
        
        // 还没完成，返回当前状态
        res.json({ status: task.status, videoUrl: task.videoUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// --- 4. 启动服务 ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 EduMatch 后端服务已启动`);
    console.log(`📡 本地地址: http://localhost:${PORT}`);
    console.log(`🔗 远程 ComfyUI: ${process.env.COMFY_API_URL}`);
});