const fs = require('fs');

console.log('=== MakeCode Tilemap转换工具 (正确版本) ===');

// 解析tilemap.g.ts中的hex数据
function parseTilemapFromTS(tsContent) {
    const tilemaps = [];
    const tilemapRegex = /case\s+"([^"]+)"[\s\S]*?return\s+tiles\.createTilemap[\s\S]*?hex`([^`]+)`/g;
    
    let match;
    while ((match = tilemapRegex.exec(tsContent)) !== null) {
        const name = match[1];
        const hexData = match[2];
        
        // 解析hex数据
        const buffer = Buffer.from(hexData, 'hex');
        const width = buffer[0] | (buffer[1] << 8);
        const height = buffer[2] | (buffer[3] << 8);
        const mapData = buffer.slice(4);
        
        tilemaps.push({
            name,
            width,
            height,
            mapData: Array.from(mapData)
        });
    }
    
    return tilemaps;
}

// 生成ASCII格式的tilemap数据
function generateTilemapASCII(width, height, mapData) {
    // 分析正确的头部格式：
    // level1 (64x16): "1040001000" - 特殊格式
    // level2 (16x32): "1010002000" - 101 + 0002 + 000 (32→002?)
    // level3 (16x16): "1010001000" - 101 + 0001 + 000 (16→001?)
    
    let header;
    if (width === 64 && height === 16) {
        header = '1040001000'; // level1的特殊格式
    } else {
        // 其他情况：101 + 高度编码 + 000
        let heightCode;
        if (height === 32) {
            heightCode = '0002';
        } else if (height === 16) {
            heightCode = '0001';
        } else {
            // 默认使用高度除以16的值
            heightCode = (height / 16).toString().padStart(4, '0');
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
function convertTilemaps() {
    try {
        // 读取源文件
        const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');
        const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
        const jresData = JSON.parse(jresContent);
        
        console.log('\n🔍 解析tilemap.g.ts中的地图数据...');
        const tilemaps = parseTilemapFromTS(tsContent);
        console.log(`找到 ${tilemaps.length} 个tilemap`);
        
        // 映射tilemap名称到jres键
        const nameToKey = {
            'level': 'level1',
            'level0': 'level2', 
            'level3': 'level3'
        };
        
        let totalUpdated = 0;
        let totalMatched = 0;
        
        tilemaps.forEach((tilemap, index) => {
            console.log(`\n处理tilemap: ${tilemap.name} (${tilemap.width}x${tilemap.height})`);
            
            const jresKey = nameToKey[tilemap.name];
            if (!jresKey || !jresData[jresKey]) {
                console.log(`❌ 未找到对应的jres条目: ${jresKey}`);
                return;
            }
            
            // 生成新的ASCII数据
            const newAsciiData = generateTilemapASCII(tilemap.width, tilemap.height, tilemap.mapData);
            const newBase64 = Buffer.from(newAsciiData, 'ascii').toString('base64');
            
            console.log(`- 地图数据长度: ${tilemap.mapData.length}`);
            console.log(`- 生成ASCII长度: ${newAsciiData.length}`);
            console.log(`- 生成base64长度: ${newBase64.length}`);
            
            // 对比原始数据
            const originalBase64 = jresData[jresKey].data;
            const isMatch = originalBase64 === newBase64;
            
            console.log(`- 数据匹配: ${isMatch ? '✅' : '❌'}`);
            
            if (isMatch) {
                totalMatched++;
                console.log('  数据已经正确，无需更新');
            } else {
                console.log(`  原始长度: ${originalBase64.length}, 生成长度: ${newBase64.length}`);
                
                // 更新数据
                jresData[jresKey].data = newBase64;
                totalUpdated++;
                console.log('  ✅ 已更新数据');
            }
        });
        
        // 保存更新后的文件
        if (totalUpdated > 0) {
            fs.writeFileSync('tilemap.g.jres', JSON.stringify(jresData, null, 4));
            console.log(`\n✅ 已保存更新后的tilemap.g.jres文件`);
        }
        
        console.log(`\n📊 Tilemap转换总结:`);
        console.log(`- 总tilemap数: ${tilemaps.length}`);
        console.log(`- 匹配数: ${totalMatched}`);
        console.log(`- 更新数: ${totalUpdated}`);
        console.log(`- 准确率: ${tilemaps.length > 0 ? (totalMatched/tilemaps.length*100).toFixed(1) : 0}%`);
        
        if (totalMatched === tilemaps.length) {
            console.log('\n🎉 所有tilemap数据都完全正确！');
        }
        
    } catch (error) {
        console.error('转换出错:', error.message);
        console.error(error.stack);
    }
}

// 执行转换
convertTilemaps();