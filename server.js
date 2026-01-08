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
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import taskRoutes from './routes/tasks.js';
import templateRoutes from './routes/templates.js';

const streamPipeline = promisify(pipeline);

// 设置 FFmpeg 路径
ffmpeg.setFfmpegPath(ffmpegPath.path);
console.log('✅ FFmpeg 路径已设置:', ffmpegPath.path);

// --- 1. 配置常量 ---

// ========================================
// DaSiWa 8.1 比例配置（基于 LayerUtility 节点 141/146）
// ========================================
const RATIO_SETTING = {
    "16:9": {
        ratio: "16:9",
        longest: 1024,    // 默认长边值 (12GB显存推荐)
        width: 1024,
        height: 576,
        vram_min: 12,
        description: "标准横屏 (电脑网页、B站视频)"
    },
    "16:9-hd": {
        ratio: "16:9",
        longest: 1280,    // 高清长边值 (需16GB以上显存)
        width: 1280,
        height: 720,
        vram_min: 16,
        description: "高清横屏 (电影质感、大屏展示)"
    },
    "9:16": {
        ratio: "9:16",
        longest: 1024,    // 默认长边值 (12GB显存推荐)
        width: 576,
        height: 1024,
        vram_min: 12,
        description: "手机竖屏 (抖音、小红书、快手)"
    },
    "9:16-hd": {
        ratio: "9:16",
        longest: 1280,    // 高清长边值 (需16GB以上显存)
        width: 720,
        height: 1280,
        vram_min: 16,
        description: "高清竖屏 (高质量竖屏短剧)"
    },
    "1:1": {
        ratio: "1:1",
        longest: 832,     // 正方形长边值
        width: 832,
        height: 832,
        vram_min: 8,
        description: "正方形 (头像、朋友圈、Instagram)"
    },
    "4:3": {
        ratio: "4:3",
        longest: 1024,    // 复古比例长边值
        width: 1024,
        height: 768,
        vram_min: 12,
        description: "复古比例 (复古动漫、经典番剧感)"
    }
};

// 画质配置 (16:9) - 保留用于旧版工作流
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

// Flux 画幅映射
const ASPECT_RATIOS = {
    "1:1": { width: 1024, height: 1024 },
    "9:16": { width: 832, height: 1216 }, // 竖屏 (最佳分镜比例)
    "16:9": { width: 1216, height: 832 }, // 横屏
    "3:4": { width: 896, height: 1152 }
};

// ========================================
// DaSiWa 8.1 双路径系统节点 ID 定义
// ========================================
const DASIWAN_NODES = {
    // 首尾帧模式（双图）节点 ID
    DUAL_START_IMAGE: "211",       // 起始图加载
    DUAL_END_IMAGE: "209",         // 结束图加载
    DUAL_POSITIVE_PROMPT: "136",   // 正面提示词
    DUAL_NEGATIVE_PROMPT: "128",   // 负面提示词
    DUAL_RESOLUTION_VALUE: "300",  // 画质缩放值（长边：1024=576p, 1280=720p）
    DUAL_DURATION_VALUE: "301",    // 视频时长（81=5秒, 49=3秒）
    DUAL_VIDEO_GEN: "139",         // 视频生成节点（WanFirstLastFrameToVideo）
    DUAL_FINAL_OUTPUT: "125",      // 最终视频输出节点（VHS_VideoCombine）
    
    // 纯单图模式（PainterI2V）节点 ID
    SINGLE_START_IMAGE: "297",       // 起始图加载
    SINGLE_POSITIVE_PROMPT: "287",   // 正面提示词
    SINGLE_RESOLUTION_VALUE: "298",  // 画质缩放值（长边：1024=576p, 1280=720p）
    SINGLE_DURATION_VALUE: "299",    // 视频时长（81=5秒, 49=3秒）
    SINGLE_VIDEO_GEN: "293",         // 视频生成节点（PainterI2V - 无首尾锁定）
    SINGLE_FINAL_OUTPUT: "269"      // 最终视频输出节点（VHS_VideoCombine）
};

// --- 风格配置表 (基于用户指定文件) ---
const STYLE_MAP = {
    "default": {
        name: "默认风格",
        lora: null,
        strength: 0,
        prompt_suffix: ""
    },
    "guofeng": {
        name: "国风少女",
        lora: "国风么女图.safetensors",
        strength: 0.8,
        prompt_suffix: ", traditional chinese style, ink wash painting, hanfu, elegant, masterpiece"
    },
    "ai_anime": {
        name: "AI动漫风格",
        lora: "Anime_Arts.safetensors",
        strength: 0.8,
        prompt_suffix: ", anime arts style, digital art, highly detailed, vibrant colors"
    },
    "stained_glass": {
        name: "彩绘玻璃",
        lora: "anime_stained_glass_v1.0.safetensors",
        strength: 0.7,
        prompt_suffix: ", stained glass style, mosaic, bold outlines, transparent texture"
    },
    "japan_anime": {
        name: "日漫风格",
        lora: "Anime_styler_v1.safetensors",
        strength: 0.8,
        prompt_suffix: ", japanese anime style, flat color, cel shading, clean lines"
    },
    "screencap": {
        name: "动漫截图",
        lora: "animescreencap_flux_v1_2000.safetensors",
        strength: 0.7,
        prompt_suffix: ", anime screencap, retro anime style, 90s anime, broadcast quality"
    },
    "semi_real": {
        name: "半写实风",
        lora: "Flux__Semi-realistic_art_style-000004.safetensors",
        strength: 0.7,
        prompt_suffix: ", semi-realistic, 2.5D, depth of field, detailed skin texture, soft lighting"
    },
    "3d_anime": {
        name: "3D AI动漫",
        lora: "hinaFluxAnimeStyle_v3.safetensors",
        strength: 0.75,
        prompt_suffix: ", 3d render style, cgi, blender, unreal engine, volumetric lighting"
    }
};

// --- 2. 基础配置 ---
const app = express();

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 数据库初始化函数
async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 测试基本查询
    const userCount = await prisma.user.count();
    console.log(`📊 当前用户数量: ${userCount}`);
    
    const videoCount = await prisma.video.count();
    console.log(`📊 当前视频数量: ${videoCount}`);
    
    const taskCount = await prisma.videoTask.count();
    console.log(`📊 当前任务数量: ${taskCount}`);
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    
    // 如果是表不存在的错误，尝试创建表
    if (error.message.includes('no such table')) {
      console.log('🔧 尝试创建数据库表...');
      try {
        // 这里可以添加手动创建表的逻辑
        console.log('⚠️  请运行 npx prisma db push 来创建表结构');
      } catch (createError) {
        console.error('❌ 创建表失败:', createError.message);
      }
    }
  }
}

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

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/templates', templateRoutes);

const upload = multer({ dest: 'uploads/' });

const zhipu = new OpenAI({
    apiKey: process.env.ZHIPU_API_KEY, 
    baseURL: "https://open.bigmodel.cn/api/paas/v4/" 
});

// 豆包API配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY;
const DOUBAO_MODEL = 'doubao-seedream-4-5-251128';

// 豆包画幅映射（API接受的size参数）
// 豆包API要求图片至少3,686,400像素，所以使用更大的尺寸
const DOUBAO_SIZE_MAP = {
    "9:16": "1920x2560",  // 4,915,200 像素
    "1:1": "2048x2048",   // 4,194,304 像素
    "16:9": "2560x1440",  // 3,686,400 像素（正好满足最低要求）
    "3:4": "1920x2560"    // 4,915,200 像素（复用9:16的尺寸）
};

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
 * 文生图提示词优化助手
 * 将用户的简单中文/英文输入转换为适合Flux模型的高质量英文提示词
 */
async function optimizePrompt(userPrompt, styleSuffix = "") {
    console.log(`✨ [AI优化] 正在优化文生图提示词...`);
    const systemPrompt = `你是一个专业的AI绘画提示词工程师，精通Flux模型。
    请将用户的输入（可能是中文或简单的英文）改写为高质量的英文提示词。

    优化原则：
    1. **保留原意**：准确表达用户想要的主体和动作。
    2. **增加细节**：补充光影、质感、构图、氛围等细节描述。
    3. **自然语言**：Flux模型偏好自然语言描述，而非单纯的标签堆砌。
    4. **风格融合**：如果用户指定了风格，请确保提示词契合该风格。

    输出格式：直接输出一段英文提示词，不要包含解释或其他内容。`;

    try {
        const completion = await zhipu.chat.completions.create({
            model: "glm-4-flash",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `用户输入: ${userPrompt}\n风格倾向: ${styleSuffix}` }
            ]
        });
        return completion.choices[0].message.content;
    } catch (e) {
        console.error("❌ 提示词优化失败:", e);
        return userPrompt + ", high quality" + styleSuffix;
    }
}

/**
 * 图生图分镜助手 (自然语言优化版)
 * 依靠 LLM 的理解力来构建 Prompt，避免硬编码导致的生硬感
 */
