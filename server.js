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
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import taskRoutes from './routes/tasks.js';
import templateRoutes from './routes/templates.js';

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

// Flux 画幅映射
const ASPECT_RATIOS = {
    "1:1": { width: 1024, height: 1024 },
    "9:16": { width: 832, height: 1216 }, // 竖屏 (最佳分镜比例)
    "16:9": { width: 1216, height: 832 }, // 横屏
    "3:4": { width: 896, height: 1152 }
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

// Flux 文生图触发函数
async function triggerTxt2Img(prompt, ratio = "9:16", styleKey = "default") {
    console.log(`🎨 [Flux 文生图] 开始生成...`);
    const workflowPath = path.join(__dirname, 'Flux_Txt2Img_API.json');
    let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    // 节点 ID 配置
    const PROMPT_NODE = "2";
    const SEED_NODE = "5";
    const RESOLUTION_NODE = "4";
    const LORA_NODE = "10";

    // 获取风格配置
    const styleConfig = STYLE_MAP[styleKey] || STYLE_MAP["default"];
    const ratioConfig = ASPECT_RATIOS[ratio] || ASPECT_RATIOS["9:16"];
    const seed = Math.floor(Math.random() * 1000000000000);

    // 追加风格提示词后缀
    const finalPrompt = prompt + styleConfig.prompt_suffix;

    console.log(`🔧 [配置] 风格: ${styleConfig.name} (${styleKey})`);
    console.log(`🔧 [配置] 提示词: ${finalPrompt.substring(0, 50)}... | 画幅: ${ratio} (${ratioConfig.width}x${ratioConfig.height})`);

    // 修改参数
    workflow[PROMPT_NODE].inputs.text = finalPrompt;
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

// Flux 图生图触发函数 (Redux + PuLID)
async function triggerImg2Img(prompt, ratio = "9:16", bodyFileName, faceFileName) {
    console.log(`🎨 [Flux 图生图] 开始生成...`);
    const workflowPath = path.join(__dirname, 'Flux_Img2Img_API.json');
    let workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

    // 节点 ID 配置
    const PROMPT_NODE = "2";
    const SEED_NODE = "5";
    const RESOLUTION_NODE = "4";
    const BODY_IMAGE_NODE = "13"; // Redux 参考图 (全身)
    const FACE_IMAGE_NODE = "24"; // PuLID 参考图 (脸部)

    const ratioConfig = ASPECT_RATIOS[ratio] || ASPECT_RATIOS["9:16"];
    const seed = Math.floor(Math.random() * 1000000000000);

    console.log(`🔧 [配置] 提示词: ${prompt.substring(0, 50)}... | 画幅: ${ratio} (${ratioConfig.width}x${ratioConfig.height})`);
    console.log(`📷 [参考图] 全身: ${bodyFileName} | 脸部: ${faceFileName}`);

    // 修改参数
    workflow[PROMPT_NODE].inputs.text = prompt;
    workflow[SEED_NODE].inputs.seed = seed;
    workflow[RESOLUTION_NODE].inputs.width = ratioConfig.width;
    workflow[RESOLUTION_NODE].inputs.height = ratioConfig.height;
    workflow[BODY_IMAGE_NODE].inputs.image = bodyFileName;
    workflow[FACE_IMAGE_NODE].inputs.image = faceFileName;

    console.log(`🚀 [触发] 发送图生图任务... 种子: ${seed}`);

    const response = await fetch(`${process.env.COMFY_API_URL}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow })
    });

    if (!response.ok) throw new Error(`ComfyUI Error: ${response.statusText}`);
    const data = await response.json();
    return data.prompt_id;
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

// --- 4. TTS API 路由 ---

// Minimax TTS 音色映射配置（根据文档中的音色ID）
const MINIMAX_VOICE_MAPPING = {
    // 中文音色（根据文档示例）
    'female-shaonv': 'moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85',     // 少女音
    'female-qianxi': 'moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d',     // 温柔女声  
    'female-chengshu': 'Chinese (Mandarin)_Lyrical_Voice',                   // 成熟女声
    'male-qingnian': 'Chinese (Mandarin)_HK_Flight_Attendant',              // 青年男声
    'male-wennuan': 'male-qn-qingse',                                        // 温暖男声（文档示例）
    'male-laoren': 'moss_audio_6dc281eb-713c-11f0-a447-9613c873494c',      // 老年男声
    'child-tong': 'moss_audio_570551b1-735c-11f0-b236-0adeeecad052',       // 童声
    'female-yujie': 'English_Graceful_Lady',                                 // 御姐音
    
    // 英文音色
    'english-female': 'English_radiant_girl',
    'english-male': 'English_Persuasive_Man',
    
    // 日文音色
    'japanese-female': 'Japanese_Whisper_Belle',
    
    // 🔧 自定义音色映射：
    // 请根据你的Minimax API实际支持的音色ID修改这里的映射
    // 可使用查询可用音色API获取完整列表
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

// Flux 文生图接口
app.post('/api/generate/txt2img', async (req, res) => {
    try {
        const { prompt, ratio, style } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "请提供提示词" });
        }

        console.log(`\n🆕 Flux 文生图任务: ${prompt}, 画幅: ${ratio || '9:16'}, 风格: ${style || 'default'}`);

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
                const promptId = await triggerTxt2Img(prompt, ratio || '9:16', style || 'default');

                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { status: 'PROCESSING', promptId: promptId }
                });

                console.log(`✅ [文生图] 任务 ${task.id} 已发送到 ComfyUI`);
            } catch (err) {
                console.error(`❌ [文生图] 任务 ${task.id} 失败:`, err.message);
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

// Flux 图生图接口 (Redux + PuLID)
app.post('/api/generate/img2img', upload.fields([
    { name: 'imageBody', maxCount: 1 },
    { name: 'imageFace', maxCount: 1 }
]), async (req, res) => {
    try {
        const { prompt, ratio } = req.body;
        const bodyFile = req.files?.imageBody?.[0];
        const faceFile = req.files?.imageFace?.[0];

        if (!bodyFile || !faceFile) {
            return res.status(400).json({ error: "请上传全身参考图和脸部参考图" });
        }

        if (!prompt) {
            return res.status(400).json({ error: "请提供提示词" });
        }

        console.log(`\n🆕 Flux 图生图任务: ${prompt}, 画幅: ${ratio || '9:16'}`);

        const task = await prisma.videoTask.create({
            data: {
                userPrompt: prompt,
                type: 'IMG2IMG',
                status: 'PENDING',
                refImageBody: bodyFile.path,
                refImageFace: faceFile.path
            }
        });

        res.json({ success: true, taskId: task.id });

        // 异步执行任务
        (async () => {
            try {
                // 上传两张参考图到 ComfyUI
                const bodyCloudName = await uploadImageToComfy(bodyFile.path, bodyFile.originalname);
                const faceCloudName = await uploadImageToComfy(faceFile.path, faceFile.originalname);

                const promptId = await triggerImg2Img(prompt, ratio || '9:16', bodyCloudName, faceCloudName);

                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { status: 'PROCESSING', promptId: promptId }
                });

                console.log(`✅ [图生图] 任务 ${task.id} 已发送到 ComfyUI`);

                // 清理上传的临时文件
                if (fs.existsSync(bodyFile.path)) fs.unlinkSync(bodyFile.path);
                if (fs.existsSync(faceFile.path)) fs.unlinkSync(faceFile.path);
            } catch (err) {
                console.error(`❌ [图生图] 任务 ${task.id} 失败:`, err.message);
                await prisma.videoTask.update({
                    where: { id: task.id },
                    data: { status: 'FAILED' }
                });
                // 清理临时文件
                if (fs.existsSync(bodyFile.path)) fs.unlinkSync(bodyFile.path);
                if (fs.existsSync(faceFile.path)) fs.unlinkSync(faceFile.path);
            }
        })();
    } catch (error) {
        console.error('图生图任务创建失败:', error);
        res.status(500).json({ error: error.message });
    }
});

// 生成任务接口 (原有的图生视频)
app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        // 调试信息
        console.log('📋 Request body:', req.body);
        console.log('📁 Uploaded file:', req.file);
        
        // 从 body 获取参数
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
        if (task.status === 'COMPLETED') return res.json({ status: 'COMPLETED', resultUrl: task.resultUrl || task.videoUrl, type: task.type });

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

                    // 遍历寻找结果文件（图片或视频）
                    for (const nodeId in outputs) {
                        const nodeOutput = outputs[nodeId];

                        // 1. 先尝试找 images (文生图/图生图的结果)
                        if (nodeOutput.images && nodeOutput.images.length > 0) {
                            filename = nodeOutput.images[0].filename;
                            subfolder = nodeOutput.images[0].subfolder;
                            type = nodeOutput.images[0].type;
                            console.log(`🖼️ 发现图片结果: ${filename}`);
                            break;
                        }
                        // 2. 再尝试找 videos (图生视频的结果)
                        else if (nodeOutput.videos && nodeOutput.videos.length > 0) {
                            filename = nodeOutput.videos[0].filename;
                            subfolder = nodeOutput.videos[0].subfolder;
                            type = nodeOutput.videos[0].type;
                            console.log(`🎬 发现视频结果: ${filename}`);
                            break;
                        }
                        // 3. 再尝试找 gifs
                        else if (nodeOutput.gifs && nodeOutput.gifs.length > 0) {
                            filename = nodeOutput.gifs[0].filename;
                            subfolder = nodeOutput.gifs[0].subfolder;
                            type = nodeOutput.gifs[0].type;
                            console.log(`🎬 发现GIF结果: ${filename}`);
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
                // ComfyUI 还没返回结果，继续等待
            }
        }
        res.json({ status: task.status, resultUrl: task.resultUrl || task.videoUrl, type: task.type });
    } catch (e) {
        res.status(500).json({error: e.message});
    }
});

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

// 启动服务器前先初始化数据库
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 服务已启动: http://localhost:${PORT}`);
        console.log(`🎤 TTS功能已配置，请确保在.env文件中填写Minimax API信息`);
    });
}).catch(error => {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
});