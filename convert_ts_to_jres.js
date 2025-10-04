const fs = require('fs');

console.log('=== TS到JRES完整转换工具 ===');

// 像素字符到颜色索引的映射
const pixelToColorMap = {
    '.': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15
};

// 解析像素艺术为颜色矩阵
function parsePixelArt(imageStr) {
    const lines = imageStr.trim().split('\n').map(line => line.trim());
    const matrix = [];
    
    for (const line of lines) {
        if (line.length === 0) continue;
        const pixels = line.split(/\s+/);
        const row = pixels.map(pixel => pixelToColorMap[pixel] || 0);
        matrix.push(row);
    }
    
    return matrix;
}

// 将像素矩阵转换为F4格式
function encodeF4Format(matrix) {
    const height = matrix.length;
    const width = matrix[0]?.length || 0;
    
    if (width === 0 || height === 0) {
        console.log('  ❌ 空的像素矩阵');
        return null;
    }
    
    console.log(`  - 尺寸: ${width}x${height}`);
    
    // 创建buffer (8字节头部 + 像素数据)
    const pixelCount = width * height;
    const packedSize = Math.ceil(pixelCount / 2);
    const totalSize = 8 + packedSize;
    const buffer = Buffer.alloc(totalSize, 0);
    
    // 写入头部
    buffer.writeUInt8(0x87, 0);  // Magic 1
    buffer.writeUInt8(0x04, 1);  // Magic 2
    buffer.writeUInt16LE(width, 2);   // 宽度
    buffer.writeUInt16LE(height, 4);  // 高度
    buffer.writeUInt16LE(0, 6);       // 保留
    
    // 转换为列优先顺序并打包
    let pixelIndex = 0;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const colorIndex = matrix[y][x];
            const bufferIndex = 8 + Math.floor(pixelIndex / 2);
            
            if (pixelIndex % 2 === 0) {
                // 低4位
                buffer[bufferIndex] |= (colorIndex & 0x0F);
            } else {
                // 高4位
                buffer[bufferIndex] |= ((colorIndex & 0x0F) << 4);
            }
            
            pixelIndex++;
        }
    }
    
    return buffer;
}

// 生成ASCII tilemap数据
function generateAsciiTilemapData(width, height, mapData) {
    // 高度编码系统
    let heightCode;
    if (height === 16) heightCode = '001';
    else if (height === 32) heightCode = '002';
    else heightCode = height.toString().padStart(3, '0');
    
    // 生成头部
    const header = `101${heightCode}000`;
    
    // 转换地图数据为ASCII
    const asciiMapData = mapData.map(byte => byte.toString().padStart(3, '0')).join('');
    
    return header + asciiMapData;
}

// 主转换函数
function convertTsToJres() {
    try {
        console.log('📖 读取 tilemap.g.ts...');
        const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');
        
        const jresData = {
            "*": {
                "mimeType": "image/x-mkcd-f4",
                "dataEncoding": "base64",
                "namespace": "myImages"
            }
        };
        
        console.log('\\n🎨 转换Tile图像...');
        
        // 提取所有图像数据
        const imageMatches = [...tsContent.matchAll(/case "([^"]+)":[^`]*return img\`([^`]+)\`/gs)];
        
        imageMatches.forEach(match => {
            const tileName = match[1];
            const imageStr = match[2];
            
            console.log(`\\n📷 处理tile: ${tileName}`);
            
            const matrix = parsePixelArt(imageStr);
            const buffer = encodeF4Format(matrix);
            
            if (buffer) {
                const base64Data = buffer.toString('base64');
                
                jresData[tileName] = {
                    "mimeType": "image/x-mkcd-f4",
                    "data": base64Data,
                    "displayName": tileName.split('.').pop()
                };
                
                console.log(`  ✅ 转换成功，base64长度: ${base64Data.length}`);
            }
        });
        
        console.log('\\n🗺️  转换Tilemap数据...');
        
        // 提取所有tilemap数据
        const tilemapMatches = [...tsContent.matchAll(/case "([^"]+)":[^}]*return tiles\.createTilemap\(hex`([^`]+)`/gs)];
        
        tilemapMatches.forEach(match => {
            const tilemapName = match[1];
            const hexData = match[2];
            
            console.log(`\\n🗺️  处理tilemap: ${tilemapName}`);
            
            if (hexData.length === 0) {
                console.log('  ⚠️  空的hex数据，跳过');
                return;
            }
            
            const buffer = Buffer.from(hexData, 'hex');
            const width = buffer.readUInt16LE(0);
            const height = buffer.readUInt16LE(2);
            const mapData = Array.from(buffer.slice(4));
            
            console.log(`  - 尺寸: ${width}x${height}`);
            console.log(`  - 地图数据长度: ${mapData.length}`);
            
            const asciiData = generateAsciiTilemapData(width, height, mapData);
            const asciiBuffer = Buffer.from(asciiData, 'ascii');
            const base64Data = asciiBuffer.toString('base64');
            
            jresData[tilemapName] = {
                "mimeType": "application/mkcd-tilemap",
                "data": base64Data,
                "displayName": tilemapName
            };
            
            console.log(`  ✅ 转换成功，ASCII长度: ${asciiData.length}, base64长度: ${base64Data.length}`);
        });
        
        console.log('\\n💾 写入 tilemap.g.jres...');
        fs.writeFileSync('tilemap.g.jres', JSON.stringify(jresData, null, 4));
        
        console.log('\\n📊 转换总结:');
        const tileCount = Object.keys(jresData).filter(key => 
            key !== '*' && jresData[key].mimeType === 'image/x-mkcd-f4'
        ).length;
        const tilemapCount = Object.keys(jresData).filter(key => 
            jresData[key].mimeType === 'application/mkcd-tilemap'
        ).length;
        
        console.log(`- 转换的tile数量: ${tileCount}`);
        console.log(`- 转换的tilemap数量: ${tilemapCount}`);
        console.log(`- 总资源数: ${Object.keys(jresData).length - 1}`);
        
        console.log('\\n🎉 转换完成！生成了 tilemap.g.jres');
        
    } catch (error) {
        console.error('❌ 转换出错:', error.message);
        console.error(error.stack);
    }
}

// 执行转换
convertTsToJres();