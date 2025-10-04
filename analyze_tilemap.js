// 分析Tilemap数据格式
const fs = require('fs');

console.log('🔍 分析Tilemap数据格式...\n');

// 读取tilemap数据
const tilemapContent = fs.readFileSync('tilemap.g.jres', 'utf8');
const tilemapData = JSON.parse(tilemapContent);

// 分析每个条目
Object.keys(tilemapData).forEach(key => {
    const item = tilemapData[key];
    console.log(`📄 ${key}:`);
    console.log(`   mimeType: ${item.mimeType}`);
    console.log(`   dataEncoding: ${item.dataEncoding}`);
    
    if (item.data) {
        const buffer = Buffer.from(item.data, 'base64');
        console.log(`   数据长度: ${buffer.length} 字节`);
        console.log(`   前16字节: [${Array.from(buffer.slice(0, 16)).join(', ')}]`);
        
        // 如果是F4格式，解析尺寸
        if (item.mimeType === 'image/x-mkcd-f4' && buffer.length >= 6) {
            const width = buffer[2] | (buffer[3] << 8);
            const height = buffer[4] | (buffer[5] << 8);
            console.log(`   F4格式 - 尺寸: ${width}x${height}`);
        }
        
        // 如果是tilemap格式，尝试解析
        if (item.mimeType === 'application/mkcd-tilemap') {
            console.log(`   Tilemap格式分析:`);
            // 尝试解析前几个字节
            if (buffer.length >= 8) {
                const width = buffer[0] | (buffer[1] << 8);
                const height = buffer[2] | (buffer[3] << 8);
                console.log(`   可能的尺寸: ${width}x${height}`);
                console.log(`   字节4-7: [${Array.from(buffer.slice(4, 8)).join(', ')}]`);
            }
        }
    }
    
    if (item.tileset) {
        console.log(`   tileset: [${item.tileset.join(', ')}]`);
    }
    
    console.log('');
});

// 分析TypeScript中的tilemap定义
console.log('🔍 分析TypeScript中的tilemap定义...\n');

const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');

// 提取hex数据
const hexMatch = tsContent.match(/tiles\.createTilemap\(hex`([^`]+)`/);
if (hexMatch) {
    const hexData = hexMatch[1];
    console.log(`Hex数据: ${hexData}`);
    console.log(`Hex长度: ${hexData.length} 字符`);
    
    // 转换为字节
    const bytes = [];
    for (let i = 0; i < hexData.length; i += 2) {
        bytes.push(parseInt(hexData.substr(i, 2), 16));
    }
    
    console.log(`字节数组长度: ${bytes.length}`);
    console.log(`前16字节: [${bytes.slice(0, 16).join(', ')}]`);
    
    // 尝试解析尺寸
    if (bytes.length >= 4) {
        const width = bytes[0] | (bytes[1] << 8);
        const height = bytes[2] | (bytes[3] << 8);
        console.log(`解析的尺寸: ${width}x${height}`);
        
        // 检查数据是否匹配
        const expectedDataSize = width * height;
        const actualDataSize = bytes.length - 4;
        console.log(`期望数据大小: ${expectedDataSize}, 实际: ${actualDataSize}`);
        
        if (actualDataSize >= expectedDataSize) {
            const mapData = bytes.slice(4, 4 + expectedDataSize);
            console.log(`地图数据 (前20个): [${mapData.slice(0, 20).join(', ')}]`);
            
            // 统计tile使用情况
            const tileCount = {};
            mapData.forEach(tile => {
                tileCount[tile] = (tileCount[tile] || 0) + 1;
            });
            console.log(`Tile使用统计:`, tileCount);
        }
    }
}

console.log('\n对比base64数据和hex数据...');
const level1Data = tilemapData['level1'];
if (level1Data) {
    const base64Buffer = Buffer.from(level1Data.data, 'base64');
    const hexBuffer = Buffer.from(hexData, 'hex');
    
    console.log(`Base64解码长度: ${base64Buffer.length}`);
    console.log(`Hex解码长度: ${hexBuffer.length}`);
    console.log(`数据是否相同: ${base64Buffer.equals(hexBuffer)}`);
    
    if (!base64Buffer.equals(hexBuffer)) {
        console.log('Base64前16字节:', Array.from(base64Buffer.slice(0, 16)));
        console.log('Hex前16字节:', Array.from(hexBuffer.slice(0, 16)));
    }
}