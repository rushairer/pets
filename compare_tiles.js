const fs = require('fs');

console.log('=== 对比Tile数据 ===');

const current = JSON.parse(fs.readFileSync('tilemap.g.jres', 'utf8'));
const backup = JSON.parse(fs.readFileSync('tilemap.g.jres.backup', 'utf8'));

const tileKeys = ['myTiles.tile1', 'myTiles.tile2', 'myTiles.tile3', 'myTiles.transparency16'];

tileKeys.forEach(tileKey => {
    console.log(`\n=== 对比 ${tileKey} ===`);
    
    const currData = current[tileKey]?.data;
    const backData = backup[tileKey]?.data;
    
    if (!currData || !backData) {
        console.log('❌ 数据缺失');
        return;
    }
    
    console.log(`当前长度: ${currData.length}`);
    console.log(`备份长度: ${backData.length}`);
    console.log(`数据匹配: ${currData === backData ? '✅' : '❌'}`);
    
    if (currData !== backData) {
        console.log(`当前: ${currData.substring(0, 50)}...`);
        console.log(`备份: ${backData.substring(0, 50)}...`);
        
        // 解码对比
        const currBuffer = Buffer.from(currData, 'base64');
        const backBuffer = Buffer.from(backData, 'base64');
        
        console.log('当前buffer前16字节:', Array.from(currBuffer.slice(0, 16)));
        console.log('备份buffer前16字节:', Array.from(backBuffer.slice(0, 16)));
    }
});