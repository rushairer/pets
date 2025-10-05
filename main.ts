// 电子宠物饲养游戏
// 宠物状态枚举
enum PetState {
    Happy,
    Normal,
    Sad,
    Sick,
    Dirty
}

// 菜单系统枚举
enum MenuState {
    Closed,
    Open
}

enum MenuItem {
    Feed,      // 喂食
    Play,      // 玩耍
    Heal,      // 治疗
    Clean,     // 清洁
    Sleep,     // 睡觉
    Talk,      // 说话
    Work,      // 打工
    Game,      // 互动游戏
    Shop       // 购物
}

// 游戏变量
let pet: Sprite = null
let hunger = 50
let happiness = 50
let health = 50
let cleanliness = 50
let energy = 50  // 新增：精力值
let money = 100  // 新增：金钱系统
let foodCount = 3  // 新增：食物数量
let medicineCount = 2  // 新增：药物数量
let lastUpdateTime = 0
let gameRunning = true

// 昼夜系统变量
let currentHour = 8  // 当前时间（0-23）
let isNight = false
let dayNightCycle = 0

// 通用菜单样式
let menuBgColor = 9
let menuFontColor = 12
let menuFontBgColor = 0
let menuSelectedFontColor = 1
let menuSelectedFontBgColor = 2
let menuTitleColor = 15
let menuBarBgColor = 6
let menuBarFontColor = 5
let menuTitleHeight = 14
let menuTitlePositionX = 80
let menuTitlePositionY = 14
let menuBarWidth = 160
let menuBarHeight = 18
let menuBarPositionX = 80
let menuBarPositionY = 111


// 菜单系统变量
let menuState = MenuState.Closed
let selectedMenuItem = MenuItem.Feed
let menuSprites: Sprite[] = []

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
const MenuKind = SpriteKind.create()

// 菜单项数据
let menuItems = [
    { name: "喂食", icon: "🍎", action: () => feedPet() },
    { name: "玩耍", icon: "🎾", action: () => playWithPet() },
    { name: "治疗", icon: "💊", action: () => healPet() },
    { name: "清洁", icon: "🛁", action: () => cleanPet() },
    { name: "睡觉", icon: "😴", action: () => petSleep() },
    { name: "说话", icon: "💬", action: () => petRandomTalk() },
    { name: "打工", icon: "💼", action: () => petWork() },
    { name: "游戏", icon: "🎮", action: () => playMiniGame() },
    { name: "购物", icon: "🛒", action: () => openShop() }
]

// 创建背景装饰
function createBackground() {
    updateDayNightBackground()
}

