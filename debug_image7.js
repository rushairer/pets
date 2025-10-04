// 调试Image7的像素解析过程
const fs = require('fs');
const tsContent = fs.readFileSync('images.g.ts', 'utf8');

const image7Match = tsContent.match(/case\s+"image7"[\s\S]*?return\s+img`([\s\S]*?)`;/);
if (image7Match) {
    const pixelArt = image7Match[1];
    console.log('Image7原始像素数据前200字符:');
    console.log(pixelArt.substring(0, 200));
    
    // 模拟我的解析逻辑
    const lines = pixelArt.trim().split('\n').filter(line => line.trim());
    console.log('\n解析结果:');
    console.log('- 总行数:', lines.length);
    console.log('- 第一行:', lines[0]);
    console.log('- 第一行长度:', lines[0].length);
    
    // 检查是否包含空格分隔
    const hasSpaces = lines[0].includes(' ');
    console.log('- 包含空格:', hasSpaces);
    
    if (!hasSpaces) {
        console.log('- 这是连续字符格式，每个字符代表一个像素');
        console.log('- 第一行前20个字符:', lines[0].substring(0, 20));
        
        // 计算实际尺寸
        const width = lines[0].length;
        const height = lines.length;
        console.log('- 计算尺寸:', width + 'x' + height);
    }
}