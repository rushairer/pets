// 调试算法处理Image7的过程
const fs = require('fs');

// 复制算法中的关键函数
function parsePixelArt(pixelArt) {
    const lines = pixelArt.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return { width: 0, height: 0, pixels: [] };
    
    // 检查第一行是否包含空格分隔的像素
    const firstLine = lines[0].trim();
    const hasSpaces = firstLine.includes(' ');
    
    let pixels = [];
    let width, height;
    
    if (hasSpaces) {
        // 空格分隔格式
        console.log('使用空格分隔格式解析');
        for (let y = 0; y < lines.length; y++) {
            const linePixels = lines[y].trim().split(/\s+/).filter(p => p);
            for (let x = 0; x < linePixels.length; x++) {
                const pixel = linePixels[x];
                if (pixel !== '.') {
                    const value = pixel === '.' ? 0 : 
                                 /^\d$/.test(pixel) ? parseInt(pixel) : 
                                 pixel.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
                    pixels.push({ x, y, value });
                }
            }
        }
        width = Math.max(...lines.map(line => line.trim().split(/\s+/).filter(p => p).length));
        height = lines.length;
    } else {
        // 连续字符格式
        console.log('使用连续字符格式解析');
        width = lines[0].length;
        height = lines.length;
        
        for (let y = 0; y < height; y++) {
            const line = lines[y];
            for (let x = 0; x < width; x++) {
                const pixel = line[x] || '.';
                if (pixel !== '.') {
                    const value = /^\d$/.test(pixel) ? parseInt(pixel) : 
                                 pixel.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
                    pixels.push({ x, y, value });
                }
            }
        }
    }
    
    return { width, height, pixels };
}

// 测试Image7
const tsContent = fs.readFileSync('images.g.ts', 'utf8');
const image7Match = tsContent.match(/case\s+"image7"[\s\S]*?return\s+img`([\s\S]*?)`;/);

if (image7Match) {
    const pixelArt = image7Match[1];
    console.log('开始解析Image7...');
    
    const result = parsePixelArt(pixelArt);
    console.log('解析结果:');
    console.log('- 尺寸:', result.width + 'x' + result.height);
    console.log('- 非空像素数量:', result.pixels.length);
    console.log('- 前10个像素:', result.pixels.slice(0, 10));
    
    // 检查像素值分布
    const valueCount = {};
    result.pixels.forEach(p => {
        valueCount[p.value] = (valueCount[p.value] || 0) + 1;
    });
    console.log('- 像素值分布:', valueCount);
}