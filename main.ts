// 电子宠物饲养游戏
// 宠物状态枚举
enum PetState {
    Happy,
    Normal,
    Sad,
    Sick,
    Dirty
}

// 游戏变量
let pet: Sprite = null
let hunger = 50
let happiness = 50
let health = 50
let cleanliness = 50
let energy = 50  // 新增：精力值
let lastUpdateTime = 0
let gameRunning = true

// 昼夜系统变量
let currentHour = 8  // 当前时间（0-23）
let isNight = false
let dayNightCycle = 0

// 根据宠物状态分类的话术数组
let happyDialogues = [
    "哇！我好开心呀！",
    "主人你真是太棒了！",
    "我觉得自己像在天堂一样！",
    "今天是美好的一天！",
    "我想和你一起跳舞！",
    "生活真是太美妙了！",
    "我爱这个世界！",
    "你是世界上最好的主人！",
    "我想唱歌给你听！",
    "每天都这么快乐就好了！"
]

let normalDialogues = [
    "今天天气真好呢！",
    "我想和你一起玩！",
    "陪我聊聊天吧~",
    "你有没有想我？",
    "我想出去散步！",
    "给我一个拥抱吧！",
    "今天过得怎么样？",
    "你看起来很棒！",
    "我们是最好的朋友！",
    "时间过得真快呀~"
]

let sadDialogues = [
    "主人，我饿了...",
    "我感觉有点难过...",
    "能陪陪我吗？",
    "我需要你的关爱...",
    "感觉好孤单啊...",
    "我想要一些关注...",
    "主人，你还爱我吗？",
    "我觉得不太开心...",
    "能给我一些食物吗？",
    "我需要你的照顾..."
]

let sickDialogues = [
    "我感觉不太舒服...",
    "主人，我生病了...",
    "我需要治疗...",
    "身体好难受啊...",
    "能帮帮我吗？",
    "我想要休息...",
    "感觉头晕晕的...",
    "主人，救救我...",
    "我需要药物...",
    "好想快点好起来..."
]

let dirtyDialogues = [
    "我觉得身上脏脏的...",
    "主人，我需要洗澡！",
    "感觉有点不干净...",
    "能帮我清洁一下吗？",
    "我想要变得干净！",
    "身上有点臭臭的...",
    "洗个澡会很舒服的！",
    "我想要闪闪发亮！",
    "清洁让我更健康！",
    "干净的感觉真好！"
]

// UI元素
let hungerBar: Sprite = null
let happinessBar: Sprite = null
let healthBar: Sprite = null
let cleanlinessBar: Sprite = null
let energyBar: Sprite = null  // 新增：精力条

// 按钮精灵
let feedButton: Sprite = null
let playButton: Sprite = null
let medicineButton: Sprite = null
let cleanButton: Sprite = null

// 创建UI种类
const UIKind = SpriteKind.create()
const DecorationKind = SpriteKind.create()

// 创建背景装饰
function createBackground() {
    updateDayNightBackground()
}

// 更新昼夜背景
function updateDayNightBackground() {
    if (isNight) {
        // 夜晚背景 - 深蓝色纯色背景
        scene.setBackgroundColor(8)
        // 添加星星效果
        for (let i = 0; i < 8; i++) {
            let star = sprites.create(image.create(1, 1), DecorationKind)
            star.image.fill(1)
            star.setPosition(randint(10, 150), randint(20, 60))
        }
    } else {
        // 白天背景 - 使用背景图片
        scene.setBackgroundImage(assets.image`background`)
        // 清除星星
        sprites.destroyAllSpritesOfKind(DecorationKind)
    }
}

// 昼夜循环系统
function updateDayNightCycle() {
    dayNightCycle++
    if (dayNightCycle >= 30) { // 每30秒一小时
        dayNightCycle = 0
        currentHour = (currentHour + 1) % 24
        
        // 判断是否为夜晚 (19:00-6:00)
        let wasNight = isNight
        isNight = currentHour >= 19 || currentHour < 6
        
        // 如果昼夜状态改变，更新背景
        if (wasNight !== isNight) {
            updateDayNightBackground()
        }
        
        // 夜晚时精力消耗加快
        if (isNight) {
            energy = Math.max(0, energy - 5)
        }
    }
}