// 更新昼夜背景
function updateDayNightBackground() {
    if (isNight) {
        // 夜晚背景 - 先清除背景图片，再设置深蓝色纯色背景
        scene.setBackgroundImage(null)
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
    game.showLongText("菜单:功能 方向:选择\nA:确认 B:返回", DialogLayout.Bottom)

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
    barBg1.setPosition(16, 4)
    
    let barBg2 = sprites.create(image.create(30, 6), UIKind)
    barBg2.image.fill(15)
    barBg2.setPosition(48, 4)
    
    let barBg3 = sprites.create(image.create(30, 6), UIKind)
    barBg3.image.fill(15)
    barBg3.setPosition(80, 4)
    
    let barBg4 = sprites.create(image.create(30, 6), UIKind)
    barBg4.image.fill(15)
    barBg4.setPosition(112, 4)
    
    let barBg5 = sprites.create(image.create(30, 6), UIKind)
    barBg5.image.fill(15)
    barBg5.setPosition(144, 4)
    
    // 状态条 - 顶部两行
    hungerBar = sprites.create(image.create(28, 4), UIKind)
    hungerBar.setPosition(16, 4)
    
    happinessBar = sprites.create(image.create(28, 4), UIKind)
    happinessBar.setPosition(48, 4)
    
    healthBar = sprites.create(image.create(28, 4), UIKind)
    healthBar.setPosition(80, 4)
    
    cleanlinessBar = sprites.create(image.create(28, 4), UIKind)
    cleanlinessBar.setPosition(112, 4)
    
    energyBar = sprites.create(image.create(28, 4), UIKind)
    energyBar.setPosition(144, 4)
    
    updateStatusBars()
}

// 更新状态条
function updateStatusBars() {
    // 清空屏幕文本区域
    screen.fillRect(0, 0, 160, 15, 0)
    screen.fillRect(0, 105, 160, 15, 0)
    
    // 绘制状态标签 - 顶部一行
    screen.print("饥饿", 4, 2, 1)
    screen.print("快乐", 36, 2, 1)
    screen.print("健康", 68, 2, 1)
    screen.print("清洁", 100, 2, 1)
    screen.print("精力", 132, 2, 1)
    
    // 显示时间和昼夜状态
    let timeStr = currentHour + ":00"
    let dayNightStr = isNight ? "夜晚" : "白天"
    screen.print(timeStr + " " + dayNightStr, 5, 12, isNight ? 9 : 5)
    
    // 显示金钱
    screen.print("金钱: " + money, 90, 12, 5)
    
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
    if (menuState == MenuState.Closed) {
        screen.print("按 Menu 键打开菜单", 40, 115, 1)
    }
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
    if (foodCount <= 0) {
        game.splash("没有食物了！")
        pet.sayText("主人，我饿了但是没有食物...", 2000, false)
        return
    }
    
    if (hunger < 100) {
        // 消耗食物
        foodCount--
        
        // 显示吃东西状态
        animation.stopAnimation(animation.AnimationTypes.All, pet)
        pet.setImage(assets.image`petEating`)
        
        hunger = Math.min(100, hunger + 20)
        happiness = Math.min(100, happiness + 5)
        updateStatusBars()
        
        // 显示反馈
        game.showLongText("+20 饥饿度\n(剩余食物:" + foodCount + ")",DialogLayout.Bottom)
        pet.sayText("好香啊！谢谢主人！", 1500, false)
        
        music.playTone(262, 200)
        
        // 2秒后恢复正常状态
        setTimeout(() => {
            updatePetState()
        }, 2000)
    } else {
        game.splash("宠物不饿！")
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
    if (medicineCount <= 0) {
        game.splash("没有药物了！")
        pet.sayText("主人，我生病了但是没有药物...", 2000, false)
        return
    }
    
    if (health < 100) {
        // 消耗药物
        medicineCount--
        
        health = Math.min(100, health + 30)
        updateStatusBars()
        updatePetState()
        
        // 显示反馈
        game.showLongText("+30 健康度\n(剩余药物:" + medicineCount + ")", DialogLayout.Bottom)
        pet.sayText("药物真有效！感觉好多了！", 1500, false)
        
        music.playTone(392, 200)
    } else {
        game.splash("宠物很健康！")
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



// 显示菜单
function showMenu() {
    if (menuState == MenuState.Open) return
    
    menuState = MenuState.Open
    selectedMenuItem = MenuItem.Feed
    
    // 创建全屏菜单背景
    let menuBg = sprites.create(image.create(160, 120), MenuKind)
    menuBg.image.fill(menuBgColor)  // 深蓝色外框
    menuBg.setPosition(80, 60)
    menuSprites.push(menuBg)
    
    createMenuSprites()
}


// 创建菜单精灵
function createMenuSprites() {
    // 清除旧的菜单文字精灵（保留背景）
    for (let i = menuSprites.length - 1; i >= 1; i--) {
        menuSprites[i].destroy()
        menuSprites.splice(i, 1)
    }
    
    // 创建标题精灵 - 向上移动
    let titleImg = image.create(60, menuTitleHeight)
    titleImg.print("宠物菜单", 6, 0, menuTitleColor)  // 白色文字，增加垂直间距
    let titleSprite = sprites.create(titleImg, MenuKind)
    titleSprite.setPosition(menuTitlePositionX, menuTitlePositionY)
    menuSprites.push(titleSprite)
    
    // 创建菜单项精灵 - 3x3网格，再增大行高
    for (let i = 0; i < menuItems.length; i++) {
        let row = Math.floor(i / 3)
        let col = i % 3
        let y = 35 + row * 25  // 再增加行高到25
        let x = 40 + col * 40
        
        let itemImg = image.create(30, 18)  // 再增加高度到18
        itemImg.fill(0)
        
        if (i == selectedMenuItem) {
            // 选中项：红色背景，白色文字，添加箭头
            itemImg.fill(menuSelectedFontBgColor)  // 红色背景
            itemImg.print(menuItems[i].name, 2, 2, menuSelectedFontColor)  // 白色文字，调整位置
        } else {
            // 普通项：Menu背景色，深蓝色文字
            itemImg.fill(menuFontBgColor)  // Menu背景色
            itemImg.print(menuItems[i].name, 2, 2, menuFontColor)  // 深色文字，调整位置
        }
        
        let itemSprite = sprites.create(itemImg, MenuKind)
        itemSprite.setPosition(x, y)
        menuSprites.push(itemSprite)
    }
    
    // 创建金钱和库存显示精灵 - 移到左下角
    let moneyImg = image.create(menuBarWidth, menuBarHeight)
    moneyImg.fill(menuBarBgColor)
    // 用图标替换文字：金币、鸡腿、药丸（16x16）
    // 金币
    moneyImg.drawTransparentImage(assets.image`coinIcon`, 3, 1)
    moneyImg.print("" + money, 21, 5, menuBarFontColor)
    // 鸡腿（食物）
    moneyImg.drawTransparentImage(assets.image`chickenIcon`, 60, 1)
    moneyImg.print("" + foodCount, 78, 5, menuBarFontColor)
    // 药丸（药物）
    moneyImg.drawTransparentImage(assets.image`pillIcon`, 107, 1)
    moneyImg.print("" + medicineCount, 125, 5, menuBarFontColor)
    let moneySprite = sprites.create(moneyImg, MenuKind)
    moneySprite.setPosition(menuBarPositionX, menuBarPositionY)  // 移到左下角
    menuSprites.push(moneySprite)
}

// 更新菜单显示内容
function updateMenuDisplay() {
    if (menuState == MenuState.Closed) return
    
    // 重新创建菜单精灵以反映选择变化
    createMenuSprites()
}

// 隐藏菜单
function hideMenu() {
    if (menuState == MenuState.Closed) return
    
    menuState = MenuState.Closed
    
    // 销毁所有菜单精灵
    sprites.destroyAllSpritesOfKind(MenuKind)
    menuSprites = []
    
    // 清空屏幕文字并重新绘制游戏UI
    screen.fillRect(0, 0, 160, 120, 0)
    updateStatusBars()
}

// 更新菜单选择
function updateMenuSelection() {
    if (menuState == MenuState.Closed) return
    updateMenuDisplay()
}

// 执行菜单选择
function executeMenuItem() {
    if (menuState == MenuState.Closed) return
    
    hideMenu()
    menuItems[selectedMenuItem].action()
}

// 新增功能：宠物打工
function petWork() {
    if (energy < 20) {
        game.splash("精力不足，无法工作！")
        pet.sayText("我太累了，需要休息...", 2000, false)
        return
    }
    
    // 消耗精力，获得金钱
    energy = Math.max(0, energy - 20)
    let earnedMoney = randint(10, 30)
    money += earnedMoney
    
    // 显示工作动画
    animation.stopAnimation(animation.AnimationTypes.All, pet)
    pet.setImage(assets.image`petPlaying`)  // 使用玩耍图片表示工作
    
    updateStatusBars()
    
    game.splash("工作赚取 " + earnedMoney + " 金币！")
    pet.sayText("工作真辛苦，但是赚到钱了！", 2000, false)
    
    music.playTone(440, 300)
    
    // 2秒后恢复正常状态
    setTimeout(() => {
        updatePetState()
    }, 2000)
}

// 石头剪刀布游戏变量
let gameMenuState = MenuState.Closed
let selectedGameChoice = 0
let gameMenuSprites: Sprite[] = []

// 新增功能：互动小游戏
function playMiniGame() {
    showGameMenu()
}

// 显示石头剪刀布选择菜单
function showGameMenu() {
    if (gameMenuState == MenuState.Open) return
    
    gameMenuState = MenuState.Open
    selectedGameChoice = 0
    
    // 创建游戏菜单背景
    let gameBg = sprites.create(image.create(160, 120), MenuKind)
    gameBg.image.fill(menuBgColor)
    gameBg.setPosition(80, 60)
    gameMenuSprites.push(gameBg)
    
    createGameMenuSprites()
}

// 创建石头剪刀布菜单精灵
function createGameMenuSprites() {
    // 清除旧的菜单精灵（保留背景）
    for (let i = gameMenuSprites.length - 1; i >= 1; i--) {
        gameMenuSprites[i].destroy()
        gameMenuSprites.splice(i, 1)
    }
    
    // 创建标题 - 使用统一样式
    let titleImg = image.create(80, menuTitleHeight)
    titleImg.print("石头剪刀布", 8, 0, menuTitleColor)
    let titleSprite = sprites.create(titleImg, MenuKind)
    titleSprite.setPosition(menuTitlePositionX, menuTitlePositionY)
    gameMenuSprites.push(titleSprite)
    
    // 游戏选项
    let gameChoices = ["石头", "剪刀", "布"]
    
    for (let i = 0; i < gameChoices.length; i++) {
        let x = 80
        let y = 40 + i * 25
        
        let choiceImg = image.create(50, 18)
        
        if (i == selectedGameChoice) {
            choiceImg.fill(menuSelectedFontBgColor)
            choiceImg.print(gameChoices[i], 12, 2, menuSelectedFontColor)
        } else {
            choiceImg.fill(menuFontBgColor)
            choiceImg.print(gameChoices[i], 12, 2, menuFontColor)
        }
        
        let choiceSprite = sprites.create(choiceImg, MenuKind)
        choiceSprite.setPosition(x, y)
        gameMenuSprites.push(choiceSprite)
    }
    
    // 操作提示 - 使用统一样式
    let hintImg = image.create(menuBarWidth, menuBarHeight)
    hintImg.fill(menuBarBgColor)
    hintImg.print("上下选择 A确认 B返回", 3, 3, menuBarFontColor)
    let hintSprite = sprites.create(hintImg, MenuKind)
    hintSprite.setPosition(menuBarPositionX, menuBarPositionY)
    gameMenuSprites.push(hintSprite)
}

// 更新游戏菜单显示
function updateGameMenuDisplay() {
    if (gameMenuState == MenuState.Closed) return
    createGameMenuSprites()
}

// 隐藏游戏菜单
function hideGameMenu() {
    if (gameMenuState == MenuState.Closed) return
    
    gameMenuState = MenuState.Closed
    
    // 销毁游戏菜单精灵
    for (let sprite of gameMenuSprites) {
        sprite.destroy()
    }
    gameMenuSprites = []
    
    updateStatusBars()
}

// 执行石头剪刀布游戏
function executeGameChoice() {
    if (gameMenuState == MenuState.Closed) return
    
    let playerChoice = selectedGameChoice + 1  // 1=石头, 2=剪刀, 3=布
    let petChoice = randint(1, 3)
    let choices = ["", "石头", "剪刀", "布"]
    
    hideGameMenu()
    
    pet.sayText("我选择" + choices[petChoice] + "！", 2000, false)
    
    let result = ""
    let reward = 0
    
    if (playerChoice == petChoice) {
        result = "平局！"
        reward = 5
    } else if ((playerChoice == 1 && petChoice == 2) ||
               (playerChoice == 2 && petChoice == 3) ||
               (playerChoice == 3 && petChoice == 1)) {
        result = "你赢了！"
        reward = 15
        happiness = Math.min(100, happiness + 10)
    } else {
        result = "我赢了！"
        reward = 3
        happiness = Math.min(100, happiness + 5)
    }
    
    money += reward
    updateStatusBars()
    
    game.splash(result + " 获得 " + reward + " 金币！")
    music.playTone(523, 400)
}

// 购物菜单变量
let shopMenuState = MenuState.Closed
let selectedShopItem = 0
let shopMenuSprites: Sprite[] = []

// 商店商品数据
let shopItems = [
    { name: "食物", price: 20, type: "food" },
    { name: "药物", price: 30, type: "medicine" }
]

// 新增功能：购物系统
function openShop() {
    showShopMenu()
}

// 显示购物菜单
function showShopMenu() {
    if (shopMenuState == MenuState.Open) return
    
    shopMenuState = MenuState.Open
    selectedShopItem = 0
    
    // 创建购物菜单背景
    let shopBg = sprites.create(image.create(160, 120), MenuKind)
    shopBg.image.fill(menuBgColor)
    shopBg.setPosition(80, 60)
    shopMenuSprites.push(shopBg)
    
    createShopMenuSprites()
}

// 创建购物菜单精灵
function createShopMenuSprites() {
    // 清除旧的菜单精灵（保留背景）
    for (let i = shopMenuSprites.length - 1; i >= 1; i--) {
        shopMenuSprites[i].destroy()
        shopMenuSprites.splice(i, 1)
    }
    
    // 创建标题 - 使用统一样式
    let titleImg = image.create(70, menuTitleHeight)
    titleImg.print("宠物商店", 8, 0, menuTitleColor)
    let titleSprite = sprites.create(titleImg, MenuKind)
    titleSprite.setPosition(menuTitlePositionX, menuTitlePositionY)
    shopMenuSprites.push(titleSprite)
    
    // 显示当前金钱 - 使用统一Bar样式
    let moneyImg = image.create(menuBarWidth, menuBarHeight)
    moneyImg.print("当前金钱: " + money, 5, 3, menuFontColor)
    let moneySprite = sprites.create(moneyImg, MenuKind)
    moneySprite.setPosition(menuBarPositionX, 30)
    shopMenuSprites.push(moneySprite)
    
    // 商品选项
    for (let i = 0; i < shopItems.length; i++) {
        let x = 80
        let y = 50 + i * 25
        
        let itemImg = image.create(60, 18)
        
        if (i == selectedShopItem) {
            itemImg.fill(menuSelectedFontBgColor)
            itemImg.print(shopItems[i].name, 15, 2, menuSelectedFontColor)
        } else {
            itemImg.fill(menuFontBgColor)
            itemImg.print(shopItems[i].name, 15, 2, menuFontColor)
        }
        
        let itemSprite = sprites.create(itemImg, MenuKind)
        itemSprite.setPosition(x, y)
        shopMenuSprites.push(itemSprite)
    }
    
    // 显示选中商品的价格 - 使用统一Bar样式
    let priceImg = image.create(menuBarWidth, menuBarHeight)
    priceImg.print("价格: " + shopItems[selectedShopItem].price + " 金币", 5, 3, menuFontColor)
    let priceSprite = sprites.create(priceImg, MenuKind)
    priceSprite.setPosition(menuBarPositionX, 95)
    shopMenuSprites.push(priceSprite)
    
    // 操作提示 - 使用统一Bar样式
    let hintImg = image.create(menuBarWidth, menuBarHeight)
    hintImg.fill(menuBarBgColor)
    hintImg.print("上下选择 A购买 B返回", 3, 3, menuBarFontColor)
    let hintSprite = sprites.create(hintImg, MenuKind)
    hintSprite.setPosition(menuBarPositionX, menuBarPositionY)
    shopMenuSprites.push(hintSprite)
}

// 更新购物菜单显示
function updateShopMenuDisplay() {
    if (shopMenuState == MenuState.Closed) return
    createShopMenuSprites()
}

// 隐藏购物菜单
function hideShopMenu() {
    if (shopMenuState == MenuState.Closed) return
    
    shopMenuState = MenuState.Closed
    
    // 销毁购物菜单精灵
    for (let sprite of shopMenuSprites) {
        sprite.destroy()
    }
    shopMenuSprites = []
    
    updateStatusBars()
}

// 执行购买
function executePurchase() {
    if (shopMenuState == MenuState.Closed) return
    
    let item = shopItems[selectedShopItem]
    
    if (money >= item.price) {
        money -= item.price
        
        if (item.type == "food") {
            foodCount++
            game.showLongText("购买食物成功！\n剩余金钱:" + money, DialogLayout.Bottom)
        } else if (item.type == "medicine") {
            medicineCount++
            game.showLongText("购买药物成功！\n剩余金钱:" + money, DialogLayout.Bottom)
        }
        
        music.playTone(659, 300)
        updateStatusBars()
        updateShopMenuDisplay()  // 更新显示金钱
    } else {
        game.splash("金钱不足！")
        music.playTone(175, 500)
    }
}

// 按钮点击处理
sprites.onOverlap(SpriteKind.Player, UIKind, (sprite, otherSprite) => {
    // 这里不处理重叠，而是通过按键处理
})

// 新的控制器输入处理 - 菜单系统
controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Closed) {
        showMenu()
    } else {
        hideMenu()
    }
})

controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Open) {
        if (selectedMenuItem > 0) {
            selectedMenuItem--
            updateMenuSelection()
        }
    }
})

controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Open) {
        if (selectedMenuItem < menuItems.length - 1) {
            selectedMenuItem++
            updateMenuSelection()
        }
    }
})

controller.up.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Open) {
        if (selectedMenuItem >= 3) {
            selectedMenuItem -= 3
            updateMenuSelection()
        }
    } else if (gameMenuState == MenuState.Open) {
        if (selectedGameChoice > 0) {
            selectedGameChoice--
            updateGameMenuDisplay()
        }
    } else if (shopMenuState == MenuState.Open) {
        if (selectedShopItem > 0) {
            selectedShopItem--
            updateShopMenuDisplay()
        }
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Open) {
        if (selectedMenuItem + 3 < menuItems.length) {
            selectedMenuItem += 3
            updateMenuSelection()
        }
    } else if (gameMenuState == MenuState.Open) {
        if (selectedGameChoice < 2) {
            selectedGameChoice++
            updateGameMenuDisplay()
        }
    } else if (shopMenuState == MenuState.Open) {
        if (selectedShopItem < shopItems.length - 1) {
            selectedShopItem++
            updateShopMenuDisplay()
        }
    }
})

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Open) {
        executeMenuItem()
    } else if (gameMenuState == MenuState.Open) {
        executeGameChoice()
    } else if (shopMenuState == MenuState.Open) {
        executePurchase()
    }
})

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuState == MenuState.Open) {
        hideMenu()
    } else if (gameMenuState == MenuState.Open) {
        hideGameMenu()
    } else if (shopMenuState == MenuState.Open) {
        hideShopMenu()
    }
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
