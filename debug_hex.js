const fs = require("fs");
const tsContent = fs.readFileSync("tilemap.g.ts.backup", "utf8");
const level2Match = tsContent.match(/case "level2":[^}]+tiles: hex\`([^\`]+)\`/s);
if (level2Match) {
    const hexData = level2Match[1].replace(/\s+/g, "").toLowerCase();
    console.log("Level2 hex长度:", hexData.length);
    const bytes = [];
    for (let i = 0; i < hexData.length; i += 2) {
        bytes.push(parseInt(hexData.substring(i, i + 2), 16));
    }
    console.log("前30个字节:", bytes.slice(0, 30));
    console.log("第28个字节:", bytes[28], "应该生成ASCII:", bytes[28].toString().padStart(3, "0"));
}