// 初始化游戏
function initGame() {
    
    // 创建宠物精灵 - 放在屏幕中央
    pet = sprites.create(assets.image`petNormal`, SpriteKind.Player)
    pet.setPosition(80, 80)
    
    // 创建UI
    createUI()
    
    
    // 开始动画
    startPetAnimation()
    
    // 显示欢迎信息
    game.showLongText("欢迎来到电子宠物世界！\n照顾好你的宠物，让它健康快乐地成长！", DialogLayout.Center)
    game.showLongText("左:喂食 上:玩耍\n右:治疗 下:清洁", DialogLayout.Bottom)

    // 开始游戏循环
    lastUpdateTime = game.runtime()
    effects.confetti.startScreenEffect(500)
}

// 创建UI界面
function createUI() {
    // 创建背景装饰
    createBackground()
    
    // 状态条背景 - 顶部两行
    let barBg1 = sprites.create(image.create(30, 6), UIKind)
    barBg1.image.fill(15)
    barBg1.setPosition(18, 4)
    
    let barBg2 = sprites.create(image.create(30, 6), UIKind)
    barBg2.image.fill(15)
    barBg2.setPosition(50, 4)
    
    let barBg3 = sprites.create(image.create(30, 6), UIKind)
    barBg3.image.fill(15)
    barBg3.setPosition(82, 4)
    
    let barBg4 = sprites.create(image.create(30, 6), UIKind)
    barBg4.image.fill(15)
    barBg4.setPosition(114, 4)
    
    let barBg5 = sprites.create(image.create(30, 6), UIKind)
    barBg5.image.fill(15)
    barBg5.setPosition(146, 4)
    
    // 状态条 - 顶部两行
    hungerBar = sprites.create(image.create(28, 4), UIKind)
    hungerBar.setPosition(18, 4)
    
    happinessBar = sprites.create(image.create(28, 4), UIKind)
    happinessBar.setPosition(50, 4)
    
    healthBar = sprites.create(image.create(28, 4), UIKind)
    healthBar.setPosition(82, 4)
    
    cleanlinessBar = sprites.create(image.create(28, 4), UIKind)
    cleanlinessBar.setPosition(114, 4)
    
    energyBar = sprites.create(image.create(28, 4), UIKind)
    energyBar.setPosition(146, 4)
    
    updateStatusBars()
}

// 更新状态条
function updateStatusBars() {
    // 清空屏幕文本区域
    screen.fillRect(0, 0, 160, 15, 0)
    screen.fillRect(0, 105, 160, 15, 0)
    
    // 绘制状态标签 - 顶部一行
    screen.print("饥饿", 6, 2, 1)
    screen.print("快乐", 38, 2, 1)
    screen.print("健康", 70, 2, 1)
    screen.print("清洁", 102, 2, 1)
    screen.print("精力", 134, 2, 1)
    
    // 显示时间和昼夜状态
    let timeStr = currentHour + ":00"
    let dayNightStr = isNight ? "夜晚" : "白天"
    screen.print(timeStr + " " + dayNightStr, 5, 12, isNight ? 9 : 5)
    
    // 饥饿度条 (红色)
    hungerBar.image.fill(0)
    hungerBar.image.fillRect(0, 0, Math.floor(hunger * 28 / 100), 4, 2)
    
    // 快乐度条 (黄色)
    happinessBar.image.fill(0)
    happinessBar.image.fillRect(0, 0, Math.floor(happiness * 28 / 100), 4, 5)
    
    // 健康度条 (绿色)
    healthBar.image.fill(0)
    healthBar.image.fillRect(0, 0, Math.floor(health * 28 / 100), 4, 7)
    
    // 清洁度条 (蓝色)
    cleanlinessBar.image.fill(0)
    cleanlinessBar.image.fillRect(0, 0, Math.floor(cleanliness * 28 / 100), 4, 9)
    
    // 精力条 (紫色)
    energyBar.image.fill(0)
    energyBar.image.fillRect(0, 0, Math.floor(energy * 28 / 100), 4, 8)
    
    // 底部操作提示
    screen.print("左:喂食 上:玩耍 右:治疗 下:清洁", 5, 107, 1)
    screen.print("A:睡觉 B:说话", 5, 115, 1)
}

// 开始宠物动画
function startPetAnimation() {
    updatePetState()
    // 启动闲置动画
    animation.runImageAnimation(pet, assets.animation`petIdleAnimation`, 2000, true)
    
    // 随机移动
    startRandomMovement()
    
    game.onUpdateInterval(3000, () => {
        if (gameRunning) {
            updatePetState()
        }
    })
}

