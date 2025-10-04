const fs = require('fs');

console.log('=== MakeCode 资源转换验证工具 ===');

// 验证F4图像格式
function verifyF4Image(buffer, expectedWidth, expectedHeight) {
    if (buffer.length < 6) return { valid: false, reason: '数据长度不足' };
    
    const magic1 = buffer[0];
    const magic2 = buffer[1];
    const width = buffer[2] | (buffer[3] << 8);
    const height = buffer[4] | (buffer[5] << 8);
    
    if (magic1 !== 135 || magic2 !== 4) {
        return { valid: false, reason: `魔数错误: [${magic1}, ${magic2}]` };
    }
    
    if (width !== expectedWidth || height !== expectedHeight) {
        return { valid: false, reason: `尺寸错误: ${width}x${height}, 期望: ${expectedWidth}x${expectedHeight}` };
    }
    
    const expectedDataLength = (width >= 16 || height >= 16) ? 
        Math.ceil(width * height / 2) : // 4位打包
        (width * height * 2); // 稀疏存储最大长度
    
    const actualDataLength = buffer.length - 6;
    
    return { 
        valid: true, 
        width, 
        height, 
        dataLength: actualDataLength,
        format: (width >= 16 || height >= 16) ? '4位打包' : '稀疏存储'
    };
}

// 验证Tilemap格式
function verifyTilemap(buffer, expectedWidth, expectedHeight) {
    const asciiData = buffer.toString('ascii');
    const expectedLength = expectedWidth * expectedHeight;
    
    if (asciiData.length !== expectedLength) {
        return { 
            valid: false, 
            reason: `ASCII长度错误: ${asciiData.length}, 期望: ${expectedLength}` 
        };
    }
    
    // 检查是否都是数字字符
    const isAllDigits = /^[0-9]+$/.test(asciiData);
    if (!isAllDigits) {
        return { valid: false, reason: '包含非数字字符' };
    }
    
    return { 
        valid: true, 
        width: expectedWidth, 
        height: expectedHeight, 
        dataLength: asciiData.length 
    };
}

// 从hex数据解析tilemap尺寸
function parseTilemapSize(hexString) {
    const buffer = Buffer.from(hexString, 'hex');
    const width = buffer[0] | (buffer[1] << 8);
    const height = buffer[2] | (buffer[3] << 8);
    return { width, height };
}

// 主验证函数
function verifyAllConversions() {
    const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
    const jresData = JSON.parse(jresContent);
    const tsContent = fs.readFileSync('tilemap.g.ts', 'utf8');
    
    let totalTests = 0;
    let passedTests = 0;
    
    console.log('\n🖼️ Tile图像验证:');
    
    // 验证tile图像
    const tileTests = [
        { key: 'myTiles.tile1', name: 'myTile', expectedSize: [16, 16] },
        { key: 'myTiles.tile2', name: 'myTile0', expectedSize: [16, 16] },
        { key: 'myTiles.tile3', name: 'myTile1', expectedSize: [16, 16] }
    ];
    
    tileTests.forEach(test => {
        totalTests++;
        const tileData = jresData[test.key];
        
        if (!tileData) {
            console.log(`❌ ${test.name}: 未找到数据`);
            return;
        }
        
        const buffer = Buffer.from(tileData.data, 'base64');
        const result = verifyF4Image(buffer, test.expectedSize[0], test.expectedSize[1]);
        
        if (result.valid) {
            console.log(`✅ ${test.name}: ${result.width}x${result.height}, ${result.format}, ${result.dataLength}字节`);
            passedTests++;
        } else {
            console.log(`❌ ${test.name}: ${result.reason}`);
        }
    });
    
    console.log('\n🗺️ Tilemap验证:');
    
    // 验证tilemap
    const tilemapTests = [
        { key: 'level1', name: 'level', hexPattern: 'hex`4000100000000000' },
        { key: 'level2', name: 'level0', hexPattern: 'hex`100020000000000000000000' },
        { key: 'level3', name: 'level3', hexPattern: 'hex`1000100000000000' }
    ];
    
    tilemapTests.forEach(test => {
        totalTests++;
        const tilemapData = jresData[test.key];
        
        if (!tilemapData) {
            console.log(`❌ ${test.name}: 未找到数据`);
            return;
        }
        
        // 从ts文件中提取hex数据来确定尺寸
        const hexRegex = new RegExp(`case\\s+"${test.name}"[\\s\\S]*?hex\`([^\`]+)\``);
        const hexMatch = hexRegex.exec(tsContent);
        
        if (!hexMatch) {
            console.log(`❌ ${test.name}: 未找到hex数据`);
            return;
        }
        
        const hexData = hexMatch[1];
        const { width, height } = parseTilemapSize(hexData);
        
        const buffer = Buffer.from(tilemapData.data, 'base64');
        const result = verifyTilemap(buffer, width, height);
        
        if (result.valid) {
            console.log(`✅ ${test.name}: ${result.width}x${result.height}, ${result.dataLength}字符`);
            passedTests++;
        } else {
            console.log(`❌ ${test.name}: ${result.reason}`);
        }
    });
    
    console.log(`\n📊 总验证结果:`);
    console.log(`- 总测试数: ${totalTests}`);
    console.log(`- 通过数: ${passedTests}`);
    console.log(`- 准确率: ${totalTests > 0 ? (passedTests/totalTests*100).toFixed(1) : 0}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 所有转换都完全正确！');
    } else {
        console.log(`\n⚠️ 还有 ${totalTests - passedTests} 个测试需要修复`);
    }
}

// 执行验证
try {
    verifyAllConversions();
} catch (error) {
    console.error('验证出错:', error.message);
    console.error(error.stack);
}