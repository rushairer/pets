// MakeCode JRES 图像格式编解码器
// 基于用户提供的测试数据反推的算法

function encodeImageToJres(pixelMatrix) {
    const height = pixelMatrix.length;
    const width = pixelMatrix[0].length;
    
    // 将2D矩阵转换为1D数组
    const pixels = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = pixelMatrix[y][x];
            pixels.push(pixel === '.' ? 0 : parseInt(pixel));
        }
    }
    
    console.log('原始像素数组:', pixels);
    
    // 找出所有非零像素
    const nonZeroPixels = [];
    for (let i = 0; i < pixels.length; i++) {
        if (pixels[i] !== 0) {
            nonZeroPixels.push({value: pixels[i], position: i});
        }
    }
    
    console.log('非零像素:', nonZeroPixels);
    
    // 构建二进制数据 - 固定20字节长度
    const buffer = Buffer.alloc(20);
    let offset = 0;
    
    // Magic number (0x87 0x04)
    buffer[offset++] = 0x87;
    buffer[offset++] = 0x04;
    
    // 宽度 (小端序)
    buffer.writeUInt16LE(width, offset);
    offset += 2;
    
    // 高度 (小端序)
    buffer.writeUInt16LE(height, offset);
    offset += 2;
    
    // 保留字节
    buffer[offset++] = 0x00;
    buffer[offset++] = 0x00;
    
    // 压缩数据：每个非零像素用2字节表示 [值, 位置]
    for (const pixel of nonZeroPixels) {
        buffer[offset++] = pixel.value;
        buffer[offset++] = pixel.position;
    }
    
    // 剩余字节填充0
    while (offset < buffer.length) {
        buffer[offset++] = 0x00;
    }
    
    return buffer.toString('base64');
}

function decodeJresImage(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 解析头部
    const magic1 = buffer[0];
    const magic2 = buffer[1];
    const width = buffer.readUInt16LE(2);
    const height = buffer.readUInt16LE(4);
    
    console.log(`解码：Magic=${magic1},${magic2} 尺寸=${width}x${height}`);
    
    // 初始化像素数组
    const pixels = new Array(width * height).fill(0);
    
    // 解析压缩数据 - 从字节8开始，每2字节一组
    let offset = 8;
    while (offset < buffer.length - 1) {
        const value = buffer[offset];
        const position = buffer[offset + 1];
        
        if (value === 0 && position === 0) break; // 遇到填充数据
        
        console.log(`设置位置${position}为值${value}`);
        pixels[position] = value;
        offset += 2;
    }
    
    // 转换为2D矩阵
    const matrix = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const pixel = pixels[y * width + x];
            row.push(pixel === 0 ? '.' : pixel.toString());
        }
        matrix.push(row);
    }
    
    return matrix;
}

// 测试用户提供的数据
console.log('=== 测试用户提供的数据 ===');
const testInput = [
    ['2', '.', '.'],
    ['.', '.', '.'],
    ['.', '.', '.']
];

console.log('输入图像:');
testInput.forEach(row => console.log(row.join(' ')));

const encoded = encodeImageToJres(testInput);
console.log('\n编码结果:', encoded);
console.log('预期结果: hwQDAAMAAAACAAAAAAAAAAAAAAA=');
console.log('匹配:', encoded === 'hwQDAAMAAAACAAAAAAAAAAAAAAA=');

console.log('\n=== 解码验证 ===');
const decoded = decodeJresImage('hwQDAAMAAAACAAAAAAAAAAAAAAA=');
console.log('解码结果:');
decoded.forEach(row => console.log(row.join(' ')));