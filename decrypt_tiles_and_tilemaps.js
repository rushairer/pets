const fs = require('fs');

console.log('=== MakeCode Tile/Tilemap 解密工具 ===');

// 颜色索引到像素字符的映射
const colorToPixelMap = {
    0: '.', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
    9: '9', 10: 'a', 11: 'b', 12: 'c', 13: 'd', 14: 'e', 15: 'f'
};

// 解密F4格式的tile图像
function decryptTileImage(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 解析头部
    const magic1 = buffer[0];
    const magic2 = buffer[1];
    const width = buffer.readUInt16LE(2);
    const height = buffer.readUInt16LE(4);
    
    console.log(`  - Magic: 0x${magic1.toString(16).padStart(2, '0')} 0x${magic2.toString(16).padStart(2, '0')}`);
    console.log(`  - 尺寸: ${width}x${height}`);
    
    if (magic1 !== 0x87 || magic2 !== 0x04) {
        console.log('  ❌ 不是有效的F4格式');
        return null;
    }
    
    // 解析像素数据 (4位打包格式)
    const pixelData = buffer.slice(8);
    const pixels = [];
    
    // 解包4位数据
    for (let i = 0; i < pixelData.length; i++) {
        const byte = pixelData[i];
        const pixel1 = byte & 0x0F;
        const pixel2 = (byte >> 4) & 0x0F;
        pixels.push(pixel1, pixel2);
    }
    
    // 转换回行优先顺序 (原始是列优先)
    const matrix = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const colMajorIndex = x * height + y;
            const colorIndex = pixels[colMajorIndex] || 0;
            row.push(colorToPixelMap[colorIndex] || '.');
        }
        matrix.push(row);
    }
    
    return matrix;
}

// 解密tilemap数据
function decryptTilemap(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    const asciiData = buffer.toString('ascii');
    
    console.log(`  - ASCII数据长度: ${asciiData.length}`);
    
    // 解析头部 (前10字符)
    const header = asciiData.substring(0, 10);
    console.log(`  - 头部: "${header}"`);
    
    // 解析尺寸信息
    let width, height;
    if (header === '1040001000') {
        width = 64; height = 16;
    } else if (header === '1010002000') {
        width = 16; height = 32;
    } else if (header === '1010001000') {
        width = 16; height = 16;
    } else {
        console.log('  ❌ 未知的头部格式');
        return null;
    }
    
    console.log(`  - 推断尺寸: ${width}x${height}`);
    
    // 解析地图数据 (每3个字符表示一个字节)
    const mapData = [];
    for (let i = 10; i < asciiData.length; i += 3) {
        const valueStr = asciiData.substring(i, i + 3);
        const value = parseInt(valueStr);
        mapData.push(value);
    }
    
    console.log(`  - 地图数据长度: ${mapData.length} 字节`);
    console.log(`  - 预期长度: ${width * height} 字节`);
    
    // 转换为2D地图矩阵
    const mapMatrix = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const tileId = index < mapData.length ? mapData[index] : 0;
            row.push(tileId);
        }
        mapMatrix.push(row);
    }
    
    return {
        width,
        height,
        mapData,
        mapMatrix
    };
}

// 主解密函数
function decryptTilesAndTilemaps() {
    try {
        // 读取jres文件
        const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
        const jresData = JSON.parse(jresContent);
        
        console.log('\n🔓 开始解密tiles和tilemaps...\n');
        
        // 解密tiles
        console.log('=== 解密Tile图像 ===');
        const tileKeys = Object.keys(jresData).filter(key => 
            key.startsWith('myTiles.') && jresData[key].mimeType === 'image/x-mkcd-f4'
        );
        
        tileKeys.forEach(tileKey => {
            console.log(`\n📷 解密tile: ${tileKey}`);
            const tileData = jresData[tileKey];
            
            const matrix = decryptTileImage(tileData.data);
            if (matrix) {
                console.log('  - 解密结果:');
                console.log('```');
                matrix.forEach(row => {
                    console.log('  ' + row.join(' '));
                });
                console.log('```');
            }
        });
        
        // 解密tilemaps
        console.log('\n=== 解密Tilemap数据 ===');
        const tilemapKeys = Object.keys(jresData).filter(key => 
            jresData[key].mimeType === 'application/mkcd-tilemap'
        );
        
        tilemapKeys.forEach(tilemapKey => {
            console.log(`\n🗺️  解密tilemap: ${tilemapKey}`);
            const tilemapData = jresData[tilemapKey];
            
            const result = decryptTilemap(tilemapData.data);
            if (result) {
                console.log('  - 地图矩阵预览 (前10行):');
                console.log('```');
                result.mapMatrix.slice(0, 10).forEach((row, y) => {
                    const rowStr = row.map(id => id.toString().padStart(2, ' ')).join(' ');
                    console.log(`  ${y.toString().padStart(2, ' ')}: ${rowStr}`);
                });
                if (result.mapMatrix.length > 10) {
                    console.log('  ... (更多行)');
                }
                console.log('```');
                
                // 统计tile使用情况
                const tileStats = {};
                result.mapData.forEach(tileId => {
                    tileStats[tileId] = (tileStats[tileId] || 0) + 1;
                });
                
                console.log('  - Tile使用统计:');
                Object.keys(tileStats).sort((a, b) => parseInt(a) - parseInt(b)).forEach(tileId => {
                    const count = tileStats[tileId];
                    const percentage = (count / result.mapData.length * 100).toFixed(1);
                    console.log(`    Tile ${tileId}: ${count}次 (${percentage}%)`);
                });
            }
        });
        
        console.log('\n✅ 解密完成！');
        
    } catch (error) {
        console.error('❌ 解密出错:', error.message);
        console.error(error.stack);
    }
}

// 执行解密
decryptTilesAndTilemaps();