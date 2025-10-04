const fs = require('fs');

console.log('=== 完整的Tiles和Tilemaps转换系统 ===');

// 像素到颜色的映射 (PXT 标准调色板)
const pixelToColorMap = {
    '.': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15
};

// 将像素艺术转换为 F4 格式 (16x16 tiles)
function pixelArtToF4Base64(pixelArt) {
    const lines = pixelArt.trim().split('\n');
    const height = lines.length;
    const width = lines[0].trim().split(' ').length;
    
    console.log(`处理tile: ${width}x${height}`);
    
    // 解析像素数据
    const pixels = [];
    for (let y = 0; y < height; y++) {
        const row = lines[y].trim().split(' ');
        for (let x = 0; x < width; x++) {
            const char = x < row.length ? row[x] : '.';
            const colorIndex = pixelToColorMap[char] || 0;
            pixels.push(colorIndex);
        }
    }
    
    // F4格式编码 (16x16图像使用4位打包)
    const bufferSize = 8 + Math.ceil((width * height) / 2);
    const buffer = new Uint8Array(bufferSize);
    
    // 头部
    buffer[0] = 0x87; // Magic number
    buffer[1] = 0x04;
    buffer[2] = width & 0xFF;
    buffer[3] = (width >> 8) & 0xFF;
    buffer[4] = height & 0xFF;
    buffer[5] = (height >> 8) & 0xFF;
    buffer[6] = 0;
    buffer[7] = 0;
    
    // 列优先排列像素数据
    const reorderedPixels = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const index = y * width + x;
            reorderedPixels.push(pixels[index] || 0);
        }
    }
    
    // 4位打包像素数据
    for (let i = 0; i < reorderedPixels.length; i += 2) {
        const pixel1 = reorderedPixels[i] || 0;
        const pixel2 = reorderedPixels[i + 1] || 0;
        const packedByte = (pixel1 & 0x0F) | ((pixel2 & 0x0F) << 4);
        buffer[8 + Math.floor(i / 2)] = packedByte;
    }
    
    return Buffer.from(buffer).toString('base64');
}

// 将hex tilemap数据转换为ASCII格式
function hexTilemapToASCII(hexData, width, height) {
    // 解析hex数据
    const buffer = Buffer.from(hexData, 'hex');
    const mapWidth = buffer[0] | (buffer[1] << 8);
    const mapHeight = buffer[2] | (buffer[3] << 8);
    const mapData = Array.from(buffer.slice(4));
    
    console.log(`Tilemap: ${mapWidth}x${mapHeight}, 数据长度: ${mapData.length}`);
    
    // 生成ASCII头部
    let header;
    if (mapWidth === 64 && mapHeight === 16) {
        header = '1040001000'; // level1的特殊格式
    } else {
        // 其他情况：101 + 高度编码 + 000
        let heightCode;
        if (mapHeight === 32) {
            heightCode = '0002';
        } else if (mapHeight === 16) {
            heightCode = '0001';
        } else {
            heightCode = Math.floor(mapHeight / 16).toString().padStart(4, '0');
        }
        header = '101' + heightCode + '000';
    }
    
    // 生成地图数据 - 每个字节用3个ASCII字符表示
    const mapAscii = mapData.map(byte => 
        byte.toString().padStart(3, '0')
    ).join('');
    
    return header + mapAscii;
}