async function generateScenePrompt(userInstruction, refImageDesc) {
    console.log(`🎬 [AI分镜] 正在生成分镜描述...`);

    // 提取核心特征
    const coreFeatures = refImageDesc.split(',').slice(0, 5).join(',');

    const systemPrompt = `你是一个精通 Flux 模型的提示词专家。
    你的任务是将用户的[简短指令]转化为一段**连贯、画面感极强**的英文分镜描述。

    输入信息：
    1. 参考图特征：${refImageDesc} (人物外观)
    2. 用户指令：${userInstruction} (核心意图)

    ⚠️ 编写原则 (Logic):
    1. **结构化描述**：按照 [环境与背景] -> [镜头视角] -> [人物动作] -> [外观特征] 的顺序编写。**Flux 模型最关注开头的内容**。
    2. **环境重构**：如果用户指令隐含了环境变化（如"飞在天上"暗示背景是天空），请在**第一句**明确描述新环境，并使用 "Vast", "Detailed", "Immersive" 等形容词来确立场景。
    3. **镜头语言**：将用户的视角指令转化为专业的摄影术语 (e.g., High angle shot, Fisheye lens, Cinematic lighting)。
    4. **自然融合**：不要堆砌标签，要写成通顺的句子。例如："She is soaring through a clear blue sky..." 而不是 "(Blue sky:1.5), flying"。

    输出格式：一段完整的英文描述。`;

    try {
        const completion = await zhipu.chat.completions.create({
            model: "glm-4-flash",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "生成优化后的 Prompt" }
            ]
        });

        let prompt = completion.choices[0].message.content;
        console.log(`✨ [LLM生成] ${prompt.substring(0, 60)}...`);
        return prompt;

    } catch (e) {
        console.error("❌ 分镜生成失败:", e);
        // 简单的保底
        return `${userInstruction}, highly detailed, cinematic shot, ${coreFeatures}`;
    }
}

/**
 * 下载云端文件到本地（通用函数，支持图片和视频）
 */
async function downloadFileToLocal(cloudUrl, filename, type = "output") {
    // 根据文件类型判断保存目录
    const isImage = filename.match(/\.(png|jpg|jpeg|webp|gif)$/i);
    const saveDir = isImage
        ? path.join(__dirname, 'public', 'images')
        : path.join(__dirname, 'public', 'videos');

    // 确保目录存在
    if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
        console.log(`📁 创建目录: ${saveDir}`);
    }

    console.log(`📥 [下载] 正在将${isImage ? '图片' : '视频'}搬运到本地...`);

    try {
        const response = await fetch(cloudUrl);
        if (!response.ok) throw new Error(`下载失败: ${response.statusText}`);

        const localFilename = `${Date.now()}_${filename}`;
        const localFilePath = path.join(saveDir, localFilename);

        await streamPipeline(response.body, fs.createWriteStream(localFilePath));

        console.log(`💾 [保存] ${isImage ? '图片' : '视频'}已保存至: ${localFilePath}`);

        // 返回本地可访问的 URL
        const relativePath = isImage ? 'images' : 'videos';
        return `http://localhost:${process.env.PORT || 3000}/${relativePath}/${localFilename}`;
    } catch (error) {
        console.error(`❌ [下载失败] ${error.message}`);
        throw error;
    }
}

// --- 4. 豆包API工具函数 ---

/**
 * 上传图片到云端，返回可访问的URL
 * 用于豆包API需要图片URL的情况
 */
async function uploadImageToCloud(localFilePath) {
    console.log(`📤 [上传] 正在上传图片到云端...`);

    try {
        // 读取图片并转换为base64
        const imageBuffer = fs.readFileSync(localFilePath);
        const base64Image = imageBuffer.toString('base64');

        // 使用data URL格式
        const dataUrl = `data:image/png;base64,${base64Image}`;

        // 简单返回data URL（豆包API支持data URL）
        return dataUrl;
    } catch (error) {
        console.error('❌ 图片上传失败:', error);
        throw error;
    }
}

/**
 * 调用豆包API进行图生图
 * @param {string} prompt - 提示词
 * @param {string|string[]} imageUrl - 参考图URL（可以是单张图片URL或图片URL数组）
 * @param {string} ratio - 画幅比例 (9:16, 1:1, 16:9, 3:4)
 */
