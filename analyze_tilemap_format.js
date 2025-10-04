const fs = require('fs');

console.log('=== MakeCode Tilemap 格式分析 ===\n');

// 读取现有的 tilemap.g.jres
const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
const jresData = JSON.parse(jresContent);

// 分析 level1 的数据
const level1 = jresData.level1;
console.log('Level1 tilemap 分析:');
console.log('- mimeType:', level1.mimeType);
console.log('- dataEncoding:', level1.dataEncoding);
console.log('- tileset:', level1.tileset);

// 解码 base64 数据
const tilemapBuffer = Buffer.from(level1.data, 'base64');
console.log('- 原始数据长度:', tilemapBuffer.length, '字节');
console.log('- 前16字节 (hex):', tilemapBuffer.slice(0, 16).toString('hex'));

// 分析 tilemap.g.ts 中的对应数据
const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');

// 提取 hex 数据
const hexMatch = tsContent.match(/hex`([^`]+)`/);
if (hexMatch) {
    const hexData = hexMatch[1];
    console.log('\n从 TS 文件提取的 hex 数据:');
    console.log('- 长度:', hexData.length / 2, '字节');
    console.log('- 前32字符:', hexData.substring(0, 32));
    
    // 转换为 buffer
    const hexBuffer = Buffer.from(hexData, 'hex');
    console.log('- 转换后前16字节:', hexBuffer.slice(0, 16).toString('hex'));
    
    // 比较两个数据
    console.log('\n数据比较:');
    console.log('- Base64 解码数据匹配 Hex 数据:', tilemapBuffer.equals(hexBuffer));
}

// 分析 tilemap 结构
console.log('\n=== Tilemap 结构分析 ===');

// 从 TS 文件中提取 tilemap 创建参数
const tilemapMatch = tsContent.match(/tiles\.createTilemap\(hex`([^`]+)`,\s*img`([^`]*)`\s*,\s*\[([^\]]*)\]/);
if (tilemapMatch) {
    const [, hexData, imgData, tilesetData] = tilemapMatch;
    
    console.log('Tilemap 参数:');
    console.log('1. Hex 数据 (地图数据):', hexData.substring(0, 32) + '...');
    console.log('2. Img 数据 (预览图像):', imgData.trim().substring(0, 50) + '...');
    console.log('3. Tileset 数组:', tilesetData.trim());
    
    // 解析 hex 数据的结构
    const mapBuffer = Buffer.from(hexData, 'hex');
    console.log('\n地图数据分析:');
    console.log('- 总长度:', mapBuffer.length, '字节');
    
    // 前几个字节可能是宽度和高度
    if (mapBuffer.length >= 4) {
        const width1 = mapBuffer[0];
        const height1 = mapBuffer[1];
        const width2 = mapBuffer[0] | (mapBuffer[1] << 8);
        const height2 = mapBuffer[2] | (mapBuffer[3] << 8);
        
        console.log('- 可能的尺寸解析1:', width1, 'x', height1);
        console.log('- 可能的尺寸解析2:', width2, 'x', height2);
        
        // 检查哪种解析更合理
        const expectedSize1 = width1 * height1;
        const expectedSize2 = width2 * height2;
        const remainingBytes = mapBuffer.length - 2;
        const remainingBytes2 = mapBuffer.length - 4;
        
        console.log('- 解析1预期数据大小:', expectedSize1, '剩余字节:', remainingBytes);
        console.log('- 解析2预期数据大小:', expectedSize2, '剩余字节:', remainingBytes2);
    }
    
    // 显示前32字节的内容
    console.log('- 前32字节内容:');
    for (let i = 0; i < Math.min(32, mapBuffer.length); i += 8) {
        const slice = mapBuffer.slice(i, i + 8);
        const hex = slice.toString('hex').match(/.{2}/g).join(' ');
        const dec = Array.from(slice).join(' ').padEnd(23);
        console.log(`  ${i.toString().padStart(2)}: ${hex.padEnd(23)} | ${dec}`);
    }
}

// 分析 tile 数据
console.log('\n=== Tile 数据分析 ===');

['tile1', 'tile2', 'transparency16'].forEach(tileName => {
    const tileKey = `myTiles.${tileName}`;
    const tileData = jresData[tileKey];
    
    if (tileData) {
        console.log(`\n${tileName}:`);
        console.log('- mimeType:', tileData.mimeType);
        console.log('- tilemapTile:', tileData.tilemapTile);
        
        const tileBuffer = Buffer.from(tileData.data, 'base64');
        console.log('- 数据长度:', tileBuffer.length, '字节');
        console.log('- 前8字节:', tileBuffer.slice(0, 8).toString('hex'));
        
        // 解析尺寸（应该都是16x16）
        if (tileBuffer.length >= 8) {
            const magic1 = tileBuffer[0];
            const magic2 = tileBuffer[1];
            const width = tileBuffer[2] | (tileBuffer[3] << 8);
            const height = tileBuffer[4] | (tileBuffer[5] << 8);
            
            console.log(`- 魔数: [${magic1}, ${magic2}]`);
            console.log(`- 尺寸: ${width}x${height}`);
        }
    }
});

console.log('\n=== 分析完成 ===');