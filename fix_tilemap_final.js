const fs = require('fs');

console.log('=== 最终Tilemap修复工具 ===');

// 将hex tilemap数据转换为ASCII格式
function hexTilemapToASCII(hexData) {
    // 解析hex数据
    const buffer = Buffer.from(hexData, 'hex');
    const mapWidth = buffer.readUInt16LE(0);
    const mapHeight = buffer.readUInt16LE(2);
    const mapData = Array.from(buffer.slice(4));
    
    console.log(`- 解析尺寸: ${mapWidth}x${mapHeight}`);
    console.log(`- 地图数据长度: ${mapData.length}`);
    
    // 生成ASCII头部 - 根据实际观察到的模式
    let header;
    if (mapWidth === 64 && mapHeight === 16) {
        header = '1040001000'; // level1的特殊格式
    } else if (mapWidth === 16 && mapHeight === 32) {
        header = '1010002000'; // level2格式
    } else if (mapWidth === 16 && mapHeight === 16) {
        header = '1010001000'; // level3格式
    } else {
        // 默认格式：101 + 高度编码 + 000
        const heightCode = Math.floor(mapHeight / 16).toString().padStart(4, '0');
        header = '101' + heightCode + '000';
    }
    
    console.log(`- 使用头部: ${header}`);
    
    // 生成地图数据 - 每个字节用3个ASCII字符表示
    const mapAscii = mapData.map(byte => 
        byte.toString().padStart(3, '0')
    ).join('');
    
    const fullAscii = header + mapAscii;
    console.log(`- ASCII总长度: ${fullAscii.length}`);
    
    return fullAscii;
}

// 主转换函数
function fixTilemaps() {
    try {
        // 读取源文件
        const tsContent = fs.readFileSync('tilemap.g.ts.backup', 'utf8');
        const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
        const jresData = JSON.parse(jresContent);
        
        console.log('\n🔍 提取所有hex数据...');
        
        // 提取所有hex数据块
        const hexMatches = [...tsContent.matchAll(/hex`([^`]+)`/g)];
        const validHexData = [];
        
        hexMatches.forEach((match, index) => {
            const hexData = match[1];
            if (hexData.length > 100) { // 只处理tilemap数据
                const buffer = Buffer.from(hexData, 'hex');
                if (buffer.length >= 4) {
                    const width = buffer.readUInt16LE(0);
                    const height = buffer.readUInt16LE(2);
                    validHexData.push({
                        index,
                        hexData,
                        width,
                        height
                    });
                    console.log(`Hex块${index}: ${width}x${height}`);
                }
            }
        });
        
        // 根据尺寸映射到jres键
        const sizeToKey = {
            '64x16': 'level1',
            '16x32': 'level2', 
            '16x16': 'level3'
        };
        
        let totalUpdated = 0;
        let totalMatched = 0;
        
        console.log('\n🔧 转换tilemap数据...');
        
        validHexData.forEach(hexInfo => {
            const sizeKey = `${hexInfo.width}x${hexInfo.height}`;
            const jresKey = sizeToKey[sizeKey];
            
            if (!jresKey) {
                console.log(`❌ 未知尺寸: ${sizeKey}`);
                return;
            }
            
            console.log(`\n处理 ${sizeKey} -> ${jresKey}`);
            
            if (!jresData[jresKey]) {
                console.log(`❌ 未找到jres条目: ${jresKey}`);
                return;
            }
            
            // 转换为ASCII格式
            const asciiData = hexTilemapToASCII(hexInfo.hexData);
            const newBase64 = Buffer.from(asciiData, 'ascii').toString('base64');
            const originalBase64 = jresData[jresKey].data;
            const isMatch = originalBase64 === newBase64;
            
            console.log(`- 数据匹配: ${isMatch ? '✅' : '❌'}`);
            
            if (isMatch) {
                totalMatched++;
            } else {
                console.log(`- 原始长度: ${originalBase64.length}`);
                console.log(`- 生成长度: ${newBase64.length}`);
                
                // 更新数据
                jresData[jresKey].data = newBase64;
                totalUpdated++;
                console.log('- ✅ 已更新数据');
            }
        });
        
        // 保存更新后的文件
        if (totalUpdated > 0) {
            fs.writeFileSync('tilemap.g.jres', JSON.stringify(jresData, null, 4));
            console.log(`\n✅ 已保存更新后的tilemap.g.jres文件`);
        }
        
        console.log(`\n📊 Tilemap修复总结:`);
        console.log(`- 总tilemap数: ${validHexData.length}`);
        console.log(`- 匹配数: ${totalMatched}`);
        console.log(`- 更新数: ${totalUpdated}`);
        console.log(`- 准确率: ${validHexData.length > 0 ? (totalMatched/validHexData.length*100).toFixed(1) : 0}%`);
        
        if (totalMatched === validHexData.length) {
            console.log('\n🎉 所有tilemap数据都完全正确！');
        }
        
    } catch (error) {
        console.error('修复出错:', error.message);
        console.error(error.stack);
    }
}

// 执行修复
fixTilemaps();