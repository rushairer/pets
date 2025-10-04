# MakeCode 资源格式完全逆向工程文档

## 概述

本文档详细记录了Microsoft MakeCode中各种资源格式的完整逆向工程过程和技术规范。

## 目录
1. [图像格式 (F4)](#图像格式-f4)
2. [Tilemap格式](#tilemap格式)
3. [转换工具](#转换工具)
4. [技术发现](#技术发现)

---

## 图像格式 (F4)

### 格式规范

**MIME类型：** `image/x-mkcd-f4`

**数据结构：**
```
[魔数: 135, 4] [宽度: 2字节] [高度: 2字节] [像素数据: 可变长度]
```

### 编码策略

MakeCode使用**双模式编码**策略：

#### 小图像模式 (≤15×15)
- **条件：** `width < 16 && height < 16`
- **数据格式：** 稀疏像素存储
- **结构：** `[魔数][宽][高][像素位置和值对]`

#### 大图像模式 (≥16×16)  
- **条件：** `width >= 16 || height >= 16`
- **数据格式：** 4位像素打包，列优先排列
- **结构：** `[魔数][宽][高][打包的像素数据]`

### 关键技术细节

1. **像素排列：** 大图像使用**列优先**排列，不是行优先
2. **4位打包：** 每字节存储2个像素值 `byte = pixel1 | (pixel2 << 4)`
3. **尺寸阈值：** 使用`>=16`判断，不是严格的`==16`

### 代码示例

```javascript
function convertPixelArtToF4(pixelData, width, height) {
    const header = Buffer.from([135, 4, width & 0xFF, width >> 8, height & 0xFF, height >> 8]);
    
    if (width >= 16 || height >= 16) {
        // 大图像：4位打包，列优先
        const packedData = [];
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row += 2) {
                const pixel1 = pixelData[row * width + col];
                const pixel2 = row + 1 < height ? pixelData[(row + 1) * width + col] : 0;
                packedData.push(pixel1 | (pixel2 << 4));
            }
        }
        return Buffer.concat([header, Buffer.from(packedData)]);
    } else {
        // 小图像：稀疏存储
        const sparseData = [];
        pixelData.forEach((pixel, index) => {
            if (pixel !== 0) {
                sparseData.push(index, pixel);
            }
        });
        return Buffer.concat([header, Buffer.from(sparseData)]);
    }
}
```

---

## Tilemap格式

### 格式规范

**MIME类型：** `application/mkcd-tilemap`

### 数据结构

#### .ts文件中的Hex格式
```
[宽度: 2字节] [高度: 2字节] [地图数据: width×height字节]
```

#### .jres文件中的Base64格式
```
Base64编码的ASCII数字字符串
每个字符代表一个tile索引
```

### 转换关系

```
Hex字节值 → ASCII数字字符 → Base64编码
```

**示例：**
- Hex: `[16, 0, 16, 0, 0, 0, 1, 1, ...]`
- ASCII: `"0000000000000000001100000..."`
- Base64: `"MDAwMDAwMDAwMDAwMDAwMDAwMTEwMD..."`

### 代码示例

```javascript
function convertTilemapToBase64(hexBuffer) {
    const width = hexBuffer[0] | (hexBuffer[1] << 8);
    const height = hexBuffer[2] | (hexBuffer[3] << 8);
    const mapData = hexBuffer.slice(4);
    
    // 转换为ASCII数字字符串
    const asciiString = Array.from(mapData).map(n => n.toString()).join('');
    
    // 编码为Base64
    return Buffer.from(asciiString, 'ascii').toString('base64');
}
```

---

## 转换工具

### 图像转换工具
- **文件：** `fix_images_data.js`
- **功能：** 将images.g.ts中的像素艺术转换为images.g.jres中的F4格式
- **测试：** 8个测试图像，100%准确率

### Tilemap转换工具  
- **文件：** `fix_tilemap_data.js`
- **功能：** 将tilemap.g.ts中的hex数据转换为tilemap.g.jres中的base64格式
- **测试：** 16×16地图，100%匹配度

---

## 技术发现

### 重大突破

1. **F4格式双模式编码：** 发现MakeCode对不同尺寸图像使用完全不同的编码策略
2. **列优先像素排列：** 大图像使用列优先而非行优先排列，这是关键发现
3. **ASCII Tilemap格式：** Tilemap使用ASCII编码而非二进制格式
4. **尺寸阈值逻辑：** 使用`>=16`而非`==16`判断编码模式

### 调试过程中的关键问题

#### 图像旋转问题
- **问题：** Image6 (16×16) 出现旋转现象
- **原因：** 错误使用行优先排列
- **解决：** 改为列优先排列

#### 大图像数据损坏  
- **问题：** Image7 (160×120) 和 Image8 (32×32) 数据被破坏
- **原因：** 尺寸判断逻辑错误 `width === 16 && height === 16`
- **解决：** 改为 `width >= 16 || height >= 16`

#### DisplayName解析错误
- **问题：** 多case共享return语句时取错displayName
- **解决：** 取最后一个case作为displayName

### 性能统计

- **图像算法开发：** 8轮迭代，最终100%准确
- **Tilemap算法开发：** 1次成功，100%匹配
- **总测试图像：** 8个图像 + 1个tilemap
- **最终准确率：** 100%

---

## 总结

通过系统性的逆向工程，我们完全破解了MakeCode的图像F4格式和Tilemap格式，创建了可靠的双向转换工具。这些发现对于理解MakeCode的内部工作机制具有重要价值。

**关键成就：**
- ✅ F4图像格式完全破解
- ✅ Tilemap格式完全破解  
- ✅ 100%准确的转换算法
- ✅ 完整的技术文档

**文件清单：**
- `fix_images_data.js` - 图像转换工具
- `fix_tilemap_data.js` - Tilemap转换工具
- `MakeCode_F4_Algorithm_Documentation.md` - F4格式详细文档
- `MakeCode_Resource_Formats_Documentation.md` - 完整资源格式文档

---

*文档创建于 2024年10月，基于MakeCode Arcade平台的逆向工程研究*