// 随机移动系统
function startRandomMovement() {
    game.onUpdateInterval(4000, () => {
        if (gameRunning && getCurrentPetState() != PetState.Sick) {
            // 随机选择动作
            let action = randint(1, 4)
            switch (action) {
                case 1:
                    // 小跳跃
                    petJump()
                    break
                case 2:
                    // 左右移动
                    petMove()
                    break
                case 3:
                    // 跳舞
                    petDance()
                    break
                case 4:
                    // 保持原位
                    break
            }
        }
    })
}

// 宠物跳跃
function petJump() {
    let originalY = pet.y
    pet.vy = -30
    pet.ay = 100
    
    // 使用setTimeout替代timer.after
    setTimeout(() => {
        scene.cameraShake(2, 200)
        pet.setPosition(pet.x, originalY)
        pet.vy = 0
        pet.ay = 0
    }, 800)
}

// 宠物移动
function petMove() {
    let originalX = pet.x
    let direction = randint(0, 1) == 0 ? -1 : 1
    let targetX = Math.max(30, Math.min(130, originalX + direction * 20))
    
    pet.vx = direction * 15
    
    // 使用setTimeout替代timer.after
    setTimeout(() => {
        pet.vx = 0
        // 如果移动太远，拉回中心区域
        if (pet.x < 40 || pet.x > 120) {
            pet.setPosition(80, pet.y)
        }
    }, 1000)
}

// 宠物跳舞
function petDance() {
    if (getCurrentPetState() == PetState.Happy || getCurrentPetState() == PetState.Normal) {
        animation.stopAnimation(animation.AnimationTypes.All, pet)
        pet.setImage(assets.image`petPlaying`)  // 先设置为玩耍状态图片
        animation.runImageAnimation(pet, assets.animation`petDanceAnimation`, 800, false)
        
        // 跳舞时的特效
        effects.hearts.startScreenEffect(2000)
        
        // 使用setTimeout替代timer.after
        setTimeout(() => {
            updatePetState()
        }, 3200)
    }
}

// 更新宠物状态和外观
function updatePetState() {
    let currentState = getCurrentPetState()
    
    // 停止当前动画
    animation.stopAnimation(animation.AnimationTypes.All, pet)
    
    switch (currentState) {
        case PetState.Happy:
            pet.setImage(assets.image`petPlaying`)  // 使用玩耍图片表示开心
            animation.runImageAnimation(pet, assets.animation`petHappyAnimation`, 1500, true)
            break
        case PetState.Sad:
            pet.setImage(assets.image`petSad`)
            break
        case PetState.Sick:
            pet.setImage(assets.image`petSick`)
            break
        case PetState.Dirty:
            pet.setImage(assets.image`petDirty`)
            break
        default:
            pet.setImage(assets.image`petNormal`)
            animation.runImageAnimation(pet, assets.animation`petIdleAnimation`, 2000, true)
            break
    }
}

// 获取当前宠物状态
function getCurrentPetState(): PetState {
    if (health < 30) {
        return PetState.Sick
    }
    if (cleanliness < 30) {
        return PetState.Dirty
    }
    if (hunger < 30 || happiness < 30 || energy < 30) {
        return PetState.Sad
    }
    if (hunger > 70 && happiness > 70 && health > 70 && cleanliness > 70 && energy > 70) {
        return PetState.Happy
    }
    return PetState.Normal
}

// 获取随机宠物话术 - 根据当前状态
function getRandomDialogue(): string {
    let currentState = getCurrentPetState()
    let dialogues: string[] = []
    
    switch (currentState) {
        case PetState.Happy:
            dialogues = happyDialogues
            break
        case PetState.Sad:
            dialogues = sadDialogues
            break
        case PetState.Sick:
            dialogues = sickDialogues
            break
        case PetState.Dirty:
            dialogues = dirtyDialogues
            break
        default:
            dialogues = normalDialogues
            break
    }
    
    let randomIndex = randint(0, dialogues.length - 1)
    return dialogues[randomIndex]
}

// 喂食功能
function feedPet() {
    if (hunger < 100) {
        // 显示吃东西状态
        animation.stopAnimation(animation.AnimationTypes.All, pet)
        pet.setImage(assets.image`petEating`)
        
        hunger = Math.min(100, hunger + 20)
        happiness = Math.min(100, happiness + 5)
        updateStatusBars()
        
        // 显示反馈
        game.splash("+20 饥饿度")
        pet.sayText("好香啊！谢谢主人！", 1500, false)
        
        music.playTone(262, 200)
        
        // 2秒后恢复正常状态
        setTimeout(() => {
            updatePetState()
        }, 2000)
    }
}