async function callDoubaoImg2Img(prompt, imageUrl, ratio = "1:1") {
    console.log(`🎨 [豆包图生图] 开始生成...`);

    const size = DOUBAO_SIZE_MAP[ratio] || DOUBAO_SIZE_MAP["1:1"];

    const requestData = {
        model: DOUBAO_MODEL,
        prompt: prompt,
        image: Array.isArray(imageUrl) ? imageUrl : imageUrl,
        sequential_image_generation: "disabled",
        response_format: "url",
        size: size,
        stream: false,
        watermark: true
    };

    console.log(`🔧 [配置] 提示词: ${prompt.substring(0, 50)}... | 画幅: ${ratio} (${size})`);
    console.log(`🔧 [配置] 参考图数量: ${Array.isArray(imageUrl) ? imageUrl.length : 1}`);

    try {
        const response = await fetch(DOUBAO_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DOUBAO_API_KEY}`
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 豆包API错误:', response.status, errorText);
            throw new Error(`豆包API调用失败: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ [豆包] 生成成功`);
        console.log(`📦 [豆包] 返回数据:`, JSON.stringify(data, null, 2));

        return data;
    } catch (error) {
        console.error('❌ 豆包API调用失败:', error);
        throw error;
    }
}

// --- 5. ComfyUI 工具函数 ---

async function uploadImageToComfy(localFilePath, originalFilename) {
    console.log(`📤 [上传] 正在处理图片: ${originalFilename}`);

    // 1. 定义压缩后的临时文件路径
    const compressedPath = localFilePath + "_compressed.jpg";

    try {
        // 2. 使用 sharp 压缩图片
        // resize: 限制宽或高不超过 1536px，保持比例
        // jpeg: 质量 85，通常能把 10MB 的图压到 300KB 左右，且画质足够做参考图
        await sharp(localFilePath)
            .resize({ width: 1536, height: 1536, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(compressedPath);

        console.log(`📉 图片已压缩，准备上传...`);

        // 3. 上传压缩后的图片
        const formData = new FormData();
        formData.append('image', fs.createReadStream(compressedPath));
        formData.append('overwrite', 'true');

        const response = await fetch(`${process.env.COMFY_API_URL}/upload/image`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`ComfyUI Upload Failed: ${response.statusText}`);
        }

        const data = await response.json();

        // 4. 上传成功后，删除压缩的临时文件
        fs.unlinkSync(compressedPath);

        return data.name;

    } catch (error) {
        // 出错也要尝试清理临时文件
        if (fs.existsSync(compressedPath)) fs.unlinkSync(compressedPath);
        throw error;
    }
}

// Flux 文生图触发函数 (已增强提示词优化)
async function triggerTxt2Img(optimizedPrompt, ratio = "9:16", styleKey = "default") {
    console.log(`🎨 [Flux 文生图] 开始生成...`);
    const workflowPath = path.join(__dirname, 'Flux_Txt2Img_API.json');
    let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    // 节点 ID 配置
    const PROMPT_NODE = "2";
    const SEED_NODE = "5";
    const RESOLUTION_NODE = "4";
    const LORA_NODE = "10";

    const styleConfig = STYLE_MAP[styleKey] || STYLE_MAP["default"];
    const ratioConfig = ASPECT_RATIOS[ratio] || ASPECT_RATIOS["9:16"];
    const seed = Math.floor(Math.random() * 1000000000000);

    console.log(`🔧 [配置] 风格: ${styleConfig.name} (${styleKey})`);
    console.log(`🔧 [配置] 提示词: ${optimizedPrompt.substring(0, 50)}... | 画幅: ${ratio} (${ratioConfig.width}x${ratioConfig.height})`);

    // 修改参数 (使用已优化的Prompt)
    workflow[PROMPT_NODE].inputs.text = optimizedPrompt;
    workflow[SEED_NODE].inputs.seed = seed;
    workflow[RESOLUTION_NODE].inputs.width = ratioConfig.width;
    workflow[RESOLUTION_NODE].inputs.height = ratioConfig.height;

    // 设置 LoRA 参数
    if (styleConfig.lora && workflow[LORA_NODE]) {
        workflow[LORA_NODE].inputs.lora_name = styleConfig.lora;
        workflow[LORA_NODE].inputs.strength_model = styleConfig.strength;
        workflow[LORA_NODE].inputs.strength_clip = 1;
        console.log(`🎭 [LoRA] 加载风格: ${styleConfig.lora}, 强度: ${styleConfig.strength}`);
    } else {
        // 默认风格，跳过 LoRA 或设置强度为 0
        if (workflow[LORA_NODE]) {
            workflow[LORA_NODE].inputs.strength_model = 0;
            workflow[LORA_NODE].inputs.strength_clip = 0;
            console.log(`🎭 [LoRA] 使用默认风格，不加载 LoRA`);
        }
    }

    console.log(`🚀 [触发] 发送文生图任务... 种子: ${seed}`);

    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) throw new Error(`ComfyUI Error: ${response.statusText}`);
    const data = await response.json();
    return data.prompt_id;
}

// Flux 图生图触发函数 (Kontext)
async function triggerImg2Img(scenePrompt, ratio = "9:16", refImageName) {
    console.log(`🎨 [Flux Kontext] 开始图生图...`);
    const workflowPath = path.join(__dirname, 'flux_kontext_fp8.json');
    let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    // 节点 ID 配置 (根据 flux_kontext_fp8.json)
    const PROMPT_NODE = "6";         // CLIPTextEncode (Positive)
    const SEED_NODE = "25";          // RandomNoise
    const EMPTY_LATENT_NODE = "27";  // EmptySD3LatentImage (分辨率)
    const MODEL_SAMPLING_NODE = "30"; // ModelSamplingFlux (也包含宽高，需要同步修改)
    const LOAD_IMAGE_NODE = "41";    // LoadImage

    const ratioConfig = ASPECT_RATIOS[ratio] || ASPECT_RATIOS["9:16"];
    const seed = Math.floor(Math.random() * 1000000000000);

    console.log(`🔧 [配置] 提示词: ${scenePrompt.substring(0, 50)}...`);
    console.log(`📷 [参考图] ${refImageName} | 画幅: ${ratio}`);

    // 修改参数
    workflow[PROMPT_NODE].inputs.text = scenePrompt;
    workflow[SEED_NODE].inputs.noise_seed = seed;

    // 设置分辨率 (Kontext工作流中有两处需要设置宽高)
    workflow[EMPTY_LATENT_NODE].inputs.width = ratioConfig.width;
    workflow[EMPTY_LATENT_NODE].inputs.height = ratioConfig.height;
    if (workflow[MODEL_SAMPLING_NODE]) {
        workflow[MODEL_SAMPLING_NODE].inputs.width = ratioConfig.width;
        workflow[MODEL_SAMPLING_NODE].inputs.height = ratioConfig.height;
    }

    // 设置参考图
    workflow[LOAD_IMAGE_NODE].inputs.image = refImageName;

    console.log(`🚀 [触发] 发送Kontext任务... 种子: ${seed}`);

    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) throw new Error(`ComfyUI Error: ${response.statusText}`);
    const data = await response.json();
    return data.prompt_id;
}

async function triggerComfyUI(positivePrompt, cloudImageName, resolutionKey = "576p", durationKey = "3", promptSegments = null, ratio = "16:9") {
    let workflowPath;
    let workflow;

    // 根据时长选择不同的工作流文件
    if (durationKey === '20') {
        workflowPath = path.join(__dirname, '【Work-Fisher】【12.30】SVI 2.0超强长视频生成（完美一致性）-20秒版.json');
        workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

        // 20秒版本的关键节点ID映射（镜头1-5）
        const IMAGE_NODE = "16"; // 图片上传节点
        const TEXT_NODE_MAPPING = ["42", "43", "44", "40", "41"]; // 5个提示词分段节点
        const WIDTH_NODE = "23"; // 宽度节点
        const HEIGHT_NODE = "24"; // 高度节点

        // 设置分辨率
        const ratioConfig = RATIO_SETTING[ratio] || RATIO_SETTING["16:9"];
        if (workflow[WIDTH_NODE]) {
            workflow[WIDTH_NODE].inputs.value = ratioConfig.width;
            console.log(`✅ [20秒-宽度节点] 节点${WIDTH_NODE}: ${ratioConfig.width}px`);
        }
        if (workflow[HEIGHT_NODE]) {
            workflow[HEIGHT_NODE].inputs.value = ratioConfig.height;
            console.log(`✅ [20秒-高度节点] 节点${HEIGHT_NODE}: ${ratioConfig.height}px`);
        }
        console.log(`📐 [20秒-比例] ${ratio}: ${ratioConfig.description} (${ratioConfig.width}x${ratioConfig.height})`);

        // 替换图片
        if (workflow[IMAGE_NODE]) {
            workflow[IMAGE_NODE].inputs.image = cloudImageName;
            console.log(`✅ [20秒-图像节点] 图片: ${cloudImageName}`);
        }

        // 替换提示词（分段填充）
        if (promptSegments && Array.isArray(promptSegments)) {
            TEXT_NODE_MAPPING.forEach((nodeId, index) => {
                // 如果用户提供的提示词段数少于需要的节点数，循环使用最后一段
                const text = promptSegments[index] || promptSegments[promptSegments.length - 1];
                if (workflow[nodeId]) {
                    workflow[nodeId].inputs.prompt = text;
                    console.log(`✅ [20秒-镜头${index + 1}] 节点${nodeId}: ${text.substring(0, 30)}...`);
                }
            });
            console.log(`✅ [20秒-文本节点] 已分配 ${promptSegments.length} 段提示词到 ${TEXT_NODE_MAPPING.length} 个镜头节点`);
        } else {
            // 降级处理：单段提示词
            TEXT_NODE_MAPPING.forEach(nodeId => {
                if (workflow[nodeId]) {
                    workflow[nodeId].inputs.prompt = positivePrompt;
                }
            });
            console.log(`✅ [20秒-文本节点] 使用单段提示词，已分配到 ${TEXT_NODE_MAPPING.length} 个节点`);
        }

    } else if (durationKey === '10') {
        workflowPath = path.join(__dirname, '【Work-Fisher】【12.30】SVI 2.0超强长视频生成（完美一致性）-10秒版.json');
        workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

        // 10秒版本的关键节点ID映射（镜头1-3）
        const IMAGE_NODE = "17"; // 图片上传节点
        const TEXT_NODE_MAPPING = ["43", "44", "45"]; // 3个提示词分段节点
        const WIDTH_NODE = "24"; // 宽度节点
        const HEIGHT_NODE = "25"; // 高度节点

        // 设置分辨率
        const ratioConfig = RATIO_SETTING[ratio] || RATIO_SETTING["16:9"];
        if (workflow[WIDTH_NODE]) {
            workflow[WIDTH_NODE].inputs.value = ratioConfig.width;
            console.log(`✅ [10秒-宽度节点] 节点${WIDTH_NODE}: ${ratioConfig.width}px`);
        }
        if (workflow[HEIGHT_NODE]) {
            workflow[HEIGHT_NODE].inputs.value = ratioConfig.height;
            console.log(`✅ [10秒-高度节点] 节点${HEIGHT_NODE}: ${ratioConfig.height}px`);
        }
        console.log(`📐 [10秒-比例] ${ratio}: ${ratioConfig.description} (${ratioConfig.width}x${ratioConfig.height})`);

        // 替换图片
        if (workflow[IMAGE_NODE]) {
            workflow[IMAGE_NODE].inputs.image = cloudImageName;
            console.log(`✅ [10秒-图像节点] 图片: ${cloudImageName}`);
        }

        // 替换提示词（分段填充）
        if (promptSegments && Array.isArray(promptSegments)) {
            TEXT_NODE_MAPPING.forEach((nodeId, index) => {
                const text = promptSegments[index] || promptSegments[promptSegments.length - 1];
                if (workflow[nodeId]) {
                    workflow[nodeId].inputs.prompt = text;
                    console.log(`✅ [10秒-镜头${index + 1}] 节点${nodeId}: ${text.substring(0, 30)}...`);
                }
            });
            console.log(`✅ [10秒-文本节点] 已分配 ${promptSegments.length} 段提示词到 ${TEXT_NODE_MAPPING.length} 个镜头节点`);
        } else {
            // 降级处理：单段提示词
            TEXT_NODE_MAPPING.forEach(nodeId => {
                if (workflow[nodeId]) {
                    workflow[nodeId].inputs.prompt = positivePrompt;
                }
            });
            console.log(`✅ [10秒-文本节点] 使用单段提示词，已分配到 ${TEXT_NODE_MAPPING.length} 个节点`);
        }

    } else {
        // 原有的 5秒 逻辑
        workflowPath = path.join(__dirname, 'Image-to-Video.json');
        workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

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
            console.log(`✅ [Painter节点] 设置: ${resConfig.width}x${resConfig.height}, ${targetFrames}帧`);
        }
        if (workflow[RESIZE_NODE]) {
            workflow[RESIZE_NODE].inputs.width = resConfig.width;
            workflow[RESIZE_NODE].inputs.height = resConfig.height;
            // 移除 device: "cpu"，使用默认设备
            if (workflow[RESIZE_NODE].inputs.device) {
                delete workflow[RESIZE_NODE].inputs.device;
            }
            console.log(`✅ [Resize节点] 设置: ${resConfig.width}x${resConfig.height}`);
        }
        if (workflow[TEXT_NODE]) {
            workflow[TEXT_NODE].inputs.text = positivePrompt;
            console.log(`✅ [文本节点] Prompt长度: ${positivePrompt.length}字符`);
        }
        if (workflow[IMAGE_NODE]) {
            workflow[IMAGE_NODE].inputs.image = cloudImageName;
            console.log(`✅ [图像节点] 图片: ${cloudImageName}`);
        }

        // 随机种子
        const randomSeed = Math.floor(Math.random() * 1000000000000);
        SAMPLER_IDS.forEach(id => {
            if (workflow[id]) workflow[id].inputs.noise_seed = randomSeed;
        });
    }

    console.log(`🚀 [触发] 发送任务... 工作流: ${workflowPath}`);

    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) {
        // 获取详细错误信息
        const errorText = await response.text();
        console.error('❌ [ComfyUI错误] 响应:', errorText);
        throw new Error(`ComfyUI Error: ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    return data.prompt_id;
}

// ========================================
// DaSiWa 8.1 双路径系统触发函数
// ========================================
async function triggerComfyUINew(startImageName, endImageName, prompt, ratio = "16:9", durationKey = "3") {
    // 使用完整的 DaSiWa 8.1 工作流文件（双路径系统）
    const workflowPath = path.join(__dirname, 'DaSiWa_81_API.json');
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    const isDualImageMode = startImageName !== endImageName;
    const modeName = isDualImageMode ? '首尾帧（双图）' : '纯单图';
    console.log(`🎬 [双路径系统] 模式: ${modeName}`);
    console.log(`🎬 [工作流] DaSiWa 8.1 (完整版)`);

    // ========================================
    // 通用配置：比例和帧数
    // ========================================
    const ratioConfig = RATIO_SETTING[ratio] || RATIO_SETTING["16:9"];
    const targetFrames = DURATION_MAP[durationKey] || 49;
    console.log(`📐 [比例] ${ratio}: ${ratioConfig.description} (${ratioConfig.width}x${ratioConfig.height})`);
    console.log(`⏱️ [时长] ${targetFrames}帧 (${durationKey}s)`);

    if (isDualImageMode) {
        // ========================================
        // 路径A：首尾帧模式（双图）
        // ========================================
        console.log(`🚀 [路径A] 首尾帧模式 - 使用节点 139 (WanFirstLastFrameToVideo)`);

        // 设置提示词（节点136）
        if (workflow[DASIWAN_NODES.DUAL_POSITIVE_PROMPT]) {
            workflow[DASIWAN_NODES.DUAL_POSITIVE_PROMPT].inputs.text = prompt;
            console.log(`✅ [提示词] 节点${DASIWAN_NODES.DUAL_POSITIVE_PROMPT}: ${prompt.substring(0, 50)}...`);
        }

        // 设置画质缩放（节点300）
        if (workflow[DASIWAN_NODES.DUAL_RESOLUTION_VALUE]) {
            workflow[DASIWAN_NODES.DUAL_RESOLUTION_VALUE].inputs.value = ratioConfig.longest;
            console.log(`✅ [画质缩放] 节点${DASIWAN_NODES.DUAL_RESOLUTION_VALUE}: ${ratioConfig.longest}px (长边)`);
        }

        // 设置视频时长（节点301）
        if (workflow[DASIWAN_NODES.DUAL_DURATION_VALUE]) {
            workflow[DASIWAN_NODES.DUAL_DURATION_VALUE].inputs.value = targetFrames;
            console.log(`✅ [视频时长] 节点${DASIWAN_NODES.DUAL_DURATION_VALUE}: ${targetFrames}帧`);
        }

        // 设置起始图（节点211）
        if (workflow[DASIWAN_NODES.DUAL_START_IMAGE]) {
            workflow[DASIWAN_NODES.DUAL_START_IMAGE].inputs.image = startImageName;
            console.log(`✅ [起始图] 节点${DASIWAN_NODES.DUAL_START_IMAGE}: ${startImageName}`);
        }

        // 设置结束图（节点209）
        if (workflow[DASIWAN_NODES.DUAL_END_IMAGE]) {
            workflow[DASIWAN_NODES.DUAL_END_IMAGE].inputs.image = endImageName;
            console.log(`✅ [结束图] 节点${DASIWAN_NODES.DUAL_END_IMAGE}: ${endImageName}`);
        }

        // 视频生成节点（139）- 连接已自动完成
        console.log(`✅ [视频生成] 节点${DASIWAN_NODES.DUAL_VIDEO_GEN}: 首尾帧计算，${targetFrames}帧`);

        // 🔧 禁用单图路径的节点（mode: 4 = Never）
        if (workflow[DASIWAN_NODES.SINGLE_VIDEO_GEN]) {
            workflow[DASIWAN_NODES.SINGLE_VIDEO_GEN].mode = 4;
            console.log(`🔧 [禁用] 节点${DASIWAN_NODES.SINGLE_VIDEO_GEN} (PainterI2V)`);
        }
        if (workflow[DASIWAN_NODES.SINGLE_FINAL_OUTPUT]) {
            workflow[DASIWAN_NODES.SINGLE_FINAL_OUTPUT].mode = 4;
            console.log(`🔧 [禁用] 节点${DASIWAN_NODES.SINGLE_FINAL_OUTPUT} (单图输出)`);
        }

    } else {
        // ========================================
        // 路径B：纯单图模式（PainterI2V - 无首尾锁定）
        // ========================================
        console.log(`🚀 [路径B] 纯单图模式 - 使用节点 293 (PainterI2V)`);
        console.log(`🎯 [关键] PainterI2V 专为单图设计，无"首尾锁定"，AI可自由生成动作！`);

        // 设置提示词（节点287）
        if (workflow[DASIWAN_NODES.SINGLE_POSITIVE_PROMPT]) {
            workflow[DASIWAN_NODES.SINGLE_POSITIVE_PROMPT].inputs.text = prompt;
            console.log(`✅ [提示词] 节点${DASIWAN_NODES.SINGLE_POSITIVE_PROMPT}: ${prompt.substring(0, 50)}...`);
        }

        // 设置画质缩放（节点298）
        if (workflow[DASIWAN_NODES.SINGLE_RESOLUTION_VALUE]) {
            workflow[DASIWAN_NODES.SINGLE_RESOLUTION_VALUE].inputs.value = ratioConfig.longest;
            console.log(`✅ [画质缩放] 节点${DASIWAN_NODES.SINGLE_RESOLUTION_VALUE}: ${ratioConfig.longest}px (长边)`);
        }

        // 设置视频时长（节点299）
        if (workflow[DASIWAN_NODES.SINGLE_DURATION_VALUE]) {
            workflow[DASIWAN_NODES.SINGLE_DURATION_VALUE].inputs.value = targetFrames;
            console.log(`✅ [视频时长] 节点${DASIWAN_NODES.SINGLE_DURATION_VALUE}: ${targetFrames}帧`);
        }

        // 设置起始图（节点297）
        if (workflow[DASIWAN_NODES.SINGLE_START_IMAGE]) {
            workflow[DASIWAN_NODES.SINGLE_START_IMAGE].inputs.image = startImageName;
            console.log(`✅ [起始图] 节点${DASIWAN_NODES.SINGLE_START_IMAGE}: ${startImageName}`);
        }

        // 视频生成节点（293）- 自动运行
        console.log(`✅ [视频生成] 节点${DASIWAN_NODES.SINGLE_VIDEO_GEN}: PainterI2V 自由生成，${targetFrames}帧`);

        // 🔧 禁用双图路径的节点（mode: 4 = Never）
        if (workflow[DASIWAN_NODES.DUAL_VIDEO_GEN]) {
            workflow[DASIWAN_NODES.DUAL_VIDEO_GEN].mode = 4;
            console.log(`🔧 [禁用] 节点${DASIWAN_NODES.DUAL_VIDEO_GEN} (WanFirstLastFrameToVideo)`);
        }
        if (workflow[DASIWAN_NODES.DUAL_FINAL_OUTPUT]) {
            workflow[DASIWAN_NODES.DUAL_FINAL_OUTPUT].mode = 4;
            console.log(`🔧 [禁用] 节点${DASIWAN_NODES.DUAL_FINAL_OUTPUT} (双图输出)`);
        }
    }

    // 随机种子（采样器节点115）
    const randomSeed = Math.floor(Math.random() * 1000000000000);
    if (workflow["115"]) {
        workflow["115"].inputs.noise_seed = randomSeed;
    }

    console.log(`🚀 [触发] 发送任务... 模式: ${isDualImageMode ? 'DUAL' : 'SINGLE'}`);

    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ComfyUI错误] 响应:', errorText);
        throw new Error(`ComfyUI Error: ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    
    // 返回模式和 prompt_id
    return {
        prompt_id: data.prompt_id,
        mode: isDualImageMode ? 'DUAL' : 'SINGLE',
        targetOutputNode: isDualImageMode ? DASIWAN_NODES.DUAL_FINAL_OUTPUT : DASIWAN_NODES.SINGLE_FINAL_OUTPUT
    };
}

// --- 4. TTS API 路由 ---

// Minimax TTS 音色映射配置
const MINIMAX_VOICE_MAPPING = {
    // 自定义音色映射
    'zhang-miss': 'Arrogant_Miss',    // 嚣张小姐
    'bujiji-qingnian': 'Chinese (Mandarin)_Unrestrained_Young_Man',    // 不羁青年
    'aojiao-yujie': 'Chinese (Mandarin)_Mature_Woman',    // 傲娇御姐
    'shulang-nan': 'hunyin_6',    // 舒朗男声
    'rexin-dashen': 'Chinese (Mandarin)_Kind-hearted_Antie',    // 热心大婶
    'gaoxiao-daye': 'Chinese (Mandarin)_Humorous_Elder',    // 搞笑大爷
    'wenrun-nan': 'Chinese (Mandarin)_Gentleman',    // 温润男声
    'wennuan-guimi': 'Chinese (Mandarin)_Warm_Bestie',    // 温暖闺蜜
    'xinwen-nv': 'Chinese (Mandarin)_News_Anchor',    // 新闻女声
    'chenwen-gaoguan': 'Chinese (Mandarin)_Reliable_Executive',    // 沉稳高管
    'tianmei-nv': 'Chinese (Mandarin)_Sweet_Lady',    // 甜美女声
    'nanfang-xiaoge': 'Chinese (Mandarin)_Southern_Young_Man',    // 南方小哥
    'wenrun-qingnian': 'Chinese (Mandarin)_Gentle_Youth',    // 温润青年
    'yueli-jiejie': 'Chinese (Mandarin)_Wise_Women',    // 阅历姐姐
    'wenrou-shaonv': 'Chinese (Mandarin)_Warm_Girl',    // 温柔少女
    'huajia-nainai': 'Chinese (Mandarin)_Kind-hearted_Elder',    // 花甲奶奶
    'hanhan-mengshou': 'Chinese (Mandarin)_Cute_Spirit',    // 憨憨萌兽
    'diantai-nanzhubo': 'Chinese (Mandarin)_Radio_Host',    // 电台男主播
    'shuqing-nan': 'Chinese (Mandarin)_Lyrical_Voice',    // 抒情男声
    'lvzhen-didi': 'Chinese (Mandarin)_Straightforward_Boy',    // 率真弟弟
    'zhencheng-qingnian': 'Chinese (Mandarin)_Sincere_Adult',    // 真诚青年
    'wenrou-xuejie': 'Chinese (Mandarin)_Gentle_Senior',    // 温柔学姐
    'zuiying-zhuma': 'Chinese (Mandarin)_Stubborn_Friend',    // 嘴硬竹马
    'qingcui-shaonv': 'Chinese (Mandarin)_Crisp_Girl',    // 清脆少女
    'qingche-didi': 'Chinese (Mandarin)_Pure-hearted_Boy',    // 清澈邻家弟弟
    'nanfang-ruanruan': 'Chinese (Mandarin)_Soft_Girl',    // 南方软软女孩
};

// 调用Minimax TTS API（根据文档API规范重构）
async function callMinimaxTTS(text, voiceId, language, speed, volume, outputFormat) {
    console.log(`🎤 [Minimax TTS] 调用API生成语音...`);
    
    // 映射音色ID
    const minimaxVoiceId = MINIMAX_VOICE_MAPPING[voiceId] || voiceId;
    
    console.log(`🔊 [音色映射] 原始ID: ${voiceId} -> Minimax ID: ${minimaxVoiceId}`);
    
    // 如果音色ID看起来不像是标准的Minimax格式，给出警告
    if (!minimaxVoiceId.includes('moss_audio') && !minimaxVoiceId.includes('Chinese') && !minimaxVoiceId.includes('English') && !minimaxVoiceId.includes('Japanese')) {
        console.log(`⚠️ [音色警告] 音色ID "${minimaxVoiceId}" 可能不是有效的Minimax格式`);
        console.log(`📋 [可用音色] 请访问 http://localhost:3000/api/tts/voices 获取最新音色列表`);
    }
    
    // 根据文档构建请求数据结构（优化免费额度使用）
    const requestData = {
        model: process.env.MINIMAX_TTS_MODEL || 'speech-2.6-turbo',
        text: text,
        stream: false, // 非流式输出
        voice_setting: {
            voice_id: minimaxVoiceId,
            speed: speed,           // 语速范围: [0.5, 2]
            vol: volume / 100,      // 音量范围: (0, 10]，需要转换百分比到小数
            pitch: 0,               // 语调范围: [-12, 12]，默认0
            emotion: "happy"        // 情绪，可选：happy, sad, angry, fearful, disgusted, surprised, calm, fluent, whisper
        },
        audio_setting: {
            sample_rate: 16000,    // 降低采样率以节省额度（从32k降到16k）
            bitrate: 64000,         // 降低比特率以节省额度（从128k降到64k）
            format: outputFormat,   // 格式: mp3, wav, flac
            channel: 1             // 声道数: 1=单声道, 2=双声道
        },
        output_format: "hex",      // 输出格式: hex 或 url，hex返回音频数据
        subtitle_enable: false,    // 是否启用字幕
        aigc_watermark: false      // 是否添加水印
    };

    console.log(`📤 [Minimax] 请求数据:`, JSON.stringify(requestData, null, 2));

    // API 端点列表（按优先级排序）
    const apiEndpoints = [
        process.env.MINIMAX_TTS_URL || 'https://api.minimax.chat/v1/t2a_v2',
        'https://api-bj.minimaxi.com/v1/t2a_v2',  // 北京备用节点
        'https://api.minimaxi.com/v1/t2a_v2'      // 主节点
    ];

    // 尝试不同的端点
    for (let i = 0; i < apiEndpoints.length; i++) {
        const apiUrl = apiEndpoints[i];
        try {
            console.log(`🔄 [尝试端点 ${i + 1}] ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.log(`❌ [端点 ${i + 1} 失败] ${response.status}: ${errorData}`);
                if (i === apiEndpoints.length - 1) {  // 最后一个端点也失败了
                    throw new Error(`所有端点都失败，最后错误: ${response.status}: ${errorData}`);
                }
                continue;  // 尝试下一个端点
            }

            const data = await response.json();
            
            // 检查API响应状态
            if (data.base_resp && data.base_resp.status_code !== 0) {
                console.log(`❌ [端点 ${i + 1} API错误] ${data.base_resp.status_msg}`);
                if (i === apiEndpoints.length - 1) {  // 最后一个端点也失败了
                    throw new Error(`所有端点都返回错误，最后错误: ${data.base_resp.status_msg}`);
                }
                continue;  // 尝试下一个端点
            }
            
            console.log(`✅ [端点 ${i + 1} 成功] ${apiUrl}`);
            return data;
            
        } catch (error) {
            console.log(`❌ [端点 ${i + 1} 异常] ${error.message}`);
            if (i === apiEndpoints.length - 1) {  // 最后一个端点也失败了
                throw new Error(`所有端点都异常，最后错误: ${error.message}`);
            }
            continue;  // 尝试下一个端点
        }
    }
}

// 处理hex编码的音频数据并保存到本地
async function saveHexAudioToLocal(hexAudio, taskId, outputFormat) {
    console.log(`📥 [音频处理] 正在处理hex音频数据...`);
    
    try {
        // 确保保存目录存在
        const saveDir = path.join(__dirname, 'public', 'audio');
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        const localFilename = `${taskId}.${outputFormat}`;
        const localFilePath = path.join(saveDir, localFilename);

        // 将hex字符串转换为Buffer
        const audioBuffer = Buffer.from(hexAudio, 'hex');
        
        // 写入文件
        fs.writeFileSync(localFilePath, audioBuffer);
        
        console.log('💾 [音频保存] 文件已保存:', localFilePath, '(大小:', audioBuffer.length + ' bytes)');
        
        // 返回本地访问URL
        return `http://localhost:${process.env.PORT || 3000}/audio/${localFilename}`;
    } catch (error) {
        console.error(`❌ [音频保存] ${error.message}`);
        throw error;
    }
}

app.post('/api/tts/generate', async (req, res) => {
    try {
        const { text, voiceType, language, speed, volume, outputFormat } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ success: false, error: '请输入要转换的文本' });
        }

        console.log(`🎤 [TTS] 生成语音: ${text.substring(0, 30)}... | 音色: ${voiceType} | 语言: ${language}`);

        // 检查API配置
        if (!process.env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY === 'your_minimax_api_key_here') {
            return res.status(500).json({ 
                success: false, 
                error: '请配置Minimax API密钥 (.env文件中的MINIMAX_API_KEY)' 
            });
        }

        const taskId = Date.now();

        try {
            console.log('🔄 [TTS] 开始调用Minimax API...');
            // 调用Minimax TTS API
            const ttsResult = await callMinimaxTTS(text, voiceType, language, speed, volume, outputFormat);
            
            console.log('🔍 [TTS] API响应:', JSON.stringify(ttsResult, null, 2));
            
            // 检查响应数据
            if (!ttsResult.data || !ttsResult.data.audio) {
                console.error('❌ [TTS] API返回的音频数据为空:', ttsResult);
                throw new Error('API返回的音频数据为空');
            }
            
            console.log('💾 [TTS] 开始保存音频数据...');
            // 处理hex音频数据并保存到本地
            const localAudioUrl = await saveHexAudioToLocal(
                ttsResult.data.audio, 
                taskId, 
                outputFormat
            );
            
            // 从API响应中获取准确的音频信息
            const duration = Math.round(ttsResult.extra_info?.audio_length / 1000) || 0; // 毫秒转秒
            const fileSize = ttsResult.extra_info?.audio_size || 0; // 字节
            const audioFormat = ttsResult.extra_info?.audio_format || outputFormat;

            console.log('✅ [TTS] 语音生成完成: 任务ID', taskId, ', 时长:', duration + 's, 格式:', audioFormat);

            res.json({
                success: true,
                audioUrl: localAudioUrl,
                taskId,
                duration,
                fileSize,
                format: audioFormat,
                sampleRate: ttsResult.extra_info?.audio_sample_rate,
                message: '语音生成成功'
            });

        } catch (minimaxError) {
            console.error('❌ [Minimax] TTS生成失败:', minimaxError.message);
            console.error('❌ [Minimax] 完整错误信息:', minimaxError);
            
            // 如果Minimax API调用失败，返回具体错误信息
            res.status(500).json({ 
                success: false, 
                error: `TTS生成失败: ${minimaxError.message}` 
            });
        }

    } catch (error) {
        console.error('❌ TTS生成失败:', error);
        res.status(500).json({ success: false, error: '服务器内部错误' });
    }
});

