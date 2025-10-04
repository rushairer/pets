const fs = require('fs');

console.log('=== 验证转换结果 ===');

const jresContent = fs.readFileSync('tilemap.g.jres', 'utf8');
const jresData = JSON.parse(jresContent);
const backupContent = fs.readFileSync('tilemap.g.jres.backup', 'utf8');
const backupData = JSON.parse(backupContent);

console.log('\n对比转换结果:');

['level1', 'level2', 'level3'].forEach(key => {
    if (jresData[key] && backupData[key]) {
        const currentData = jresData[key].data;
        const backupDataItem = backupData[key].data;
        const isMatch = currentData === backupDataItem;
        
        console.log(`${key}:`);
        console.log(`  当前长度: ${currentData.length}`);
        console.log(`  备份长度: ${backupDataItem.length}`);
        console.log(`  数据匹配: ${isMatch ? '✅' : '❌'}`);
        
        if (!isMatch) {
            console.log(`  当前前50: ${currentData.substring(0, 50)}`);
            console.log(`  备份前50: ${backupDataItem.substring(0, 50)}`);
        }
    }
});

// 同时验证tile图像
console.log('\n对比Tile图像结果:');
['myTiles.tile1', 'myTiles.tile2', 'myTiles.tile3'].forEach(key => {
    if (jresData[key] && backupData[key]) {
        const currentData = jresData[key].data;
        const backupDataItem = backupData[key].data;
        const isMatch = currentData === backupDataItem;
        
        console.log(`${key}:`);
        console.log(`  当前长度: ${currentData.length}`);
        console.log(`  备份长度: ${backupDataItem.length}`);
        console.log(`  数据匹配: ${isMatch ? '✅' : '❌'}`);
    }
});