// 主转换函数
function convertTilesAndTilemaps() {
    try {
        // 读取源文件
        const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');
        const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
        const jresData = JSON.parse(jresContent);
        
        let totalUpdated = 0;
        let totalMatched = 0;
        let totalProcessed = 0;
        
        console.log('\n🔍 处理Tile图像...');
        
        // 处理tile图像
        const tileMatches = [...tsContent.matchAll(/case "myTiles\.(tile\d+)":[^`]*return img`([^`]+)`/gs)];
        
        tileMatches.forEach(match => {
            const tileName = match[1];
            const pixelArt = match[2];
            const jresKey = `myTiles.${tileName}`;
            
            console.log(`\n处理tile: ${tileName}`);
            totalProcessed++;
            
            if (!jresData[jresKey]) {
                console.log(`❌ 未找到jres条目: ${jresKey}`);
                return;
            }
            
            // 生成新的F4数据
            const newBase64 = pixelArtToF4Base64(pixelArt);
            const originalBase64 = jresData[jresKey].data;
            const isMatch = originalBase64 === newBase64;
            
            console.log(`- 数据匹配: ${isMatch ? '✅' : '❌'}`);
            
            if (isMatch) {
                totalMatched++;
            } else {
                console.log(`- 原始长度: ${originalBase64.length}, 生成长度: ${newBase64.length}`);
                jresData[jresKey].data = newBase64;
                totalUpdated++;
                console.log('- ✅ 已更新数据');
            }
        });
        
        console.log('\n🔍 处理Tilemap数据...');
        
        // 处理tilemap数据
        const tilemapMatches = [...tsContent.matchAll(/case "([^"]+)":[^}]+return tiles\.createTilemap\(hex`([^`]+)`/gs)];
        
        // 名称映射
        const nameToKey = {
            'level': 'level1',
            'level1': 'level1', 
            'level0': 'level2',
            'level2': 'level2',
            'level3': 'level3'
        };
        
        tilemapMatches.forEach(match => {
            const tilemapName = match[1];
            const hexData = match[2];
            const jresKey = nameToKey[tilemapName];
            
            if (!jresKey) {
                console.log(`跳过未映射的tilemap: ${tilemapName}`);
                return;
            }
            
            console.log(`\n处理tilemap: ${tilemapName} -> ${jresKey}`);
            totalProcessed++;
            
            if (!jresData[jresKey]) {
                console.log(`❌ 未找到jres条目: ${jresKey}`);
                return;
            }
            
            // 解析hex数据获取尺寸
            const buffer = Buffer.from(hexData, 'hex');
            const width = buffer[0] | (buffer[1] << 8);
            const height = buffer[2] | (buffer[3] << 8);
            
            // 生成ASCII格式数据
            const asciiData = hexTilemapToASCII(hexData, width, height);
            const newBase64 = Buffer.from(asciiData, 'ascii').toString('base64');
            const originalBase64 = jresData[jresKey].data;
            const isMatch = originalBase64 === newBase64;
            
            console.log(`- 尺寸: ${width}x${height}`);
            console.log(`- ASCII长度: ${asciiData.length}`);
            console.log(`- 数据匹配: ${isMatch ? '✅' : '❌'}`);
            
            if (isMatch) {
                totalMatched++;
            } else {
                console.log(`- 原始长度: ${originalBase64.length}, 生成长度: ${newBase64.length}`);
                jresData[jresKey].data = newBase64;
                totalUpdated++;
                console.log('- ✅ 已更新数据');
            }
        });
        
        console.log('\n🔍 处理transparency16...');
        
        // 处理transparency16 (空白tile)
        if (jresData['myTiles.transparency16']) {
            totalProcessed++;
            const emptyPixelArt = Array(16).fill(Array(16).fill('.').join(' ')).join('\n');
            const newBase64 = pixelArtToF4Base64(emptyPixelArt);
            const originalBase64 = jresData['myTiles.transparency16'].data;
            const isMatch = originalBase64 === newBase64;
            
            console.log(`- 数据匹配: ${isMatch ? '✅' : '❌'}`);
            
            if (isMatch) {
                totalMatched++;
            } else {
                jresData['myTiles.transparency16'].data = newBase64;
                totalUpdated++;
                console.log('- ✅ 已更新数据');
            }
        }
        
        // 保存更新后的文件
        if (totalUpdated > 0) {
            fs.writeFileSync('tilemap.g.jres', JSON.stringify(jresData, null, 4));
            console.log(`\n✅ 已保存更新后的tilemap.g.jres文件`);
        }
        
        console.log(`\n📊 转换总结:`);
        console.log(`- 总处理数: ${totalProcessed}`);
        console.log(`- 匹配数: ${totalMatched}`);
        console.log(`- 更新数: ${totalUpdated}`);
        console.log(`- 准确率: ${totalProcessed > 0 ? (totalMatched/totalProcessed*100).toFixed(1) : 0}%`);
        
        if (totalMatched === totalProcessed) {
            console.log('\n🎉 所有tiles和tilemaps数据都完全正确！');
        }
        
    } catch (error) {
        console.error('转换出错:', error.message);
        console.error(error.stack);
    }
}

// 执行转换
convertTilesAndTilemaps();