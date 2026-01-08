const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTasks() {
    try {
        console.log('🧹 开始清理历史任务...');

        // 查找所有 PROCESSING 状态的任务
        const processingTasks = await prisma.videoTask.findMany({
            where: { status: 'PROCESSING' },
            orderBy: { id: 'asc' }
        });

        console.log(`📊 找到 ${processingTasks.length} 个 PROCESSING 状态的任务`);

        // 更新这些任务的状态为 FAILED
        const updated = await prisma.videoTask.updateMany({
            where: { status: 'PROCESSING' },
            data: { status: 'FAILED' }
        });

        console.log(`✅ 已将 ${updated.count} 个任务状态更新为 FAILED`);

        // 显示任务列表
        processingTasks.forEach(task => {
            console.log(`  - ID: ${task.id}, 类型: ${task.type}, promptId: ${task.promptId}`);
        });

    } catch (error) {
        console.error('❌ 清理失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupTasks();
