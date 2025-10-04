const fs = require('fs');

console.log('=== MakeCode Tile图像转换工具 ===');

// 读取tilemap.g.ts文件中的tile图像
const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');

// 解析像素艺术数据
function parsePixelArt(pixelArtString) {
    const lines = pixelArtString.trim().split('\n').map(line => line.trim());
    const height = lines.length;
    
    const pixelData = [];
    const charToPixel = {
        '.': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
        '8': 8, '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15
    };
    
    let width = 0;
    lines.forEach((line, lineIndex) => {
        const chars = line.split(' ').filter(c => c.length > 0);
        if (lineIndex === 0) {
            width = chars.length; // 正确计算宽度
        }
        
        chars.forEach(char => {
            if (char in charToPixel) {
                pixelData.push(charToPixel[char]);
            }
        });
    });
    
    return { pixelData, width, height };
}

// F4编码函数（从fix_images_data.js复制）
function convertPixelArtToF4(pixelData, width, height) {
    const header = Buffer.from([135, 4, width & 0xFF, width >> 8, height & 0xFF, height >> 8]);
    
    if (width >= 16 || height >= 16) {
        // 大图像：4位打包，列优先
        const packedData = [];
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row += 2) {
                const pixel1 = pixelData[row * width + col];
                const pixel2 = row + 1 < height ? pixelData[(row + 1) * width + col] : 0;
                packedData.push(pixel1 | (pixel2 << 4));
            }
        }
        return Buffer.concat([header, Buffer.from(packedData)]);
    } else {
        // 小图像：稀疏存储
        const sparseData = [];
        pixelData.forEach((pixel, index) => {
            if (pixel !== 0) {
                sparseData.push(index, pixel);
            }
        });
        return Buffer.concat([header, Buffer.from(sparseData)]);
    }
}

// 解析displayName
function parseDisplayName(content, caseName) {
    const regex = new RegExp(`case\\s+"${caseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?return\\s+`, 'g');
    let match = regex.exec(content);
    
    if (match) {
        // 查找前面的case语句
        const beforeMatch = content.substring(0, match.index);
        const caseRegex = /case\s+"([^"]+)":\s*$/gm;
        let caseMatch;
        let lastCase = caseName;
        
        while ((caseMatch = caseRegex.exec(beforeMatch)) !== null) {
            if (caseMatch.index > match.index - 200) { // 在附近的case
                lastCase = caseMatch[1];
            }
        }
        
        // 还要检查当前匹配中是否有多个case
        const currentMatch = match[0];
        const currentCaseRegex = /case\s+"([^"]+)":/g;
        let currentCaseMatch;
        while ((currentCaseMatch = currentCaseRegex.exec(currentMatch)) !== null) {
            lastCase = currentCaseMatch[1];
        }
        
        return lastCase;
    }
    
    return caseName;
}

// 解析tile图像
function parseTileImages(content) {
    const tiles = [];
    
    // 查找tile图像定义
    const tileRegex = /case\s+"([^"]+)":\s*return\s+img`([^`]+)`/g;
    let match;
    
    while ((match = tileRegex.exec(content)) !== null) {
        const [, caseName, pixelArt] = match;
        
        // 跳过transparency16
        if (caseName.includes('transparency')) continue;
        
        const displayName = parseDisplayName(content, caseName);
        const parsed = parsePixelArt(pixelArt);
        
        tiles.push({
            caseName,
            displayName,
            ...parsed
        });
        
        console.log(`找到tile: ${caseName} -> ${displayName} (${parsed.width}x${parsed.height})`);
    }
    
    return tiles;
}

// 主处理函数
function processTileImages() {
    const tiles = parseTileImages(tsContent);
    
    if (tiles.length === 0) {
        console.log('未找到tile图像数据');
        return;
    }
    
    // 读取现有的jres文件
    const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
    const jresData = JSON.parse(jresContent);
    
    let totalMatches = 0;
    let totalTiles = 0;
    
    // 处理每个tile
    tiles.forEach(tile => {
        const f4Buffer = convertPixelArtToF4(tile.pixelData, tile.width, tile.height);
        const base64Data = f4Buffer.toString('base64');
        
        console.log(`\n处理tile: ${tile.displayName}`);
        console.log(`- 尺寸: ${tile.width}x${tile.height}`);
        console.log(`- 像素数据长度: ${tile.pixelData.length}`);
        console.log(`- 前10个像素: [${tile.pixelData.slice(0, 10).join(', ')}]`);
        console.log(`- 生成的F4长度: ${f4Buffer.length}字节`);
        
        // 查找对应的jres条目
        const jresKey = Object.keys(jresData).find(key => 
            jresData[key].displayName === tile.displayName ||
            key.includes(tile.displayName) ||
            jresData[key].displayName === tile.caseName
        );
        
        totalTiles++;
        
        if (jresKey && jresData[jresKey].mimeType === 'image/x-mkcd-f4') {
            const originalData = jresData[jresKey].data;
            const match = originalData === base64Data;
            
            console.log(`- 找到对应jres条目: ${jresKey}`);
            console.log(`- 数据匹配: ${match ? '✅' : '❌'}`);
            
            if (match) {
                totalMatches++;
            } else {
                console.log(`  原始长度: ${originalData.length}, 生成长度: ${base64Data.length}`);
                
                // 更新数据
                jresData[jresKey].data = base64Data;
                console.log('  ✅ 已更新数据');
            }
        } else {
            console.log(`- ❌ 未找到对应的jres条目`);
        }
    });
    
    console.log(`\n📊 Tile图像转换总结:`);
    console.log(`- 总tile数: ${totalTiles}`);
    console.log(`- 匹配数: ${totalMatches}`);
    console.log(`- 准确率: ${totalTiles > 0 ? (totalMatches/totalTiles*100).toFixed(1) : 0}%`);
    
    // 写回jres文件
    fs.writeFileSync('tilemap.g.jres', JSON.stringify(jresData, null, 4));
    console.log('\n转换完成！tilemap.g.jres 文件已更新');
}

// 执行处理
try {
    processTileImages();
} catch (error) {
    console.error('处理出错:', error.message);
    console.error(error.stack);
}