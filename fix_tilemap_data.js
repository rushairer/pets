const fs = require('fs');

console.log('=== MakeCode Tilemap转换工具 ===');

// 读取tilemap.g.ts文件
const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');

// 解析tilemap数据
function parseTilemaps(content) {
    const tilemaps = [];
    
    // 查找tilemap定义
    const tilemapRegex = /case\s+"([^"]+)":\s*return\s+tiles\.createTilemap\(hex`([^`]+)`/g;
    let match;
    
    while ((match = tilemapRegex.exec(content)) !== null) {
        const [, displayName, hexData] = match;
        
        // 解析hex数据
        const buffer = Buffer.from(hexData, 'hex');
        const width = buffer[0] | (buffer[1] << 8);
        const height = buffer[2] | (buffer[3] << 8);
        const mapData = buffer.slice(4);
        
        tilemaps.push({
            displayName,
            hexData,
            width,
            height,
            mapData: Array.from(mapData)
        });
        
        console.log(`找到tilemap: ${displayName} (${width}x${height})`);
    }
    
    return tilemaps;
}

// 将tilemap数据转换为base64格式
function convertTilemapToBase64(tilemap) {
    const { mapData } = tilemap;
    
    // 将数字数组转换为ASCII字符串
    const asciiString = mapData.map(n => n.toString()).join('');
    
    // 转换为base64
    const base64 = Buffer.from(asciiString, 'ascii').toString('base64');
    
    return base64;
}

// 主处理函数
function processTilemaps() {
    const tilemaps = parseTilemaps(tsContent);
    
    if (tilemaps.length === 0) {
        console.log('未找到tilemap数据');
        return;
    }
    
    // 读取现有的jres文件
    const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
    const jresData = JSON.parse(jresContent);
    
    // 处理每个tilemap
    tilemaps.forEach(tilemap => {
        const base64Data = convertTilemapToBase64(tilemap);
        
        console.log(`\n处理tilemap: ${tilemap.displayName}`);
        console.log(`- 尺寸: ${tilemap.width}x${tilemap.height}`);
        console.log(`- 地图数据长度: ${tilemap.mapData.length}`);
        console.log(`- 前20个tile: [${tilemap.mapData.slice(0, 20).join(', ')}]`);
        console.log(`- 生成的base64长度: ${base64Data.length}`);
        
        // 查找对应的jres条目
        const jresKey = Object.keys(jresData).find(key => 
            jresData[key].displayName === tilemap.displayName ||
            key.includes(tilemap.displayName)
        );
        
        if (jresKey && jresData[jresKey].mimeType === 'application/mkcd-tilemap') {
            const originalData = jresData[jresKey].data;
            const match = originalData === base64Data;
            
            console.log(`- 找到对应jres条目: ${jresKey}`);
            console.log(`- 数据匹配: ${match ? '✅' : '❌'}`);
            
            if (!match) {
                console.log(`  原始: ${originalData.substring(0, 50)}...`);
                console.log(`  生成: ${base64Data.substring(0, 50)}...`);
                
                // 更新数据
                jresData[jresKey].data = base64Data;
                console.log('  ✅ 已更新数据');
            }
        } else {
            console.log(`- ❌ 未找到对应的jres条目`);
        }
    });
    
    // 写回jres文件
    fs.writeFileSync('tilemap.g.jres', JSON.stringify(jresData, null, 4));
    console.log('\n转换完成！tilemap.g.jres 文件已更新');
}

// 执行处理
try {
    processTilemaps();
} catch (error) {
    console.error('处理出错:', error.message);
    console.error(error.stack);
}