// 玩耍功能
function playWithPet() {
    if (happiness < 100) {
        happiness = Math.min(100, happiness + 25)
        hunger = Math.max(0, hunger - 10)
        cleanliness = Math.max(0, cleanliness - 5)
        energy = Math.max(0, energy - 5)  // 玩耍消耗精力
        updateStatusBars()
        
        // 特殊动画 - 跳舞
        petDance()
        
        // 显示反馈
        game.splash("+25 快乐度")
        
        music.playTone(330, 200)
    }
}

// 治疗功能
function healPet() {
    if (health < 100) {
        health = Math.min(100, health + 30)
        updateStatusBars()
        updatePetState()
        
        // 显示反馈
        game.splash("+30 健康度")
        
        music.playTone(392, 200)
    }
}

// 清洁功能
function cleanPet() {
    if (cleanliness < 100) {
        cleanliness = Math.min(100, cleanliness + 35)
        happiness = Math.min(100, happiness + 10)
        updateStatusBars()
        updatePetState()
        
        // 显示反馈
        game.splash("+35 清洁度")
        
        music.playTone(523, 200)
    }
}

// 睡觉功能
function petSleep() {
    if (energy < 100) {
        // 停止当前动画
        animation.stopAnimation(animation.AnimationTypes.All, pet)
        
        // 切换到睡觉状态
        pet.setImage(assets.image`petSleeping`)
        animation.runImageAnimation(pet, assets.animation`petSleepAnimation`, 2000, true)
        
        // 恢复精力
        energy = Math.min(100, energy + 40)
        health = Math.min(100, health + 10)
        
        updateStatusBars()
        
        // 显示反馈
        game.splash("+40 精力度")
        pet.sayText("呼呼...好舒服的觉...", 2000, false)
        
        music.playTone(196, 500)
        
        // 3秒后恢复正常状态
        setTimeout(() => {
            updatePetState()
        }, 3000)
    }
}

// 宠物随机说话
function petRandomTalk() {
    let dialogue = getRandomDialogue()
    pet.sayText(dialogue, 2000, false)
    music.playTone(294, 300)
}

// 按钮点击处理
sprites.onOverlap(SpriteKind.Player, UIKind, (sprite, otherSprite) => {
    // 这里不处理重叠，而是通过按键处理
})

// 控制器输入处理
controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    feedPet()
})

controller.up.onEvent(ControllerButtonEvent.Pressed, () => {
    playWithPet()
})

controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    healPet()
})

controller.down.onEvent(ControllerButtonEvent.Pressed, () => {
    cleanPet()
})

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    petSleep()
})

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    petRandomTalk()
})

// 游戏主循环 - 状态自动衰减
game.onUpdateInterval(4000, () => {
    if (gameRunning) {
        // 状态自动衰减
        hunger = Math.max(0, hunger - 3)
        happiness = Math.max(0, happiness - 2)
        health = Math.max(0, health - 1)
        cleanliness = Math.max(0, cleanliness - 2)
        energy = Math.max(0, energy - (isNight ? 3 : 2))  // 夜晚精力消耗更快
        
        // 特殊衰减规则
        if (hunger < 20) {
            health = Math.max(0, health - 2)
            happiness = Math.max(0, happiness - 2)
        }
        
        if (cleanliness < 20) {
            health = Math.max(0, health - 1)
        }
        
        if (energy < 20) {
            happiness = Math.max(0, happiness - 3)
            health = Math.max(0, health - 1)
        }
        
        pet.sayText(getRandomDialogue(), 1000, false)
        updateStatusBars()
        updatePetState()
        
        // 检查游戏结束条件
        if (health <= 0) {
            gameOver()
        }
    }
})

// 昼夜循环更新
game.onUpdateInterval(1000, () => {
    if (gameRunning) {
        updateDayNightCycle()
    }
})

// 游戏结束
function gameOver() {
    gameRunning = false
    animation.stopAnimation(animation.AnimationTypes.All, pet)
    pet.setImage(assets.image`petSad`)
    
    game.showLongText("你的宠物因为缺乏照顾而离开了...\n记得要定期喂食、玩耍、治疗和清洁哦！", DialogLayout.Center)
    
    game.over(false)
}


// 实时更新UI显示
game.onUpdateInterval(1000, () => {
    if (gameRunning) {
        updateStatusBars()
    }
})

// 启动游戏
initGame()