// 查询 Minimax 可用音色列表
app.get('/api/tts/voices', async (req, res) => {
    try {
        if (!process.env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY === 'your_minimax_api_key_here') {
            return res.status(400).json({ 
                success: false, 
                error: '请先配置 Minimax API 密钥' 
            });
        }

        console.log(`🎤 [音色查询] 正在获取可用音色列表...`);

        // 尝试调用音色查询API
        const voiceEndpoints = [
            'https://api.minimax.chat/v1/t2a_v2/voice_list',
            'https://api.minimax.chat/v1/voice/list',
            'https://api-bj.minimaxi.com/v1/t2a_v2/voice_list',
            'https://api-bj.minimaxi.com/v1/voice/list'
        ];

        for (const endpoint of voiceEndpoints) {
            try {
                console.log(`🔄 [尝试音色端点] ${endpoint}`);
                
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ [音色查询成功] 端点: ${endpoint}`);
                    
                    return res.json({
                        success: true,
                        voices: data,
                        endpoint: endpoint,
                        totalVoices: Array.isArray(data) ? data.length : Object.keys(data).length,
                        message: '音色列表查询成功'
                    });
                } else {
                    const errorData = await response.text();
                    console.log(`❌ [音色端点失败] ${endpoint}: ${response.status} - ${errorData}`);
                }
            } catch (err) {
                console.log(`❌ [音色端点异常] ${endpoint}: ${err.message}`);
                continue;
            }
        }

        // 如果所有端点都失败，返回经过验证的音色列表
        console.log(`⚠️ [音色查询] 使用经过验证的音色列表`);
        res.json({
            success: true,
            voices: {
                chinese: [
                    // 已验证的女声（优先使用）
                    { id: 'Chinese (Mandarin)_Lyrical_Voice', name: '抒情女声 ✅', gender: '女', verified: true },
                    { id: 'English_Graceful_Lady', name: '优雅女士 ✅', gender: '女', verified: true },
                    
                    // 可能有问题的女声（需要用户验证）
                    { id: 'moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85', name: '少女音 ⚠️（可能是男声）', gender: '女', verified: false },
                    { id: 'moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d', name: '温柔女声 ⚠️（未验证）', gender: '女', verified: false },
                    
                    // 男声
                    { id: 'Chinese (Mandarin)_HK_Flight_Attendant', name: '港式空少音 ✅', gender: '男', verified: true },
                    { id: 'male-qn-qingse', name: '青春男声 ✅', gender: '男', verified: true },
                    { id: 'moss_audio_6dc281eb-713c-11f0-a447-9613c873494c', name: '成熟男声 ⚠️（未验证）', gender: '男', verified: false },
                    { id: 'moss_audio_570551b1-735c-11f0-b236-0adeeecad052', name: '活力男声 ⚠️（未验证）', gender: '男', verified: false }
                ],
                english: [
                    { id: 'English_Graceful_Lady', name: '优雅女士 ✅', gender: '女', verified: true },
                    { id: 'English_Persuasive_Man', name: '英文男声 ✅', gender: '男', verified: true },
                    { id: 'English_radiant_girl', name: '英文女声 ⚠️（未验证）', gender: '女', verified: false }
                ],
                japanese: [
                    { id: 'Japanese_Whisper_Belle', name: '日文女声 ⚠️（未验证）', gender: '女', verified: false }
                ]
            },
            endpoint: 'predefined',
            note: '✅ 表示已验证可用的音色，⚠️ 表示需要用户自行验证。建议优先使用标记为 ✅ 的音色',
            message: '使用经过验证的音色列表',
            recommendations: {
                female: [
                    { id: 'Chinese (Mandarin)_Lyrical_Voice', reason: '标准中文女声，音色清晰' },
                    { id: 'English_Graceful_Lady', reason: '优雅女士音质，适合正式场合' }
                ],
                male: [
                    { id: 'Chinese (Mandarin)_HK_Flight_Attendant', reason: '港式空少音，音色标准' },
                    { id: 'English_Persuasive_Man', reason: '标准英文男声' }
                ]
            }
        });

    } catch (error) {
        console.error('音色查询失败:', error);
        res.status(500).json({ 
            success: false, 
            error: '音色查询失败: ' + error.message 
        });
    }
});

// 检查 Minimax 账户余额
app.get('/api/tts/balance', async (req, res) => {
    try {
        if (!process.env.MINIMAX_API_KEY || process.env.MINIMAX_API_KEY === 'your_minimax_api_key_here') {
            return res.status(400).json({ 
                success: false, 
                error: '请先配置 Minimax API 密钥' 
            });
        }

        // 尝试调用余额查询API
        const balanceEndpoints = [
            'https://api.minimax.chat/v1/query/balance',
            'https://api-bj.minimaxi.com/v1/query/balance'
        ];

        for (const endpoint of balanceEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    return res.json({
                        success: true,
                        balance: data,
                        endpoint: endpoint,
                        message: '余额查询成功'
                    });
                }
            } catch (err) {
                console.log(`余额查询端点 ${endpoint} 失败:`, err.message);
                continue;
            }
        }

        // 如果所有端点都失败，返回提示
        res.json({
            success: false,
            error: '无法查询余额，请检查网络连接或API密钥',
            suggestion: '请登录 Minimax 控制台查看余额: https://www.minimax.chat'
        });

    } catch (error) {
        console.error('余额查询失败:', error);
        res.status(500).json({ 
            success: false, 
            error: '余额查询失败: ' + error.message 
        });
    }
});

// 测试指定音色是否可用
app.post('/api/tts/test-voice', async (req, res) => {
    try {
        const { voiceId, text = "这是语音测试，请检查音色是否可用" } = req.body;

        if (!voiceId) {
            return res.status(400).json({ 
                success: false, 
                error: '请提供音色ID' 
            });
        }

        console.log(`🧪 [音色测试] 测试音色: ${voiceId}`);

        try {
            // 使用最小配置测试音色
            const testResult = await callMinimaxTTS(text, voiceId, 'zh-CN', 1.0, 80, 'mp3');
            
            res.json({
                success: true,
                voiceId: voiceId,
                message: '音色可用',
                testResult: {
                    hasAudio: !!testResult.data?.audio,
                    audioLength: testResult.data?.audio?.length || 0
                }
            });

        } catch (error) {
            res.json({
                success: false,
                voiceId: voiceId,
                error: error.message,
                message: '音色不可用或调用失败'
            });
        }

    } catch (error) {
        console.error('音色测试失败:', error);
        res.status(500).json({ 
            success: false, 
            error: '音色测试失败: ' + error.message 
        });
    }
});

// 提供生成的音频文件
app.get('/api/tts/audio/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public', 'audio', filename);
    
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // 如果音频文件不存在，返回演示音频
        if (filename.includes('demo-audio')) {
            res.status(200).json({ 
                message: '演示音频文件 - 需要充值Minimax账户余额',
                balanceRequired: true 
            });
        } else {
            res.status(404).json({ error: '音频文件不存在' });
        }
    }
});

// --- 5. API 路由 ---

// 用户相关接口
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: '请填写完整信息' });
        }

        // 检查用户是否已存在
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: existingUser.email === email ? '邮箱已注册' : '用户名已存在' 
            });
        }

        // 加密密码
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        // 生成JWT token
        const jwt = await import('jsonwebtoken');
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });

        res.status(201).json({
            success: true,
            message: '注册成功',
            user,
            token
        });

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: '请填写完整信息' });
        }

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 验证密码
        const bcrypt = await import('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: '邮箱或密码错误'
            });
        }

        // 生成JWT token
        const jwt = await import('jsonwebtoken');
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: '登录成功',
            user: userWithoutPassword,
            token
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
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

// Flux 文生图接口 (集成提示词优化)
app.post('/api/generate/txt2img', async (req, res) => {
    try {
        const { prompt, ratio, style } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "请提供提示词" });
        }

        console.log(`\n🆕 [文生图] 收到任务: ${prompt}`);

        // 创建任务记录
        const task = await prisma.videoTask.create({
            data: {
                userPrompt: prompt,
                type: 'TXT2IMG',
                status: 'PENDING',
                style: style || 'default'
            }
        });

        res.json({ success: true, taskId: task.id });

        // 异步执行任务
        (async () => {
            try {
                // 1. 优化提示词
                const styleConfig = STYLE_MAP[style || 'default'];
                const optimizedPrompt = await optimizePrompt(prompt, styleConfig.prompt_suffix);

                // 保存翻译后的提示词
                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { translatedPrompt: optimizedPrompt }
                });

                // 2. 触发 ComfyUI
                const promptId = await triggerTxt2Img(optimizedPrompt, ratio || '9:16', style || 'default');

                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { status: 'PROCESSING', promptId: promptId }
                });
            } catch (err) {
                console.error(`❌ [文生图] 失败:`, err);
                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { status: 'FAILED' }
                });
            }
        })();
    } catch (error) {
        console.error('文生图任务创建失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// Flux 图生图接口 (Kontext + 分镜助手 + 豆包支持)
// 支持两种模式：ComfyUI (默认) 和 豆包 (即梦)
// 豆包模式支持单图或多图模式
app.post('/api/generate/img2img', upload.fields([
    { name: 'imageBody', maxCount: 1 },
    { name: 'images', maxCount: 10 }, // 支持多图上传（豆包专用）
    { name: 'imageFace', maxCount: 1 }
]), async (req, res) => {
    try {
        const { prompt, ratio, model = 'comfyui', multiImageMode = 'false' } = req.body; // 默认使用ComfyUI
        const refImage = req.files?.imageBody?.[0]; // 单图参考图（ComfyUI用）
        const multiImages = req.files?.images || []; // 多图数组（豆包多图模式用）

        console.log('📋 [调试] req.files:', Object.keys(req.files || {}));
        console.log('📋 [调试] multiImages.length:', multiImages.length);
        console.log('📋 [调试] multiImageMode:', multiImageMode, typeof multiImageMode);
        console.log('📋 [调试] refImage:', refImage ? '存在' : '不存在');

        if (!refImage && multiImages.length === 0) {
            return res.status(400).json({ error: "请至少上传一张参考图" });
        }

        if (!prompt) {
            return res.status(400).json({ error: "请提供分镜描述或动作指令" });
        }

        console.log(`\n🆕 [${model.toUpperCase()} 图生图] 收到任务: ${prompt} | 模型: ${model} | 多图模式: ${multiImageMode}`);

        const task = await prisma.videoTask.create({
            data: {
                userPrompt: prompt,
                type: 'IMG2IMG',
                status: 'PENDING',
                refImageBody: refImage?.path // 记录参考图路径（多图模式可能为空）
            }
        });

        res.json({ success: true, taskId: task.id });

        // 异步执行任务
        (async () => {
            try {
                if (model === 'doubao') {
                    // === 豆包模式 ===
                    console.log('🥤 [豆包模式] 调用豆包API...');

                    let imageUrl;

                    if (multiImageMode === 'true' && multiImages.length > 0) {
                        // 多图模式：上传所有图片到云端
                        console.log(`📸 [多图模式] 上传 ${multiImages.length} 张图片...`);
                        const uploadPromises = multiImages.map(img => uploadImageToCloud(img.path));
                        imageUrl = await Promise.all(uploadPromises);
                        console.log(`✅ [多图模式] 所有图片已上传`);
                    } else {
                        // 单图模式：上传单张图片
                        imageUrl = await uploadImageToCloud(refImage.path);
                    }

                    // 2. 调用豆包API
                    const result = await callDoubaoImg2Img(prompt, imageUrl, ratio || '1:1');

                    // 3. 豆包返回的是URL，需要下载到本地
                    console.log(`📦 [解析] result结构:`, Object.keys(result));
                    if (result.data) {
                        console.log(`📦 [解析] result.data类型:`, typeof result.data);
                        if (Array.isArray(result.data)) {
                            console.log(`📦 [解析] result.data是数组，长度:`, result.data.length);
                        }
                    }

                    imageUrl = null;

                    // 尝试多种数据格式
                    if (result.data && result.data.url) {
                        // 格式1: { data: { url: "..." } }
                        imageUrl = result.data.url;
                        console.log(`✓ 使用格式1: data.url`);
                    } else if (result.data && Array.isArray(result.data) && result.data[0] && result.data[0].url) {
                        // 格式2: { data: [{ url: "..." }] }
                        imageUrl = result.data[0].url;
                        console.log(`✓ 使用格式2: data[0].url`);
                    } else if (result.url) {
                        // 格式3: { url: "..." }
                        imageUrl = result.url;
                        console.log(`✓ 使用格式3: url`);
                    }

                    if (imageUrl) {
                        const localUrl = await downloadFileToLocal(imageUrl, `doubao_${Date.now()}.png`, 'output');
                        console.log(`✅ [豆包] 图片已保存: ${localUrl}`);

                        await prisma.videoTask.update({
                            where: { id: task.id },
                            data: {
                                status: 'COMPLETED',
                                resultUrl: localUrl,
                                videoUrl: localUrl,
                                translatedPrompt: prompt
                            }
                        });
                    } else {
                        console.error(`❌ [解析失败] 无法从返回数据中提取图片URL`);
                        console.error(`完整数据:`, JSON.stringify(result, null, 2));
                        throw new Error('豆包API返回的数据格式不正确');
                    }

                } else {
                    // === ComfyUI模式（原有逻辑） ===
                    console.log('🎨 [ComfyUI模式] 调用ComfyUI API...');

                    // 1. 上传参考图
                    const cloudName = await uploadImageToComfy(refImage.path, refImage.originalname);

                    // 2. 视觉分析 (提取参考图特征)
                    const refFeatures = await analyzeImageFeatures(refImage.path);

                    // 3. 生成分镜提示词 (结合用户指令 + 参考图特征)
                    const scenePrompt = await generateScenePrompt(prompt, refFeatures);

                    await prisma.videoTask.update({
                        where: { id: task.id },
                        data: { translatedPrompt: scenePrompt }
                    });

                    // 4. 触发 Kontext 工作流
                    const promptId = await triggerImg2Img(scenePrompt, ratio || '9:16', cloudName);

                    await prisma.videoTask.update({
                        where: { id: task.id },
                        data: { status: 'PROCESSING', promptId: promptId }
                    });
                }

                // 清理
                if (refImage?.path && fs.existsSync(refImage.path)) fs.unlinkSync(refImage.path);
                if (req.files?.imageFace?.[0]?.path && fs.existsSync(req.files.imageFace[0].path)) {
                    fs.unlinkSync(req.files.imageFace[0].path);
                }

            } catch (err) {
                console.error(`❌ [${model.toUpperCase()}] 失败:`, err);
                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { status: 'FAILED' }
                });
                // 清理临时文件
                if (refImage?.path && fs.existsSync(refImage.path)) fs.unlinkSync(refImage.path);
                if (multiImages && multiImages.length > 0) {
                    multiImages.forEach(img => {
                        if (fs.existsSync(img.path)) fs.unlinkSync(img.path);
                    });
                }
                if (req.files?.imageFace?.[0]?.path && fs.existsSync(req.files.imageFace[0].path)) {
                    fs.unlinkSync(req.files.imageFace[0].path);
                }
            }
        })();
    } catch (error) {
        console.error('图生图任务创建失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 生成任务接口 (原有的图生视频)
app.post('/api/generate', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'imageEnd', maxCount: 1 }
]), async (req, res) => {
    try {
        // 调试信息
        console.log('📋 Request body:', req.body);
        console.log('📁 Uploaded files:', req.files);
        
        // 从 body 获取参数
        const { prompt, ratio, duration, promptSegments } = req.body;
        const imageFile = req.files?.image?.[0];  // 起始图（必需）
        const imageEndFile = req.files?.imageEnd?.[0];  // 结束图（可选，用于首尾帧模式）

        if (!imageFile) return res.status(400).json({ error: "请上传起始图片" });

        const isDualImageMode = !!imageEndFile;  // 是否为双图模式
        console.log(`\n🆕 收到新任务: ${prompt}, 比例: ${ratio}, 时长: ${duration}s, 模式: ${isDualImageMode ? '首尾帧（双图）' : '单图'}`);

        const task = await prisma.videoTask.create({
            data: { userPrompt: prompt || "动态视频", style: 'anime', status: 'PENDING' }
        });

        res.json({ success: true, taskId: task.id });

        // 异步执行任务
        (async () => {
            try {
                // A. 上传图片到 ComfyUI
                const startImageName = await uploadImageToComfy(imageFile.path, imageFile.originalname);
                let endImageName = startImageName;  // 单图模式下，结束图使用同一起始图

                // B. 如果是双图模式，上传结束图
                if (isDualImageMode) {
                    endImageName = await uploadImageToComfy(imageEndFile.path, imageEndFile.originalname);
                    console.log(`📸 [双图模式] 已上传起始图: ${startImageName}`);
                    console.log(`📸 [双图模式] 已上传结束图: ${endImageName}`);
                } else {
                    console.log(`📸 [单图模式] 已上传图片: ${startImageName}`);
                }

                // C. 根据时长选择不同的工作流
                console.log(`🎯 [开始触发] 根据时长 ${duration}s 选择工作流...`);

                if (duration === '10' || duration === '20') {
                    // 长视频模式：使用 SVI 2.0 工作流
                    console.log(`🎯 [长视频模式] 触发 triggerComfyUI...`);
                    const result = await triggerComfyUI(
                        prompt,
                        startImageName,
                        "576p", // resolutionKey 不再使用，改用 ratio
                        duration,
                        promptSegments,
                        ratio
                    );
                    console.log(`✅ [任务提交] ComfyUI promptId: ${result}`);
                    await prisma.videoTask.update({
                        where: { id: task.id },
                        data: {
                            status: 'PROCESSING',
                            promptId: result
                        }
                    });
                    console.log(`✅ [数据库更新] 任务状态: PROCESSING, promptId: ${result}`);
                } else {
                    // 标准视频模式：使用 DaSiWa 8.1 双路径系统
                    console.log(`🎯 [标准视频模式] 触发 DaSiWa 8.1 双路径系统...`);
                    const result = await triggerComfyUINew(
                        startImageName,
                        endImageName,
                        prompt,
                        ratio,
                        duration
                    );

                    console.log(`✅ [任务提交] ComfyUI promptId: ${result.prompt_id}, 模式: ${result.mode}`);
                    await prisma.videoTask.update({
                        where: { id: task.id },
                        data: {
                            status: 'PROCESSING',
                            promptId: result.prompt_id,
                            translatedPrompt: `MODE:${result.mode}|TARGET:${result.targetOutputNode}`
                        }
                    });
                    console.log(`✅ [数据库更新] 任务状态: PROCESSING, 模式: ${result.mode}, 目标节点: ${result.targetOutputNode}`);
                }

            } catch (err) {
                console.error("❌ 任务失败:", err);
                await prisma.videoTask.update({ where: { id: task.id }, data: { status: 'FAILED' } });
            } finally {
                // 清理上传的临时文件
                if (imageFile?.path && fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);
                if (imageEndFile?.path && fs.existsSync(imageEndFile.path)) fs.unlinkSync(imageEndFile.path);
                console.log("✅ [清理] 已删除临时上传文件");
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
        if (task.status === 'COMPLETED') return res.json({ status: 'COMPLETED', resultUrl: task.resultUrl || task.videoUrl, type: task.type });

        if (task.status === 'PROCESSING' && task.promptId) {
            try {
                const historyRes = await fetch(`${process.env.COMFY_API_URL}/history/${task.promptId}`);
                const historyData = await historyRes.json();

                if (historyData[task.promptId]) {
                    console.log("🏁 检查任务状态...");
                    const taskStatus = historyData[task.promptId].status;

                    // 检查是否执行失败
                    if (taskStatus.status_str === 'error' || taskStatus.completed === false) {
                        console.error("❌ ComfyUI 任务执行失败:", taskStatus);

                        // 输出详细错误信息
                        const messages = historyData[task.promptId].messages || [];
                        for (const msg of messages) {
                            if (msg[0] === 'execution_error') {
                                console.error("❌ [执行错误详情]", JSON.stringify(msg[1], null, 2));
                            }
                        }

                        await prisma.videoTask.update({
                            where: { id: task.id },
                            data: { status: 'FAILED' }
                        });

                        return res.json({ status: 'FAILED', error: 'ComfyUI 执行失败' });
                    }

                    // 检查是否执行完成
                    if (taskStatus.completed) {
                        console.log("✅ 任务完成，正在解析...");
                        const outputs = historyData[task.promptId].outputs;

                        // ========================================
                        // 声明变量（在 if-else 外部，确保作用域正确）
                        // ========================================
                        let filename = null;
                        let subfolder = "";
                        let type = "output";

                        // ========================================
                        // 根据任务类型处理输出
                        // ========================================
                        if (task.type === 'IMG2IMG' || task.type === 'TXT2IMG') {
                            // === 文生图任务（IMG2IMG 或 TXT2IMG）：查找图片输出 ===
                            console.log(`🔍 [文生图调试-任务类型:${task.type}] outputs中的节点:`, Object.keys(outputs));
                            // 遍历所有输出节点，查找图片
                            for (const nodeId in outputs) {
                                const nodeOutput = outputs[nodeId];
                                console.log(`🔍 [文生图调试] 节点${nodeId}输出:`, Object.keys(nodeOutput || {}));
                                if (nodeOutput && nodeOutput.images && nodeOutput.images.length > 0) {
                                    const imageData = nodeOutput.images[0];
                                    filename = imageData.filename;
                                    subfolder = imageData.subfolder || "";
                                    type = imageData.type || "output";
                                    console.log(`🖼️ [文生图-${task.type}] 从节点${nodeId}抓取到图片: ${filename}`);
                                    break;
                                }
                            }

                            if (!filename) {
                                console.log(`⏳ [文生图-${task.type}] 未找到图片，继续等待...`);
                                return res.json({ status: 'PROCESSING' });
                            }
                        } else {
                            // === 图生视频任务（IMG2VID）：查找视频输出 ===
                            // 🎯 双路径输出节点判断（根据任务模式）
                            let targetOutputNode = "125"; // 默认双图模式
                            let taskMode = "DUAL";
                            if (task.translatedPrompt && task.translatedPrompt.includes('MODE:')) {
                                const modeMatch = task.translatedPrompt.match(/MODE:(SINGLE|DUAL)\|TARGET:(\d+)/);
                                if (modeMatch) {
                                    taskMode = modeMatch[1];
                                    targetOutputNode = modeMatch[2];
                                }
                            }
                            console.log(`🎯 [图生视频-目标节点] 根据模式决定抓取节点: ${targetOutputNode} (${taskMode})`);

                            const nodeOutput = outputs[targetOutputNode];
                            if (nodeOutput) {
                                console.log(`🎬 [节点${targetOutputNode}检查] 检查输出类型:`, Object.keys(nodeOutput));

                                // 🏆 核心兼容性修复：VHS 插件可能会把 mp4 放在 gifs 分类下
                                if (nodeOutput.gifs && nodeOutput.gifs.length > 0) {
                                    const videoData = nodeOutput.gifs[0];
                                    filename = videoData.filename;
                                    subfolder = videoData.subfolder || "";
                                    type = videoData.type || "output";
                                    console.log(`🎬 [图生视频] 成功从 [gifs] 分类抓取到视频: ${filename}`);
                                } else if (nodeOutput.videos && nodeOutput.videos.length > 0) {
                                    const videoData = nodeOutput.videos[0];
                                    filename = videoData.filename;
                                    subfolder = videoData.subfolder || "";
                                    type = videoData.type || "output";
                                    console.log(`🎬 [图生视频] 成功从 [videos] 分类抓取到视频: ${filename}`);
                                } else if (nodeOutput.images && nodeOutput.images.length > 0) {
                                    // 节点只有图片输出，说明视频还没生成完成
                                    console.log(`⏳ [图生视频] 节点${targetOutputNode}仅输出图片，视频合成中...`);
                                    console.log(`🔄 [继续轮询] 等待节点${targetOutputNode}输出视频...`);
                                    return res.json({ status: 'PROCESSING' });
                                } else {
                                    console.log(`⏳ [图生视频] 节点${targetOutputNode}尚无输出，等待...`);
                                    return res.json({ status: 'PROCESSING' });
                                }
                            } else {
                                console.warn(`⚠️ [图生视频] 节点${targetOutputNode}不存在 outputs 中`);
                                // 如果节点不存在，继续轮询等待
                                return res.json({ status: 'PROCESSING' });
                            }

                            // 只有找到视频文件才继续处理
                            if (!filename) {
                                console.log(`⏳ [图生视频] 未找到视频，继续等待...`);
                                return res.json({ status: 'PROCESSING' });
                            }
                        }

                        const baseUrl = process.env.COMFY_API_URL.replace(/\/$/, "");
                        const params = new URLSearchParams();
                        params.append("filename", filename);
                        params.append("type", type);
                        if (subfolder) params.append("subfolder", subfolder);

                        const cloudUrl = `${baseUrl}/view?${params.toString()}`;
                        console.log("☁️ 发现云端文件，准备下载...");

                        // 下载并保存到本地
                        let finalUrl = cloudUrl;
                        try {
                            finalUrl = await downloadFileToLocal(cloudUrl, filename, type);
                        } catch (downloadErr) {
                            console.error("⚠️ 下载失败，回退到云端链接");
                        }

                        // 更新任务状态
                        await prisma.videoTask.update({
                            where: { id: task.id },
                            data: {
                                status: 'COMPLETED',
                                resultUrl: finalUrl,
                                videoUrl: finalUrl // 向后兼容
                            }
                        });

                        return res.json({ status: 'COMPLETED', resultUrl: finalUrl, type: task.type });
                    }
                }
            } catch (e) {
                console.log(`⏳ [等待中] ComfyUI 还在处理，继续轮询... Error: ${e.message}`);
                // ComfyUI 还没返回结果，继续等待
            }
        }
        res.json({ status: task.status, resultUrl: task.resultUrl || task.videoUrl, type: task.type });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

// 合并视频接口
app.post('/api/merge-videos', async (req, res) => {
    try {
        const { videoUrls } = req.body;
        
        if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
            return res.status(400).json({ error: '请提供要合并的视频URL列表' });
        }

        console.log(`\n🎬 [视频合并] 收到合并请求，视频数量: ${videoUrls.length}`);

        // 创建合并目录
        const mergeDir = path.join(process.cwd(), 'uploads', 'merged');
        if (!fs.existsSync(mergeDir)) {
            fs.mkdirSync(mergeDir, { recursive: true });
        }

        // 下载所有视频到本地
        const localVideoPaths = [];
        for (let i = 0; i < videoUrls.length; i++) {
            const url = videoUrls[i];
            const filename = `temp_${Date.now()}_${i}.mp4`;
            const localPath = path.join(mergeDir, filename);
            
            console.log(`📥 下载视频 ${i + 1}/${videoUrls.length}: ${url}`);
            
            try {
                const response = await fetch(url);
                const fileStream = fs.createWriteStream(localPath);
                await streamPipeline(response.body, fileStream);
                localVideoPaths.push(localPath);
            } catch (err) {
                console.error(`❌ 下载视频 ${i + 1} 失败:`, err);
                // 清理已下载的视频
                localVideoPaths.forEach(p => {
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                });
                return res.status(500).json({ error: `下载视频 ${i + 1} 失败` });
            }
        }

        console.log('✅ 所有视频下载完成，开始合并...');

        // 创建临时文件列表
        const listFile = path.join(mergeDir, `list_${Date.now()}.txt`);
        const fileListContent = localVideoPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(listFile, fileListContent);

        // 输出文件路径
        const outputFile = path.join(mergeDir, `merged_${Date.now()}.mp4`);

        console.log('📋 视频列表文件:', fileListContent);

        // 使用 fluent-ffmpeg 合并视频
        try {
            await new Promise((resolve, reject) => {
                ffmpeg()
                    .input(listFile)
                    .inputOptions([
                        '-f', 'concat',
                        '-safe', '0'
                    ])
                    .outputOptions([
                        '-c', 'copy',
                        '-y'
                    ])
                    .output(outputFile)
                    .on('start', (commandLine) => {
                        console.log('🚀 FFmpeg 命令:', commandLine);
                    })
                    .on('progress', (progress) => {
                        console.log(`⏳ 合并进度: ${progress.percent ? progress.percent.toFixed(1) + '%' : '进行中...'}`);
                    })
                    .on('end', () => {
                        console.log('✅ 视频合并成功!');
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('❌ FFmpeg 合并失败:', err.message);
                        reject(err);
                    })
                    .run();
            });

            // 清理临时文件
            try {
                fs.unlinkSync(listFile);
                localVideoPaths.forEach(p => {
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                });
                console.log('✅ 临时文件已清理');
            } catch (cleanupErr) {
                console.error('⚠️ 清理临时文件失败:', cleanupErr);
            }

            // 生成可访问的URL
            const mergeUrl = `http://localhost:3000/uploads/merged/${path.basename(outputFile)}`;
            
            console.log('🎉 合并完成，输出URL:', mergeUrl);
            
            return res.json({ 
                success: true, 
                mergeUrl,
                message: '视频合并成功'
            });

        } catch (ffmpegError) {
            console.error('❌ FFmpeg 执行失败:', ffmpegError);
            
            // 清理临时文件
            try {
                fs.unlinkSync(listFile);
                localVideoPaths.forEach(p => {
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                });
            } catch (cleanupErr) {
                console.error('清理临时文件失败:', cleanupErr);
            }
            
            return res.status(500).json({ error: '视频合并失败: ' + ffmpegError.message });
        }

    } catch (error) {
        console.error('❌ 视频合并失败:', error);
        res.status(500).json({ error: error.message || '视频合并失败' });
    }
});

// 静态文件服务 - 合并后的视频
app.use('/uploads/merged', express.static(path.join(process.cwd(), 'uploads', 'merged')));

// 修改密码
app.post('/api/auth/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "请提供当前密码和新密码" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "新密码长度不能少于6位" });
        }
        
        // 获取用户token
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: "未登录" });
        }
        
        // 验证token
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        
        if (!user) {
            return res.status(401).json({ error: "用户不存在" });
        }
        
        // 验证当前密码
        const bcrypt = await import('bcryptjs');
        const isPasswordValid = await bcrypt.default.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({ error: "当前密码错误" });
        }
        
        // 生成新密码的hash
        const hashedNewPassword = await bcrypt.default.hash(newPassword, 10);
        
        // 更新密码
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword }
        });
        
        console.log(`🔑 用户 ${user.username} 修改密码成功`);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({ error: "服务器内部错误" });
    }
});

const PORT = process.env.PORT || 3000;

// 设置服务器超时时间（30分钟，用于长时间视频生成）
const server = app.listen(PORT, () => {
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
    console.log(`🎤 TTS功能已配置，请确保在.env文件中填写Minimax API信息`);
});

// 设置请求超时为30分钟（冷启动可能需要很长时间）
server.setTimeout(30 * 60 * 1000);

// 设置Keep-Alive超时
server.on('connection', (socket) => {
    socket.setTimeout(30 * 60 * 1000);
});

// 启动服务器前先初始化数据库
initializeDatabase().then(() => {
    console.log(`✅ 数据库初始化完成`);
}).catch(error => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
});