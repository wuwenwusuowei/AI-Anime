// test.js - 用来测试接口的小脚本

async function testGenerate() {
  console.log("⏳ 正在发送请求给后端...");
  
  try {
    // 发送 POST 请求
    const response = await fetch("http://localhost:3000/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      // 模拟前端发来的数据
      body: JSON.stringify({
        prompt: "一个银发少女站在樱花树下，唯美，动漫风格",
        style: "anime" 
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log("✅ 测试成功！后端返回数据：", data);
      console.log("👉 任务ID:", data.taskId);
    } else {
      console.log("❌ 请求失败，后端报错：", data);
    }

  } catch (error) {
    console.log("❌ 连不上服务器，请检查 node server.js 是否在运行！");
    console.error(error);
  }
}

testGenerate();