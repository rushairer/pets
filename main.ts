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

/**
 * 难度枚举
 */
enum Difficulty {
    Easy,    // 16000ms 衰减
    Normal,  // 8000ms 衰减
    Hard     // 4000ms 衰减
}

const VERSION = "v1.1.0"

// 常量，每多少秒一小时
const SECONDS_PER_HOUR = 30

// DEBUG 开关（发布前改为 false 关闭调试功能）
const DEBUG_MODE = true
let lastDebugResetTime = 0  // 调试重置去抖时间戳
let lastCheatTime = 0       // 金手指加钱去抖时间戳

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
// 睡眠模式标志：通过菜单进入睡觉后置为 true，按 B 唤醒或精力满则结束
const SLEEP_MAX_MS = 30000
let sleeping = false
let sleepSayToggle = true

// 新增：难度与昵称配置
let currentDifficulty: Difficulty = Difficulty.Normal
let petName = "小可爱"
const nameCandidates = ["小米", "可可", "豆豆", "皮皮", "团子", "球球", "花生", "奶糖", "乐乐", "萌萌", "春生"]
let configMenuState = MenuState.Closed
let selectedDifficultyIndex = 1   // 默认普通
let nameMenuState = MenuState.Closed
let selectedNameIndex = 0
// 昵称随机：洗牌序列，保证全量均匀覆盖并避免短期重复
let nameRandomOrder: number[] = []
let nameRandomPos = 0
function rebuildNameRandomOrder() {
    nameRandomOrder = []
    for (let i = 0; i < nameCandidates.length; i++) nameRandomOrder.push(i)
    // Fisher-Yates 洗牌
    for (let i = nameRandomOrder.length - 1; i > 0; i--) {
        const j = randint(0, i)
        const t = nameRandomOrder[i]
        nameRandomOrder[i] = nameRandomOrder[j]
        nameRandomOrder[j] = t
    }
    nameRandomPos = 0
}
function getNextRandomNameIndex(): number {
    if (nameCandidates.length <= 0) return 0
    if (nameRandomOrder.length != nameCandidates.length || nameRandomPos >= nameRandomOrder.length) {
        rebuildNameRandomOrder()
    }
    const idx = nameRandomOrder[nameRandomPos]
    nameRandomPos++
    return idx
}

// 存档功能
const SAVE_FLAG_KEY = "pet_saved_flag"
// 首次配置完成标记：1=已完成；0或空=未完成（需弹出难度/昵称菜单）
const CONFIG_DONE_KEY = "pet_config_done"

// 将状态重置为默认初始值（用于结束后或首次启动）
function resetDefaults() {
    hunger = 50
    happiness = 50
    health = 50
    cleanliness = 50
    energy = 50
    money = 100
    foodCount = 3
    medicineCount = 2
    // 初始化等级与经验
    level = 1
    xp = 0

    // 计数与领奖状态清零
    dayCounter = 0
    weekIndex = 0
    weeklyDayCounter = 0
    dailyFeed = 0
    dailyPlay = 0
    dailyClean = 0
    dailyHeal = 0
    dailyWork = 0
    weeklyWork = 0
    weeklyRpsWin = 0
    claimed_d_feed3 = false
    claimed_d_play2 = false
    claimed_d_clean1 = false
    claimed_d_heal1 = false
    claimed_d_work1 = false
    claimed_w_work5 = false
    claimed_w_rps3 = false
    claimed_w_work10 = false
    claimed_w_rps5 = false
    claimed_a_lvl3 = false
    claimed_a_lvl5 = false
    claimed_a_money500 = false
    claimed_a_lvl10 = false
    claimed_a_lvl15 = false
    claimed_a_money1000 = false
    claimed_a_money2000 = false

    // 更高等级与金钱成就重置
    claimed_a_money5000 = false
    claimed_a_lvl20 = false
    claimed_a_lvl25 = false
    claimed_a_lvl30 = false
    claimed_a_lvl35 = false
    claimed_a_lvl40 = false
    claimed_a_lvl45 = false
    claimed_a_lvl50 = false
    // 累计500次成就重置
    claimed_a_feed500 = false
    claimed_a_play500 = false
    claimed_a_heal500 = false
    claimed_a_clean500 = false
    claimed_a_work500 = false
    claimed_a_game500 = false
    claimed_a_shop500 = false
    claimed_a_sleep500 = false

    // 累计计数清零
    // 新增成就Setup2
    totalFeed = 0
    totalPlay = 0
    totalHeal = 0
    totalClean = 0
    totalWork = 0
    totalGame = 0
    totalShop = 0
    totalSleep = 0
    totalExplore = 0

    currentHour = 8
    isNight = false
    dayNightCycle = 0
}

function saveProgress() {
    // 标记已有存档
    settings.writeString(SAVE_FLAG_KEY, "1")
    // 基础状态
    settings.writeNumber("pet_hunger", hunger)
    settings.writeNumber("pet_happiness", happiness)
    settings.writeNumber("pet_health", health)
    settings.writeNumber("pet_cleanliness", cleanliness)
    settings.writeNumber("pet_energy", energy)
    // 经济与库存
    settings.writeNumber("pet_money", money)
    settings.writeNumber("pet_foodCount", foodCount)
    settings.writeNumber("pet_medicineCount", medicineCount)
    // 昼夜
    settings.writeNumber("pet_currentHour", currentHour)
    settings.writeNumber("pet_isNight", isNight ? 1 : 0)
    settings.writeNumber("pet_dayNightCycle", dayNightCycle)
    // 难度与昵称
    settings.writeNumber("game_difficulty", currentDifficulty)
    settings.writeString("pet_name", petName)
    // 等级与经验
    settings.writeNumber("player_level", level)
    settings.writeNumber("player_xp", xp)
    // 任务与成就 - 计数/索引/领奖标记
    settings.writeNumber("day_counter", dayCounter)
    settings.writeNumber("week_index", weekIndex)
    settings.writeNumber("weekly_day_counter", weeklyDayCounter)
    settings.writeNumber("daily_feed", dailyFeed)
    settings.writeNumber("daily_play", dailyPlay)
    settings.writeNumber("daily_clean", dailyClean)
    settings.writeNumber("daily_heal", dailyHeal)
    settings.writeNumber("daily_work", dailyWork)
    settings.writeNumber("weekly_work", weeklyWork)
    settings.writeNumber("weekly_rps_win", weeklyRpsWin)

    // 保存累计计数
    // 新增成就Setup5
    settings.writeNumber("total_feed", totalFeed)
    settings.writeNumber("total_play", totalPlay)
    settings.writeNumber("total_heal", totalHeal)
    settings.writeNumber("total_clean", totalClean)
    settings.writeNumber("total_work", totalWork)
    settings.writeNumber("total_game", totalGame)
    settings.writeNumber("total_shop", totalShop)
    settings.writeNumber("total_sleep", totalSleep)
    settings.writeNumber("total_explore", totalExplore)

    settings.writeNumber("claimed_d_feed3", claimed_d_feed3 ? 1 : 0)
    settings.writeNumber("claimed_d_play2", claimed_d_play2 ? 1 : 0)
    settings.writeNumber("claimed_d_clean1", claimed_d_clean1 ? 1 : 0)
    settings.writeNumber("claimed_d_heal1", claimed_d_heal1 ? 1 : 0)
    settings.writeNumber("claimed_d_work1", claimed_d_work1 ? 1 : 0)
    settings.writeNumber("claimed_w_work5", claimed_w_work5 ? 1 : 0)
    settings.writeNumber("claimed_w_rps3", claimed_w_rps3 ? 1 : 0)
    settings.writeNumber("claimed_w_work10", claimed_w_work10 ? 1 : 0)
    settings.writeNumber("claimed_w_rps5", claimed_w_rps5 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl3", claimed_a_lvl3 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl5", claimed_a_lvl5 ? 1 : 0)
    settings.writeNumber("claimed_a_money500", claimed_a_money500 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl10", claimed_a_lvl10 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl15", claimed_a_lvl15 ? 1 : 0)
    settings.writeNumber("claimed_a_money1000", claimed_a_money1000 ? 1 : 0)
    settings.writeNumber("claimed_a_money2000", claimed_a_money2000 ? 1 : 0)
    // 新增更高等级与金钱成就存档
    settings.writeNumber("claimed_a_money5000", claimed_a_money5000 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl20", claimed_a_lvl20 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl25", claimed_a_lvl25 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl30", claimed_a_lvl30 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl35", claimed_a_lvl35 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl40", claimed_a_lvl40 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl45", claimed_a_lvl45 ? 1 : 0)
    settings.writeNumber("claimed_a_lvl50", claimed_a_lvl50 ? 1 : 0)
    // 保存累计500次成就领奖标记
    // 新增成就Setup7
    settings.writeNumber("claimed_a_feed500", claimed_a_feed500 ? 1 : 0)
    settings.writeNumber("claimed_a_play500", claimed_a_play500 ? 1 : 0)
    settings.writeNumber("claimed_a_heal500", claimed_a_heal500 ? 1 : 0)
    settings.writeNumber("claimed_a_clean500", claimed_a_clean500 ? 1 : 0)
    settings.writeNumber("claimed_a_work500", claimed_a_work500 ? 1 : 0)
    settings.writeNumber("claimed_a_game500", claimed_a_game500 ? 1 : 0)
    settings.writeNumber("claimed_a_shop500", claimed_a_shop500 ? 1 : 0)
    settings.writeNumber("claimed_a_sleep500", claimed_a_sleep500 ? 1 : 0)
    settings.writeNumber("claimed_a_adventure500", claimed_a_adventure500 ? 1 : 0)
}

function loadProgress() {
    // 若没有存档标记则跳过
    if (settings.readString(SAVE_FLAG_KEY) != "1") return

    // 基础状态
    hunger = settings.readNumber("pet_hunger")
    happiness = settings.readNumber("pet_happiness")
    health = settings.readNumber("pet_health")
    cleanliness = settings.readNumber("pet_cleanliness")
    energy = settings.readNumber("pet_energy")
    // 经济与库存
    money = settings.readNumber("pet_money")
    foodCount = settings.readNumber("pet_foodCount")
    medicineCount = settings.readNumber("pet_medicineCount")
    // 昼夜
    currentHour = settings.readNumber("pet_currentHour")
    isNight = settings.readNumber("pet_isNight") == 1
    const dnc = settings.readNumber("pet_dayNightCycle"); if (dnc || dnc == 0) dayNightCycle = Math.max(0, Math.min(29, dnc))

    // 难度与昵称（若为空使用默认）
    const d = settings.readNumber("game_difficulty")
    if (d === 0 || d === 1 || d === 2) {
        currentDifficulty = d as Difficulty
    }
    const n = settings.readString("pet_name")
    if (n && n.length > 0) {
        petName = n
    }

    // 等级与经验（若有）
    const lv = settings.readNumber("player_level")
    const px = settings.readNumber("player_xp")
    if (lv && lv > 0) level = lv
    if (px && px >= 0) xp = px

    // 任务与成就（若有）
    const dc = settings.readNumber("day_counter"); if (dc || dc == 0) dayCounter = dc
    const wi = settings.readNumber("week_index"); if (wi || wi == 0) weekIndex = wi
    const wdc = settings.readNumber("weekly_day_counter"); if (wdc || wdc == 0) weeklyDayCounter = wdc
    const df = settings.readNumber("daily_feed"); if (df || df == 0) dailyFeed = df
    const dp = settings.readNumber("daily_play"); if (dp || dp == 0) dailyPlay = dp
    const dl = settings.readNumber("daily_clean"); if (dl || dl == 0) dailyClean = dl
    const dh = settings.readNumber("daily_heal"); if (dh || dh == 0) dailyHeal = dh
    const dw = settings.readNumber("daily_work"); if (dw || dw == 0) dailyWork = dw
    const ww = settings.readNumber("weekly_work"); if (ww || ww == 0) weeklyWork = ww
    const wr = settings.readNumber("weekly_rps_win"); if (wr || wr == 0) weeklyRpsWin = wr
    // 读取累计计数
    // 新增成就Setup3
    const tf = settings.readNumber("total_feed"); if (tf || tf == 0) totalFeed = tf
    const tp = settings.readNumber("total_play"); if (tp || tp == 0) totalPlay = tp
    const th = settings.readNumber("total_heal"); if (th || th == 0) totalHeal = th
    const tc = settings.readNumber("total_clean"); if (tc || tc == 0) totalClean = tc
    const tw = settings.readNumber("total_work"); if (tw || tw == 0) totalWork = tw
    const tg = settings.readNumber("total_game"); if (tg || tg == 0) totalGame = tg
    const ts = settings.readNumber("total_shop"); if (ts || ts == 0) totalShop = ts
    const tsl = settings.readNumber("total_sleep"); if (tsl || tsl == 0) totalSleep = tsl
    const te = settings.readNumber("total_explore"); if (te || te == 0) totalExplore = te

    // 保存累计计数
    // 新增成就Setup4
    settings.writeNumber("total_feed", totalFeed)
    settings.writeNumber("total_play", totalPlay)
    settings.writeNumber("total_heal", totalHeal)
    settings.writeNumber("total_clean", totalClean)
    settings.writeNumber("total_work", totalWork)
    settings.writeNumber("total_game", totalGame)
    settings.writeNumber("total_shop", totalShop)
    settings.writeNumber("total_sleep", totalSleep)
    settings.writeNumber("total_explore", totalExplore)

    claimed_d_feed3 = settings.readNumber("claimed_d_feed3") == 1
    claimed_d_play2 = settings.readNumber("claimed_d_play2") == 1
    claimed_d_clean1 = settings.readNumber("claimed_d_clean1") == 1
    claimed_d_heal1 = settings.readNumber("claimed_d_heal1") == 1
    claimed_d_work1 = settings.readNumber("claimed_d_work1") == 1
    claimed_w_work5 = settings.readNumber("claimed_w_work5") == 1
    claimed_w_rps3 = settings.readNumber("claimed_w_rps3") == 1
    claimed_w_work10 = settings.readNumber("claimed_w_work10") == 1
    claimed_w_rps5 = settings.readNumber("claimed_w_rps5") == 1
    claimed_a_lvl3 = settings.readNumber("claimed_a_lvl3") == 1
    claimed_a_lvl5 = settings.readNumber("claimed_a_lvl5") == 1
    claimed_a_money500 = settings.readNumber("claimed_a_money500") == 1
    claimed_a_lvl10 = settings.readNumber("claimed_a_lvl10") == 1
    claimed_a_lvl15 = settings.readNumber("claimed_a_lvl15") == 1
    claimed_a_money1000 = settings.readNumber("claimed_a_money1000") == 1
    claimed_a_money2000 = settings.readNumber("claimed_a_money2000") == 1
    // 新增更高等级与金钱成就读档
    claimed_a_money5000 = settings.readNumber("claimed_a_money5000") == 1
    claimed_a_lvl20 = settings.readNumber("claimed_a_lvl20") == 1
    claimed_a_lvl25 = settings.readNumber("claimed_a_lvl25") == 1
    claimed_a_lvl30 = settings.readNumber("claimed_a_lvl30") == 1
    claimed_a_lvl35 = settings.readNumber("claimed_a_lvl35") == 1
    claimed_a_lvl40 = settings.readNumber("claimed_a_lvl40") == 1
    claimed_a_lvl45 = settings.readNumber("claimed_a_lvl45") == 1
    claimed_a_lvl50 = settings.readNumber("claimed_a_lvl50") == 1
    // 读取累计500次成就领奖标记
    // 新增成就Setup8
    claimed_a_feed500 = settings.readNumber("claimed_a_feed500") == 1
    claimed_a_play500 = settings.readNumber("claimed_a_play500") == 1
    claimed_a_heal500 = settings.readNumber("claimed_a_heal500") == 1
    claimed_a_clean500 = settings.readNumber("claimed_a_clean500") == 1
    claimed_a_work500 = settings.readNumber("claimed_a_work500") == 1
    claimed_a_game500 = settings.readNumber("claimed_a_game500") == 1
    claimed_a_shop500 = settings.readNumber("claimed_a_shop500") == 1
    claimed_a_sleep500 = settings.readNumber("claimed_a_sleep500") == 1
    claimed_a_adventure500 = settings.readNumber("claimed_a_adventure500") == 1
}

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

/* 6x6 状态小图标迁移到 images.g.ts（myImages） */

// UI元素
let hungerBar: Sprite = null
let happinessBar: Sprite = null
let healthBar: Sprite = null
let cleanlinessBar: Sprite = null
let energyBar: Sprite = null  // 新增：精力条
let topTextSprite: Sprite = null
let bottomTextSprite: Sprite = null

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
    { name: "探险", icon: "🧭", action: () => adventureExplore() },
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
        // 降低整体亮度以“变暗”，不持久化到系统设置
        screen.setBrightness(120)
        // 添加星星效果
        for (let i = 0; i < 8; i++) {
            let star = sprites.create(image.create(1, 1), DecorationKind)
            star.image.fill(1)
            star.setPosition(randint(10, 150), randint(20, 60))
        }
    } else {
        // 白天背景 - 使用背景图片并恢复亮度
        scene.setBackgroundImage(assets.image`background`)
        screen.setBrightness(255)
        // 清除星星
        sprites.destroyAllSpritesOfKind(DecorationKind)
    }
}

// 昼夜循环系统
function updateDayNightCycle() {
    dayNightCycle++
    if (dayNightCycle >= SECONDS_PER_HOUR) { // 每xx秒一小时
        dayNightCycle = 0
        currentHour = (currentHour + 1) % 24

        // 判断是否为夜晚 (19:00-6:00)
        let wasNight = isNight
        isNight = currentHour >= 19 || currentHour < 6

        // 如果昼夜状态改变，更新背景
        if (wasNight !== isNight) {
            updateDayNightBackground()
        }
        // 新一天：currentHour 回到 0 视为新的一天
        if (currentHour == 0) {
            dayCounter++
            resetDailyCounters()
            // 周切换：独立周天计数，每 7 天归零并进位周索引
            weeklyDayCounter++
            if (weeklyDayCounter >= 7) {
                weeklyDayCounter = 0
                weekIndex++
                resetWeeklyCounters()
            }
            saveProgress()
        }

        // 夜晚时精力消耗加快
        if (isNight) {
            energy = Math.max(0, energy - 5)
        }
    }
}

/**
 * 调试重置：清空存档并重启游戏
 * 仅在 DEBUG_MODE 为 true 时由组合键触发
 */
function debugResetGame() {
    if (!DEBUG_MODE) return
    // 停止游戏循环，避免延时回调访问已销毁对象
    gameRunning = false

    // 清除存档标记与配置完成标记，写入默认初始值并保存
    settings.writeString(SAVE_FLAG_KEY, "0")
    settings.writeString(CONFIG_DONE_KEY, "0")
    resetDefaults()
    saveProgress()

    // 清理菜单与界面精灵
    sprites.destroyAllSpritesOfKind(MenuKind)
    sprites.destroyAllSpritesOfKind(UIKind)
    sprites.destroyAllSpritesOfKind(DecorationKind)
    // 初始化菜单状态与选择索引
    menuState = MenuState.Closed
    gameMenuState = MenuState.Closed
    shopMenuState = MenuState.Closed
    configMenuState = MenuState.Closed
    nameMenuState = MenuState.Closed
    levelMenuState = MenuState.Closed
    selectedMenuItem = MenuItem.Feed
    selectedGameChoice = 0
    selectedShopItem = 0
    levelTab = 0
    levelSelectedIndex = 0
    levelScrollOffset = 0
    // 清空菜单精灵数组
    menuSprites = []
    gameMenuSprites = []
    shopMenuSprites = []
    levelMenuSprites = []
    if (pet) {
        pet.destroy()
        pet = null
    }

    // 重启运行状态并重新初始化
    gameRunning = true
    screen.fillRect(0, 0, 160, 120, 0)
    initGame()
}

// 初始化游戏
function initGame() {
    // 读取存档（若有）
    loadProgress()

    // 若未完成首次配置，进入难度与昵称菜单
    if (settings.readString(CONFIG_DONE_KEY) != "1") {
        showDifficultyMenu()
        return
    }

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
    updateStatusBars()

    // 开始游戏循环
    lastUpdateTime = game.runtime()
    effects.confetti.startScreenEffect(500)
}

// 创建UI界面
function createUI() {
    // 创建背景装饰
    createBackground()

    // 状态条背景 - 顶部两行（为6x6图标预留空间：整体右移3px，宽度减6px 保持右端一致）
    let barBg1 = sprites.create(image.create(24, 6), UIKind)
    barBg1.image.fill(15)
    barBg1.setPosition(19, 4)

    let barBg2 = sprites.create(image.create(24, 6), UIKind)
    barBg2.image.fill(15)
    barBg2.setPosition(51, 4)

    let barBg3 = sprites.create(image.create(24, 6), UIKind)
    barBg3.image.fill(15)
    barBg3.setPosition(83, 4)

    let barBg4 = sprites.create(image.create(24, 6), UIKind)
    barBg4.image.fill(15)
    barBg4.setPosition(115, 4)

    let barBg5 = sprites.create(image.create(24, 6), UIKind)
    barBg5.image.fill(15)
    barBg5.setPosition(147, 4)

    // 状态条 - 顶部两行（右移3px，长度减6px，保证右端对齐）
    hungerBar = sprites.create(image.create(22, 4), UIKind)
    hungerBar.setPosition(19, 4)

    happinessBar = sprites.create(image.create(22, 4), UIKind)
    happinessBar.setPosition(51, 4)

    healthBar = sprites.create(image.create(22, 4), UIKind)
    healthBar.setPosition(83, 4)

    cleanlinessBar = sprites.create(image.create(22, 4), UIKind)
    cleanlinessBar.setPosition(115, 4)

    energyBar = sprites.create(image.create(22, 4), UIKind)
    energyBar.setPosition(147, 4)

    // 创建文字精灵：顶部与底部（始终重建，避免初始化阶段不显示）
    if (topTextSprite) topTextSprite.destroy()
    topTextSprite = sprites.create(image.create(160, 25), UIKind)
    topTextSprite.setPosition(80, 12)
    topTextSprite.z = 100

    if (bottomTextSprite) bottomTextSprite.destroy()
    bottomTextSprite = sprites.create(image.create(160, 15), UIKind)
    bottomTextSprite.setPosition(80, 112)
    bottomTextSprite.z = 100

    updateStatusBars()
}

function getWeekDayString(weekIndex: number): string {
    switch (weekIndex) {
        case 0:
            return "Sun"
        case 1:
            return "Mon"
        case 2:
            return "Tue"
        case 3:
            return "Wed"
        case 4:
            return "Thu"
        case 5:
            return "Fri"
        case 6:
            return "Sat"
        default:
            return "Sun"
    }
}

// 更新状态条
function updateStatusBars() {
    if (!hungerBar || !happinessBar || !healthBar || !cleanlinessBar || !energyBar) return
    // 菜单遮挡控制：当任一菜单打开时隐藏文字精灵，避免遮挡
    const anyMenuOpen = (menuState == MenuState.Open) || (gameMenuState == MenuState.Open) || (shopMenuState == MenuState.Open) || (configMenuState == MenuState.Open) || (nameMenuState == MenuState.Open) || (levelMenuState == MenuState.Open)
    if (topTextSprite) topTextSprite.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    if (bottomTextSprite) bottomTextSprite.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    // 同步隐藏五个状态条与其它 UI 元素，避免遮挡
    if (hungerBar) hungerBar.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    if (happinessBar) happinessBar.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    if (healthBar) healthBar.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    if (cleanlinessBar) cleanlinessBar.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    if (energyBar) energyBar.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    for (let s of sprites.allOfKind(UIKind)) {
        s.setFlag(SpriteFlag.Invisible, anyMenuOpen)
    }
    // 清空文字精灵内容
    if (topTextSprite) topTextSprite.image.fill(0)
    if (bottomTextSprite) bottomTextSprite.image.fill(0)

    // 顶部状态图标（6x6）放在“原始状态条的左边缘”
    if (topTextSprite) {
        // 原始bar左边缘：C-14 -> [1, 33, 65, 97, 129]（整体左移1，下移1）
        topTextSprite.image.drawTransparentImage(assets.image`hungerIcon6`, 0, 2)
        topTextSprite.image.drawTransparentImage(assets.image`happyIcon6`, 32, 2)
        topTextSprite.image.drawTransparentImage(assets.image`healthIcon6`, 64, 2)
        topTextSprite.image.drawTransparentImage(assets.image`cleanIcon6`, 96, 2)
        topTextSprite.image.drawTransparentImage(assets.image`energyIcon6`, 128, 2)
    }

    // 显示时间和昼夜状态、金钱（文字精灵顶部条）
    // 分钟按 00' 格式显示（每秒刷新，30秒=1小时 => 每步+2分钟）
    let _minutes = Math.floor(dayNightCycle * 2)
    let _minuteStr = (_minutes < 10 ? "0" : "") + _minutes
    let _hourStr = (currentHour < 10 ? "0" : "") + currentHour
    let timeStr = _hourStr + ":" + _minuteStr + " " + getWeekDayString(weeklyDayCounter)
    if (topTextSprite) {
        topTextSprite.image.print(timeStr, 5, 12, isNight ? 5 : 8)
        // 可领取任务徽标（★n）
        const _cDaily = getDailyTasks().filter(t => t.canClaim).length
        const _cWeekly = getWeeklyTasks().filter(t => t.canClaim).length
        const _cAch = getAchievementTasks().filter(t => t.canClaim).length
        const _cAll = _cDaily + _cWeekly + _cAch
        if (_cAll > 0) {
            topTextSprite.image.print("↑" + _cAll, 140, 12, 2, image.font8)
        }
    }

    // 饥饿度条 (红色) — 新宽度22
    hungerBar.image.fill(0)
    hungerBar.image.fillRect(0, 0, Math.floor(hunger * 22 / 100), 4, 2)

    // 快乐度条 (黄色)
    happinessBar.image.fill(0)
    happinessBar.image.fillRect(0, 0, Math.floor(happiness * 22 / 100), 4, 5)

    // 健康度条 (绿色)
    healthBar.image.fill(0)
    healthBar.image.fillRect(0, 0, Math.floor(health * 22 / 100), 4, 7)

    // 清洁度条 (蓝色)
    cleanlinessBar.image.fill(0)
    cleanlinessBar.image.fillRect(0, 0, Math.floor(cleanliness * 22 / 100), 4, 9)

    // 精力条 (紫色)
    energyBar.image.fill(0)
    energyBar.image.fillRect(0, 0, Math.floor(energy * 22 / 100), 4, 8)


    // 昵称显示 - 左下角（文字精灵底部条）
    if (bottomTextSprite) {
        bottomTextSprite.image.print(petName, 134, 2, 1)
    }

    // 底部操作提示（文字精灵底部条）
    if (menuState == MenuState.Closed && gameMenuState == MenuState.Closed && shopMenuState == MenuState.Closed && configMenuState == MenuState.Closed && nameMenuState == MenuState.Closed && bottomTextSprite) {
        bottomTextSprite.image.print("↑/↓", 2, 6, 1, image.font8)
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
        if (gameRunning && !sleeping) {
            updatePetState()
        }
    })
}

// 随机移动系统
function startRandomMovement() {
    game.onUpdateInterval(4000, () => {
        if (gameRunning && pet && !sleeping && configMenuState == MenuState.Closed && nameMenuState == MenuState.Closed && getCurrentPetState() != PetState.Sick) {
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
    if (!pet) return
    let originalY = pet.y
    pet.vy = -30
    pet.ay = 100

    // 使用setTimeout替代timer.after
    setTimeout(() => {
        if (!gameRunning || !pet) return
        scene.cameraShake(2, 200)
        pet.setPosition(pet.x, originalY)
        pet.vy = 0
        pet.ay = 0
    }, 800)
}

// 宠物移动
function petMove() {
    if (!pet) return
    let originalX = pet.x
    let direction = randint(0, 1) == 0 ? -1 : 1
    let targetX = Math.max(30, Math.min(130, originalX + direction * 20))

    pet.vx = direction * 15

    // 使用setTimeout替代timer.after
    setTimeout(() => {
        if (!gameRunning || !pet) return
        pet.vx = 0
        // 如果移动太远，拉回中心区域
        if (pet.x < 40 || pet.x > 120) {
            pet.setPosition(80, pet.y)
        }
    }, 1000)
}

// 宠物跳舞
function petDance() {
    if (!pet) return
    if (getCurrentPetState() == PetState.Happy || getCurrentPetState() == PetState.Normal) {
        animation.stopAnimation(animation.AnimationTypes.All, pet)
        pet.setImage(assets.image`petPlaying`)  // 先设置为玩耍状态图片
        animation.runImageAnimation(pet, assets.animation`petDanceAnimation`, 800, false)

        // 跳舞时的特效
        effects.hearts.startScreenEffect(2000)

        // 使用setTimeout替代timer.after
        setTimeout(() => {
            if (!gameRunning || !pet) return
            updatePetState()
        }, 3200)
    }
}

// 更新宠物状态和外观
function updatePetState() {
    if (!pet) return
    if (sleeping) return
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
        gainXP(5)
        updateStatusBars()

        // 计数与反馈
        dailyFeed++
        totalFeed++
        // 显示反馈
        game.showLongText("+20 饥饿度\n(剩余食物:" + foodCount + ")", DialogLayout.Bottom)
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
        gainXP(8)
        updateStatusBars()

        // 特殊动画 - 跳舞
        petDance()

        // 计数与反馈
        dailyPlay++
        totalPlay++
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
        gainXP(10)
        updateStatusBars()
        updatePetState()

        // 计数与反馈
        dailyHeal++
        totalHeal++
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
        gainXP(6)
        updateStatusBars()
        updatePetState()

        // 计数与反馈
        dailyClean++
        totalClean++
        // 显示反馈
        game.splash("+35 清洁度")

        music.playTone(523, 200)
    }
}

/** 睡觉功能（可持续睡眠模式） */
function petSleep() {
    if (!pet) return
    // 容错：若之前被打断但 sleeping 未复位，强制复位以允许再次入睡
    if (sleeping && energy < 100) {
        sleeping = false
    }
    if (sleeping) return
    if (energy >= 100) {
        pet.sayText("我已经睡饱啦！", 1500, false)
        return
    }
    sleeping = true
    // 停止当前动画并进入睡觉动画
    animation.stopAnimation(animation.AnimationTypes.All, pet)
    pet.setImage(assets.image`petSleeping`)
    animation.runImageAnimation(pet, assets.animation`petSleepAnimation`, 800, true)
    // 保活睡觉动画：若被意外打断，每秒恢复一次
    const keepSleepAnim = () => {
        if (!sleeping || !pet) return
        animation.runImageAnimation(pet, assets.animation`petSleepAnimation`, 800, true)
        setTimeout(keepSleepAnim, 1000)
    }
    setTimeout(keepSleepAnim, 1000)

    music.playTone(196, 200)
    // 每秒缓慢恢复精力与少量健康，直到满或被唤醒
    const tick = () => {
        if (!sleeping) return
        energy = Math.min(100, energy + 5)
        if (health < 100) health = Math.min(100, health + 1)
        updateStatusBars()
        if (energy >= 100) {
            energy = 100
            if (health < 100) health = Math.min(100, health + 3)
            updateStatusBars()
            if (pet) pet.sayText("睡饱了，精神满满！", 1500, false)
            stopSleepMode()
        } else {
            setTimeout(tick, 1000)
            // 最长睡眠时长：30秒，超时自动醒来（自动完成时直接加满精力）
            setTimeout(() => {
                if (sleeping) {
                    energy = 100
                    if (health < 100) health = Math.min(100, health + 3)
                    updateStatusBars()
                    if (pet) pet.sayText("睡饱了，精神满满！", 1500, false)
                    stopSleepMode()
                }
            }, SLEEP_MAX_MS)
        }
    }
    setTimeout(tick, 1000)
}
/** 结束睡眠模式 */
function stopSleepMode() {
    if (!sleeping) return
    sleeping = false
    totalSleep++
    animation.stopAnimation(animation.AnimationTypes.All, pet)
    updatePetState()
    if (pet) pet.sayText("我醒啦！", 800, false)
    music.playTone(262, 100)
}

// 宠物随机说话
function petRandomTalk() {
    if (!pet) return
    let dialogue = getRandomDialogue()
    pet.sayText(dialogue, 2000, false)
    music.playTone(294, 300)
}

/** 探险模式：随机事件（奖励与消耗结合） */
function adventureExplore() {
    if (!pet) return

    // 基础精力消耗（进入探险）
    if (energy < 10) {
        game.splash("精力太低，无法探险！")
        pet.sayText("好累，先休息一下吧...", 1800, false)
        music.playTone(175, 300)
        return
    }
    const baseCost = randint(8, 15)
    energy = Math.max(0, energy - baseCost)

    // 事件表（通过掷点选择）
    const roll = randint(1, 100)
    let msg = ""
    let good = true

    // 结算助手（带边界）
    const clamp01 = (v: number) => Math.max(0, Math.min(100, v))
    const dec = (v: number, d: number) => Math.max(0, v - d)
    const inc = (v: number, d: number) => Math.min(100, v + d)

    // 执行事件
    if (roll <= 20) {
        // 宝藏
        const earned = randint(20, 60)
        money += earned
        happiness = inc(happiness, 6)
        gainXP(8)
        msg = "探险发现小宝藏！+" + earned + "金币，快乐+6，XP+8"
        effects.confetti.startScreenEffect(600)
        music.playTone(523, 250)
    } else if (roll <= 35) {
        // 捡到食物
        foodCount++
        hunger = inc(hunger, 10)
        happiness = inc(happiness, 3)
        gainXP(5)
        msg = "捡到食物！饥饿+10，快乐+3，食物+1，XP+5"
        effects.bubbles.startScreenEffect(500)
        music.playTone(440, 220)
    } else if (roll <= 45) {
        // 找到药物
        medicineCount++
        health = inc(health, 8)
        gainXP(6)
        msg = "找到药物！健康+8，药物+1，XP+6"
        effects.confetti.startScreenEffect(500)
        music.playTone(392, 220)
    } else if (roll <= 60) {
        // 泥泞路
        cleanliness = dec(cleanliness, randint(12, 25))
        happiness = dec(happiness, 3)
        good = false
        msg = "路况泥泞，弄脏了… 清洁下降，快乐-3"
        effects.clouds.startScreenEffect(600)
        music.playTone(220, 250)
    } else if (roll <= 62 && isNight) {
        // 夜行受寒：夜晚更易受寒，健康与精力下降更明显
        const hDown = randint(4, 9)
        const eDown = randint(8, 14)
        health = dec(health, hDown)
        energy = dec(energy, eDown)
        happiness = dec(happiness, 2)
        good = false
        msg = "夜行受寒… 健康-" + hDown + "，精力-" + eDown + "，快乐-2"
        effects.clouds.startScreenEffect(600)
        music.playTone(208, 240)
    } else if (roll <= 70) {
        // 轻伤
        const dmg = randint(8, 18)
        health = dec(health, dmg)
        happiness = dec(happiness, 4)
        good = false
        msg = "不慎擦伤，健康-" + dmg + "，快乐-4"
        effects.hearts.startScreenEffect(400)
        music.playTone(196, 280)
    } else if (roll <= 76) {
        // 野兽追逐：大量消耗精力与少量快乐
        const run = randint(10, 20)
        energy = dec(energy, run)
        happiness = dec(happiness, 3)
        good = false
        msg = "被小野兽追了一段路！精力-" + run + "，快乐-3"
        effects.clouds.startScreenEffect(500)
        music.playTone(233, 220)
    } else if (roll <= 80) {
        // 遇到强盗
        const lost = randint(15, 40)
        money = Math.max(0, money - lost)
        happiness = dec(happiness, 5)
        good = false
        msg = "遇到强盗！金币-" + lost + "，快乐-5"
        effects.clouds.startScreenEffect(550)
        music.playTone(165, 300)
    } else if (roll <= 86) {
        // 远行偶遇：随机提升两项状态但额外耗精
        const extra = randint(8, 15)
        energy = dec(energy, extra)
        // 随机选择两项不同属性提升
        const attrs = [0, 1, 2, 3, 4] // 0饥饿、1快乐、2健康、3清洁、4精力
        const aIdx = randint(0, attrs.length - 1)
        let bIdx = randint(0, attrs.length - 1)
        while (bIdx == aIdx) {
            bIdx = randint(0, attrs.length - 1)
        }
        const a = attrs[aIdx]
        const b = attrs[bIdx]
        const up = randint(6, 12)
        if (a == 0 || b == 0) hunger = inc(hunger, up)
        if (a == 1 || b == 1) happiness = inc(happiness, up)
        if (a == 2 || b == 2) health = inc(health, up)
        if (a == 3 || b == 3) cleanliness = inc(cleanliness, up)
        if (a == 4 || b == 4) energy = inc(energy, Math.max(4, up - 2)) // 若抽到精力，回少量
        gainXP(6)
        msg = "远行偶遇，结识新朋友！两项属性+" + up + "，额外消耗精力-" + extra + "，XP+6"
        effects.confetti.startScreenEffect(600)
        music.playTone(370, 240)
    } else if (roll <= 90) {
        // 林间午后（回精）
        const recover = randint(12, 25)
        energy = inc(energy, recover)
        health = inc(health, 3)
        happiness = inc(happiness, 4)
        msg = "在林间稍作休息，精力+" + recover + "，健康+3，快乐+4"
        effects.hearts.startScreenEffect(700)
        music.playTone(330, 220)
    } else if (roll <= 94) {
        // 好心村民请餐
        hunger = inc(hunger, 25)
        happiness = inc(happiness, 10)
        gainXP(7)
        msg = "好心人请吃饭！饥饿+25，快乐+10，XP+7"
        effects.bubbles.startScreenEffect(600)
        music.playTone(494, 250)
    } else if (roll <= 96) {
        // 秘密商人：有食物则换得金币
        if (foodCount > 0) {
            const earn = randint(15, 35)
            foodCount--
            money += earn
            happiness = inc(happiness, 2)
            msg = "遇到秘密商人，用1个食物换得+" + earn + "金币，快乐+2"
            effects.confetti.startScreenEffect(500)
            music.playTone(349, 220)
        } else {
            msg = "遇到秘密商人，但你没有食物可以交易…"
            music.playTone(220, 200)
        }
    } else if (roll <= 98) {
        // 急救援助：消耗药物换取大量XP
        if (medicineCount > 0) {
            const gain = randint(12, 20)
            medicineCount--
            gainXP(gain)
            health = inc(health, 5)
            happiness = inc(happiness, 4)
            msg = "向路人提供急救援助！消耗1药物，XP+" + gain + "，健康+5，快乐+4"
            effects.confetti.startScreenEffect(600)
            music.playTone(415, 240)
        } else {
            msg = "路过急救场景，但你没有药物……"
            happiness = dec(happiness, 2)
            music.playTone(220, 200)
        }
    } else {
        // 神秘祭坛（权衡增减）
        const buff = randint(1, 5)
        const nerf = randint(1, 4)
        const deltaUp = randint(12, 22)
        const deltaDn = randint(8, 15)
        // 增益
        if (buff == 1) hunger = inc(hunger, deltaUp)
        else if (buff == 2) happiness = inc(happiness, deltaUp)
        else if (buff == 3) health = inc(health, deltaUp)
        else if (buff == 4) cleanliness = inc(cleanliness, deltaUp)
        else energy = inc(energy, deltaUp)
        // 减益（不同属性）
        if (nerf == 1) {
            const lost = randint(10, 25)
            money = Math.max(0, money - lost)
            msg = "神秘祭坛赐福但索取贡品… 金币-" + lost + "，另有一项属性大幅提升！"
        } else if (nerf == 2) {
            cleanliness = dec(cleanliness, deltaDn)
            msg = "祭坛试炼：清洁-" + deltaDn + "，但另一项属性大幅提升！"
        } else if (nerf == 3) {
            happiness = dec(happiness, deltaDn)
            msg = "祭坛试炼：快乐-" + deltaDn + "，但另一项属性大幅提升！"
        } else {
            health = dec(health, deltaDn)
            msg = "祭坛试炼：健康-" + deltaDn + "，但另一项属性大幅提升！"
        }
        gainXP(10)
        effects.confetti.startScreenEffect(800)
        music.playTone(587, 260)
    }

    // 状态边界与刷新
    hunger = clamp01(hunger)
    happiness = clamp01(happiness)
    health = clamp01(health)
    cleanliness = clamp01(cleanliness)
    energy = clamp01(energy)

    updateStatusBars()
    updatePetState()
    totalExplore++

    saveProgress()

    // 文本与语音反馈
    game.showLongText(msg + "\n(本次消耗精力-" + baseCost + ")", DialogLayout.Center)
    pet.sayText(good ? "探险真有趣！" : "有点波折…", 1500, false)
}



// 显示菜单
function showMenu() {
    if (menuState == MenuState.Open) return
    // 若正处于睡眠，打开菜单前先唤醒，避免睡眠状态卡住
    if (sleeping) stopSleepMode()

    menuState = MenuState.Open
    // 保留上次选中项，不重置

    // 创建全屏菜单背景
    let menuBg = sprites.create(image.create(160, 120), MenuKind)
    menuBg.image.fill(menuBgColor)  // 深蓝色外框
    menuBg.setPosition(80, 60)
    menuSprites.push(menuBg)

    createMenuSprites()
    updateStatusBars()
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
    gainXP(12)
    dailyWork++
    weeklyWork++
    totalWork++

    // 显示工作动画
    animation.stopAnimation(animation.AnimationTypes.All, pet)
    pet.setImage(assets.image`petPlaying`)  // 使用玩耍图片表示工作

    updateStatusBars()

    game.splash("工作赚取" + earnedMoney + "金币！")
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
    // 保留上次选中项，不重置

    // 创建游戏菜单背景
    let gameBg = sprites.create(image.create(160, 120), MenuKind)
    gameBg.image.fill(menuBgColor)
    gameBg.setPosition(80, 60)
    gameMenuSprites.push(gameBg)

    createGameMenuSprites()
    updateStatusBars()
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

        let choiceImg = image.create(60, 18)

        // 先绘制对应图标（石头/剪刀/布）
        let icon: Image = null
        if (i == 0) {
            icon = assets.image`rockIcon`
        } else if (i == 1) {
            icon = assets.image`scissorsIcon`
        } else {
            icon = assets.image`paperIcon`
        }

        if (i == selectedGameChoice) {
            choiceImg.fill(menuSelectedFontBgColor)
            choiceImg.drawTransparentImage(icon, 2, 1)
            choiceImg.print(gameChoices[i], 22, 2, menuSelectedFontColor)
        } else {
            choiceImg.fill(menuFontBgColor)
            choiceImg.drawTransparentImage(icon, 2, 1)
            choiceImg.print(gameChoices[i], 22, 2, menuFontColor)
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

// 更新等级菜单
function updateLevelMenuDisplay() {
    if (levelMenuState == MenuState.Closed) return
    // 仅重建等级菜单的局部精灵，避免销毁并重建整个菜单导致白屏
    for (let s of levelMenuSprites) {
        s.destroy()
    }
    levelMenuSprites = []
    // 标记为关闭以允许 showLevelMenu 重建
    levelMenuState = MenuState.Closed
    showLevelMenu()
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

    if (pet) pet.sayText("我选择" + choices[petChoice] + "！", 2000, false)

    let result = ""
    let reward = 0

    if (playerChoice == petChoice) {
        result = "平局!"
        reward = 5
    } else if ((playerChoice == 1 && petChoice == 2) ||
        (playerChoice == 2 && petChoice == 3) ||
        (playerChoice == 3 && petChoice == 1)) {
        result = "你赢了!"
        reward = 15
        happiness = Math.min(100, happiness + 10)
        weeklyRpsWin++
    } else {
        result = "我赢了!"
        reward = 3
        happiness = Math.min(100, happiness + 5)
    }

    money += reward
    gainXP(reward == 15 ? 10 : (reward == 5 ? 3 : 2))
    updateStatusBars()
    totalGame++

    game.splash(result + "获得" + reward + "金币!")
    music.playTone(523, 400)
}

// 等级与奖励 - 基础占位变量
// 等级与奖励 - 基础占位变量
let levelMenuState = MenuState.Closed
let level = 1
let xp = 0
let xpToNext = 100
let levelMenuSprites: Sprite[] = []

// 任务与成就 - 计数与状态（最小实现）
// 模拟“天/周”推进：currentHour 回到 0 视为新的一天；每 7 天视为新的一周
let dayCounter = 0
let weekIndex = 0
let weeklyDayCounter = 0

// 每日计数
let dailyFeed = 0
let dailyPlay = 0
let dailyClean = 0
let dailyHeal = 0
let dailyWork = 0

// 每周计数
let weeklyWork = 0
let weeklyRpsWin = 0
// 累计计数（成就用）
// 新增成就Setup1
let totalFeed = 0
let totalPlay = 0
let totalHeal = 0
let totalClean = 0
let totalWork = 0
let totalGame = 0
let totalShop = 0
let totalSleep = 0
let totalExplore = 0

// 成就（无需计数，直接由条件判断）：Lv3、Lv5、钱500

// 已领奖标记（持久化）
let claimed_d_feed3 = false
let claimed_d_play2 = false
let claimed_d_clean1 = false
let claimed_d_heal1 = false
let claimed_d_work1 = false

let claimed_w_work5 = false
let claimed_w_rps3 = false
let claimed_w_work10 = false
let claimed_w_rps5 = false

let claimed_a_lvl3 = false
let claimed_a_lvl5 = false
let claimed_a_money500 = false
let claimed_a_lvl10 = false
let claimed_a_lvl15 = false
let claimed_a_money1000 = false
let claimed_a_money2000 = false
// 新增更高等级与金钱成就标记
let claimed_a_money5000 = false
let claimed_a_lvl20 = false
let claimed_a_lvl25 = false
let claimed_a_lvl30 = false
let claimed_a_lvl35 = false
let claimed_a_lvl40 = false
let claimed_a_lvl45 = false
let claimed_a_lvl50 = false
// 累计500次成就领取标记
// 新增成就Setup6
let claimed_a_feed500 = false
let claimed_a_play500 = false
let claimed_a_heal500 = false
let claimed_a_clean500 = false
let claimed_a_work500 = false
let claimed_a_game500 = false
let claimed_a_shop500 = false
let claimed_a_sleep500 = false
let claimed_a_adventure500 = false

// 等级菜单交互状态
let levelTab = 0 // 0=每日 1=每周 2=成就
let levelSelectedIndex = 0
let levelScrollOffset = 0
const levelVisibleRows = 3
const levelCursorRow = 1

function resetDailyCounters() {
    dailyFeed = 0
    dailyPlay = 0
    dailyClean = 0
    dailyHeal = 0
    dailyWork = 0
    // 每日任务领奖标记重置
    claimed_d_feed3 = false
    claimed_d_play2 = false
    claimed_d_clean1 = false
    claimed_d_heal1 = false
    claimed_d_work1 = false
}

function resetWeeklyCounters() {
    weeklyWork = 0
    weeklyRpsWin = 0
    // 每周任务领奖标记重置
    claimed_w_work5 = false
    claimed_w_rps3 = false
    claimed_w_work10 = false
    claimed_w_rps5 = false
}

// 任务数据与工具
interface Task {
    id: string
    title: string
    target: number
    progress: number
    rewardXP: number
    rewardMoney: number
    claimed: boolean
    canClaim: boolean
}

function getDailyTasks(): Task[] {
    return [
        {
            id: "d_feed3", title: "喂食3次", target: 3,
            progress: dailyFeed, rewardXP: 10, rewardMoney: 20,
            claimed: claimed_d_feed3, canClaim: dailyFeed >= 3 && !claimed_d_feed3
        },
        {
            id: "d_play2", title: "玩耍2次", target: 2,
            progress: dailyPlay, rewardXP: 10, rewardMoney: 20,
            claimed: claimed_d_play2, canClaim: dailyPlay >= 2 && !claimed_d_play2
        },
        {
            id: "d_clean1", title: "清洁1次", target: 1,
            progress: dailyClean, rewardXP: 10, rewardMoney: 15,
            claimed: claimed_d_clean1, canClaim: dailyClean >= 1 && !claimed_d_clean1
        },
        {
            id: "d_heal1", title: "治疗1次", target: 1,
            progress: dailyHeal, rewardXP: 10, rewardMoney: 20,
            claimed: claimed_d_heal1, canClaim: dailyHeal >= 1 && !claimed_d_heal1
        },
        {
            id: "d_work1", title: "打工1次", target: 1,
            progress: dailyWork, rewardXP: 10, rewardMoney: 30,
            claimed: claimed_d_work1, canClaim: dailyWork >= 1 && !claimed_d_work1
        }
    ]
}

function getWeeklyTasks(): Task[] {
    return [
        {
            id: "w_work5", title: "打工5次", target: 5,
            progress: weeklyWork, rewardXP: 20, rewardMoney: 120,
            claimed: claimed_w_work5, canClaim: weeklyWork >= 5 && !claimed_w_work5
        },
        {
            id: "w_work10", title: "打工10次", target: 10,
            progress: weeklyWork, rewardXP: 40, rewardMoney: 240,
            claimed: claimed_w_work10, canClaim: weeklyWork >= 10 && !claimed_w_work10
        },
        {
            id: "w_rps3", title: "猜拳胜利3次", target: 3,
            progress: weeklyRpsWin, rewardXP: 30, rewardMoney: 80,
            claimed: claimed_w_rps3, canClaim: weeklyRpsWin >= 3 && !claimed_w_rps3
        },
        {
            id: "w_rps5", title: "猜拳胜利5次", target: 5,
            progress: weeklyRpsWin, rewardXP: 50, rewardMoney: 140,
            claimed: claimed_w_rps5, canClaim: weeklyRpsWin >= 5 && !claimed_w_rps5
        }
    ]
}

function getAchievementTasks(): Task[] {
    return [
        {
            id: "a_lvl3", title: "等级达到3", target: 1,
            progress: level >= 3 ? 1 : 0, rewardXP: 0, rewardMoney: 100,
            claimed: claimed_a_lvl3, canClaim: level >= 3 && !claimed_a_lvl3
        },
        {
            id: "a_lvl5", title: "等级达到5", target: 1,
            progress: level >= 5 ? 1 : 0, rewardXP: 0, rewardMoney: 200,
            claimed: claimed_a_lvl5, canClaim: level >= 5 && !claimed_a_lvl5
        },
        {
            id: "a_lvl10", title: "等级达到10", target: 1,
            progress: level >= 10 ? 1 : 0, rewardXP: 0, rewardMoney: 300,
            claimed: claimed_a_lvl10, canClaim: level >= 10 && !claimed_a_lvl10
        },
        {
            id: "a_lvl15", title: "等级达到15", target: 1,
            progress: level >= 15 ? 1 : 0, rewardXP: 0, rewardMoney: 500,
            claimed: claimed_a_lvl15, canClaim: level >= 15 && !claimed_a_lvl15
        },
        {
            id: "a_lvl20", title: "等级达到20", target: 1,
            progress: level >= 20 ? 1 : 0, rewardXP: 0, rewardMoney: 700,
            claimed: claimed_a_lvl20, canClaim: level >= 20 && !claimed_a_lvl20
        },
        {
            id: "a_lvl25", title: "等级达到25", target: 1,
            progress: level >= 25 ? 1 : 0, rewardXP: 0, rewardMoney: 900,
            claimed: claimed_a_lvl25, canClaim: level >= 25 && !claimed_a_lvl25
        },
        {
            id: "a_lvl30", title: "等级达到30", target: 1,
            progress: level >= 30 ? 1 : 0, rewardXP: 0, rewardMoney: 1100,
            claimed: claimed_a_lvl30, canClaim: level >= 30 && !claimed_a_lvl30
        },
        {
            id: "a_lvl35", title: "等级达到35", target: 1,
            progress: level >= 35 ? 1 : 0, rewardXP: 0, rewardMoney: 1300,
            claimed: claimed_a_lvl35, canClaim: level >= 35 && !claimed_a_lvl35
        },
        {
            id: "a_lvl40", title: "等级达到40", target: 1,
            progress: level >= 40 ? 1 : 0, rewardXP: 0, rewardMoney: 1500,
            claimed: claimed_a_lvl40, canClaim: level >= 40 && !claimed_a_lvl40
        },
        {
            id: "a_lvl45", title: "等级达到45", target: 1,
            progress: level >= 45 ? 1 : 0, rewardXP: 0, rewardMoney: 1800,
            claimed: claimed_a_lvl45, canClaim: level >= 45 && !claimed_a_lvl45
        },
        {
            id: "a_lvl50", title: "等级达到50", target: 1,
            progress: level >= 50 ? 1 : 0, rewardXP: 0, rewardMoney: 2200,
            claimed: claimed_a_lvl50, canClaim: level >= 50 && !claimed_a_lvl50
        },
        {
            id: "a_money500", title: "金钱达到500", target: 1,
            progress: money >= 500 ? 1 : 0, rewardXP: 0, rewardMoney: 150,
            claimed: claimed_a_money500, canClaim: money >= 500 && !claimed_a_money500
        },
        {
            id: "a_money1000", title: "金钱达到1000", target: 1,
            progress: money >= 1000 ? 1 : 0, rewardXP: 0, rewardMoney: 250,
            claimed: claimed_a_money1000, canClaim: money >= 1000 && !claimed_a_money1000
        },
        {
            id: "a_money2000", title: "金钱达到2000", target: 1,
            progress: money >= 2000 ? 1 : 0, rewardXP: 0, rewardMoney: 400,
            claimed: claimed_a_money2000, canClaim: money >= 2000 && !claimed_a_money2000
        },
        {
            id: "a_money5000", title: "金钱达到5000", target: 1,
            progress: money >= 5000 ? 1 : 0, rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_money5000, canClaim: money >= 5000 && !claimed_a_money5000
        },
        {
            id: "a_feed500", title: "大胃王", target: 500,
            progress: Math.min(500, totalFeed), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_feed500, canClaim: totalFeed >= 500 && !claimed_a_feed500
        },
        {
            id: "a_play500", title: "嘻嘻哈哈", target: 500,
            progress: Math.min(500, totalPlay), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_play500, canClaim: totalPlay >= 500 && !claimed_a_play500
        },
        {
            id: "a_heal500", title: "病秧子", target: 500,
            progress: Math.min(500, totalHeal), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_heal500, canClaim: totalHeal >= 500 && !claimed_a_heal500
        },
        {
            id: "a_clean500", title: "爱干净", target: 500,
            progress: Math.min(500, totalClean), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_clean500, canClaim: totalClean >= 500 && !claimed_a_clean500
        },
        {
            id: "a_work500", title: "打工皇帝", target: 500,
            progress: Math.min(500, totalWork), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_work500, canClaim: totalWork >= 500 && !claimed_a_work500
        },
        {
            id: "a_game500", title: "猜拳高手", target: 500,
            progress: Math.min(500, totalGame), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_game500, canClaim: totalGame >= 500 && !claimed_a_game500
        },
        {
            id: "a_shop500", title: "购物狂", target: 500,
            progress: Math.min(500, totalShop), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_shop500, canClaim: totalShop >= 500 && !claimed_a_shop500
        },
        {
            id: "a_adventure500", title: "冒险王", target: 500,
            progress: Math.min(500, totalExplore), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_adventure500, canClaim: totalExplore >= 500 && !claimed_a_adventure500
        },
        {
            id: "a_sleep500", title: "睡美人", target: 500,
            progress: Math.min(500, totalSleep), rewardXP: 0, rewardMoney: 800,
            claimed: claimed_a_sleep500, canClaim: totalSleep >= 500 && !claimed_a_sleep500
        }

    ]
    // 新增成就Setup9
}

function getCurrentTasks(): Task[] {
    let list = levelTab == 0 ? getDailyTasks() : (levelTab == 1 ? getWeeklyTasks() : getAchievementTasks())
    // 稳定排序：可领 > 未完成 > 已领；其次按完成度(进度/目标)降序
    list.sort((a, b) => {
        const ca = a.canClaim ? 1 : 0
        const cb = b.canClaim ? 1 : 0
        if (ca != cb) return cb - ca
        const cla = a.claimed ? 1 : 0
        const clb = b.claimed ? 1 : 0
        if (cla != clb) return cla - clb // 未领在前，已领在后
        const ra = a.target > 0 ? a.progress / a.target : 0
        const rb = b.target > 0 ? b.progress / b.target : 0
        return rb - ra
    })
    return list
}

function setClaimedById(id: string) {
    switch (id) {
        case "d_feed3": claimed_d_feed3 = true; break
        case "d_play2": claimed_d_play2 = true; break
        case "d_clean1": claimed_d_clean1 = true; break
        case "d_heal1": claimed_d_heal1 = true; break
        case "d_work1": claimed_d_work1 = true; break
        case "w_work5": claimed_w_work5 = true; break
        case "w_work10": claimed_w_work10 = true; break
        case "w_rps3": claimed_w_rps3 = true; break
        case "w_rps5": claimed_w_rps5 = true; break
        case "a_lvl3": claimed_a_lvl3 = true; break
        case "a_lvl5": claimed_a_lvl5 = true; break
        case "a_lvl10": claimed_a_lvl10 = true; break
        case "a_lvl15": claimed_a_lvl15 = true; break
        case "a_money500": claimed_a_money500 = true; break
        case "a_money1000": claimed_a_money1000 = true; break
        case "a_money2000": claimed_a_money2000 = true; break
        case "a_money5000": claimed_a_money5000 = true; break
        case "a_lvl20": claimed_a_lvl20 = true; break
        case "a_lvl25": claimed_a_lvl25 = true; break
        case "a_lvl30": claimed_a_lvl30 = true; break
        case "a_lvl35": claimed_a_lvl35 = true; break
        case "a_lvl40": claimed_a_lvl40 = true; break
        case "a_lvl45": claimed_a_lvl45 = true; break
        case "a_lvl50": claimed_a_lvl50 = true; break
        case "a_feed500": claimed_a_feed500 = true; break
        case "a_play500": claimed_a_play500 = true; break
        case "a_heal500": claimed_a_heal500 = true; break
        case "a_clean500": claimed_a_clean500 = true; break
        case "a_work500": claimed_a_work500 = true; break
        case "a_game500": claimed_a_game500 = true; break
        case "a_shop500": claimed_a_shop500 = true; break
        case "a_sleep500": claimed_a_sleep500 = true; break
        case "a_adventure500": claimed_a_adventure500 = true; break
    }
    // 新增成就Setup10
}

function claimSelectedTask() {
    const tasks = getCurrentTasks()
    if (levelSelectedIndex < 0 || levelSelectedIndex >= tasks.length) return
    const t = tasks[levelSelectedIndex]
    if (!t.canClaim) return
    // 发放奖励
    if (t.rewardMoney > 0) money += t.rewardMoney
    if (t.rewardXP > 0) gainXP(t.rewardXP)
    setClaimedById(t.id)
    saveProgress()
    updateStatusBars()
    // 刷新菜单显示
    sprites.destroyAllSpritesOfKind(MenuKind)
    levelMenuState = MenuState.Closed
    showLevelMenu()
}

// 经验与升级（基础框架）
function xpToNextLevel(): number {
    // 简单线性曲线：Lv1 需100，后续每级+50
    return 100 + Math.max(0, level - 1) * 50
}
function gainXP(n: number) {
    if (n <= 0) return
    xp += n
    while (xp >= xpToNextLevel()) {
        xp -= xpToNextLevel()
        level++
        // 基础升级奖励：+50 金币（可后续扩展为奖励队列）
        money += 50
        if (pet) pet.sayText("升级到 Lv." + level + "！", 1500, false)
        effects.confetti.startScreenEffect(300)
    }
    updateStatusBars()
    saveProgress()
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

// 显示等级与奖励菜单（基础版）
function showLevelMenu() {
    if (levelMenuState == MenuState.Open) return

    levelMenuState = MenuState.Open

    const bg = sprites.create(image.create(160, 120), MenuKind)
    bg.image.fill(menuBgColor)
    bg.setPosition(80, 60)
    levelMenuSprites.push(bg)

    const titleImg = image.create(90, menuTitleHeight)
    titleImg.print("等级与奖励", 13, 0, menuTitleColor)
    const title = sprites.create(titleImg, MenuKind)
    title.setPosition(menuTitlePositionX, menuTitlePositionY - 6)
    levelMenuSprites.push(title)

    // 等级与经验条信息
    const infoImg = image.create(menuBarWidth, menuBarHeight)
    infoImg.fill(menuBarBgColor)
    const need = xpToNextLevel()
    infoImg.print("Lv." + level + "  XP: " + xp + "/" + need, 5, 3, menuBarFontColor)
    // 进度条（底部细条）
    const barW = menuBarWidth - 10
    const filled = Math.min(barW, Math.floor((xp * barW) / Math.max(1, need)))
    infoImg.fillRect(5, menuBarHeight - 4, barW, 2, 1)
    infoImg.fillRect(5, menuBarHeight - 4, filled, 2, 7)
    const infoSprite = sprites.create(infoImg, MenuKind)
    infoSprite.setPosition(menuBarPositionX, 25)
    levelMenuSprites.push(infoSprite)

    // 页签（每日/每周/成就）+ 徽标（可领数量）
    const tabsImg = image.create(menuBarWidth, menuBarHeight)
    tabsImg.fill(menuBarBgColor)
    const daily = getDailyTasks()
    const weekly = getWeeklyTasks()
    const ach = getAchievementTasks()
    const c0 = daily.filter(t => t.canClaim).length
    const c1 = weekly.filter(t => t.canClaim).length
    const c2 = ach.filter(t => t.canClaim).length
    const tabNames = [
        "每日",
        "每周",
        "成就"
    ]
    for (let i = 0; i < 3; i++) {
        const x = 5 + i * 40
        const sel = (i == levelTab)
        tabsImg.print(tabNames[i], x, 3, sel ? menuSelectedFontColor : menuFontColor)
        if (i == 0 && c0 > 0) {
            tabsImg.print("*", x + 25, 3, 2, image.font8)
        } else if (i == 1 && c1 > 0) {
            tabsImg.print("*", x + 25, 3, 2, image.font8)
        } else if (i == 2 && c2 > 0) {
            tabsImg.print("*", x + 25, 3, 2, image.font8)
        }
    }
    const tabsSprite = sprites.create(tabsImg, MenuKind)
    tabsSprite.setPosition(menuBarPositionX, 43)
    levelMenuSprites.push(tabsSprite)

    // 任务列表（固定光标在中间行的滚动视窗）
    const tasks = getCurrentTasks()
    // 边界保护
    if (levelSelectedIndex < 0) levelSelectedIndex = 0
    if (levelSelectedIndex >= tasks.length) levelSelectedIndex = Math.max(0, tasks.length - 1)
    const maxStart = Math.max(0, tasks.length - levelVisibleRows)
    const start = Math.max(0, Math.min(maxStart, levelSelectedIndex - levelCursorRow))
    const end = Math.min(tasks.length, start + levelVisibleRows)
    const selectedBaseY = 76
    const baseY = selectedBaseY - (levelCursorRow * 16)
    for (let i = 0; i < end - start; i++) {
        const itemImg = image.create(menuBarWidth, 16)
        const t = tasks[start + i]
        let status = ""
        if (t.claimed) status = "已领"
        else if (t.canClaim) status = "可领"
        else status = t.progress + "/" + t.target
        const sel = ((start + i) == levelSelectedIndex)
        if (sel) itemImg.fill(menuSelectedFontBgColor)
        itemImg.print(t.title, 5, 1, sel ? menuSelectedFontColor : menuFontColor)
        itemImg.print(status, 110, 1, sel ? menuSelectedFontColor : menuFontColor)
        const s = sprites.create(itemImg, MenuKind)
        s.setPosition(menuBarPositionX, baseY + i * 16)
        levelMenuSprites.push(s)
    }
    // 上/下滚动箭头提示
    if (start > 0) {
        const upImg = image.create(menuBarWidth, 8)
        upImg.print("↑", 150, 0, menuFontColor)
        const upS = sprites.create(upImg, MenuKind)
        upS.setPosition(menuBarPositionX, baseY - 2)
        levelMenuSprites.push(upS)
    }
    if (end < tasks.length) {
        const dnImg = image.create(menuBarWidth, 8)
        dnImg.print("↓", 150, -4, menuFontColor)
        const dnS = sprites.create(dnImg, MenuKind)
        dnS.setPosition(menuBarPositionX, baseY + (levelVisibleRows * 16) - 16)
        levelMenuSprites.push(dnS)
    }

    // 页码指示（当前选中序号/总数）
    {
        const pageImg = image.create(menuBarWidth, 8)
        pageImg.print((levelSelectedIndex + 1) + "/" + tasks.length, menuBarWidth - 40, 3, menuFontColor, image.font5)
        const pageSprite = sprites.create(pageImg, MenuKind)
        pageSprite.setPosition(menuBarPositionX + 8, 43)
        levelMenuSprites.push(pageSprite)
    }

    // 提示
    const hintImg = image.create(menuBarWidth, menuBarHeight)
    hintImg.fill(menuBarBgColor)
    hintImg.print("左右切换 上下选择 A领取 B返回", 3, 3, menuBarFontColor)
    const hint = sprites.create(hintImg, MenuKind)
    hint.setPosition(menuBarPositionX, menuBarPositionY)
    levelMenuSprites.push(hint)

    updateStatusBars()
}

// 隐藏等级与奖励菜单
function hideLevelMenu() {
    if (levelMenuState == MenuState.Closed) return

    levelMenuState = MenuState.Closed
    for (let s of levelMenuSprites) {
        s.destroy()
    }
    levelMenuSprites = []
    updateStatusBars()
}

// 显示购物菜单
function showShopMenu() {
    if (shopMenuState == MenuState.Open) return

    shopMenuState = MenuState.Open
    // 保留上次选中项，不重置

    // 创建购物菜单背景
    let shopBg = sprites.create(image.create(160, 120), MenuKind)
    shopBg.image.fill(menuBgColor)
    shopBg.setPosition(80, 60)
    shopMenuSprites.push(shopBg)

    createShopMenuSprites()
    updateStatusBars()
}

// 创建购物菜单精灵
function createShopMenuSprites() {
    // 清除旧的菜单精灵（保留背景）
    for (let i = shopMenuSprites.length - 1; i >= 1; i--) {
        shopMenuSprites[i].destroy()
        shopMenuSprites.splice(i, 1)
    }

    // 创建标题 - 使用统一样式
    let titleImg = image.create(60, menuTitleHeight)
    titleImg.print("宠物商店", 6, 0, menuTitleColor)
    let titleSprite = sprites.create(titleImg, MenuKind)
    titleSprite.setPosition(menuTitlePositionX, menuTitlePositionY)
    shopMenuSprites.push(titleSprite)

    // 显示当前金钱 - 使用统一Bar样式
    let moneyImg = image.create(menuBarWidth, menuBarHeight)
    moneyImg.print("当前金钱:" + money, 5, 3, menuFontColor)
    let moneySprite = sprites.create(moneyImg, MenuKind)
    moneySprite.setPosition(menuBarPositionX, 30)
    shopMenuSprites.push(moneySprite)

    // 商品选项（前置图标）
    for (let i = 0; i < shopItems.length; i++) {
        let x = 80
        let y = 50 + i * 25

        let itemImg = image.create(60, 18)

        if (i == selectedShopItem) {
            itemImg.fill(menuSelectedFontBgColor)
            // 绘制类型图标
            if (shopItems[i].type == "food") {
                itemImg.drawTransparentImage(assets.image`chickenIcon`, 2, 1)
            } else if (shopItems[i].type == "medicine") {
                itemImg.drawTransparentImage(assets.image`pillIcon`, 2, 1)
            }
            // 文本右移以避开图标
            itemImg.print(shopItems[i].name, 22, 2, menuSelectedFontColor)
        } else {
            itemImg.fill(menuFontBgColor)
            // 绘制类型图标
            if (shopItems[i].type == "food") {
                itemImg.drawTransparentImage(assets.image`chickenIcon`, 2, 1)
            } else if (shopItems[i].type == "medicine") {
                itemImg.drawTransparentImage(assets.image`pillIcon`, 2, 1)
            }
            // 文本右移以避开图标
            itemImg.print(shopItems[i].name, 22, 2, menuFontColor)
        }

        let itemSprite = sprites.create(itemImg, MenuKind)
        itemSprite.setPosition(x, y)
        shopMenuSprites.push(itemSprite)
    }

    // 显示选中商品的价格 - 使用统一Bar样式
    let priceImg = image.create(menuBarWidth, menuBarHeight)
    priceImg.print("价格:" + shopItems[selectedShopItem].price + "金币", 5, 3, menuFontColor)
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
        totalShop++

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

// // 新的控制器输入处理 - 菜单系统
// controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
//     // 释放 Menu 键功能：不再用于打开/关闭宠物菜单
//     // 预留：未来可绑定其他功能
//     return
// })

controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    if (levelMenuState == MenuState.Open) {
        if (levelTab > 0) {
            levelTab--
            levelSelectedIndex = 0
            levelScrollOffset = 0
            updateLevelMenuDisplay()
        }
    } else if (menuState == MenuState.Open) {
        if (selectedMenuItem > 0) {
            selectedMenuItem--
            updateMenuSelection()
        }
    }
})

controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    if (levelMenuState == MenuState.Open) {
        if (levelTab < 2) {
            levelTab++
            levelSelectedIndex = 0
            levelScrollOffset = 0
            updateLevelMenuDisplay()
        }
    } else if (menuState == MenuState.Open) {
        if (selectedMenuItem < menuItems.length - 1) {
            selectedMenuItem++
            updateMenuSelection()
        }
    }
})

controller.up.onEvent(ControllerButtonEvent.Pressed, () => {
    if (levelMenuState == MenuState.Open) {
        if (levelSelectedIndex > 0) {
            levelSelectedIndex--
            updateLevelMenuDisplay()
        }
    } else if (menuState == MenuState.Open) {
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
    } else if (configMenuState == MenuState.Open) {
        if (selectedDifficultyIndex > 0) {
            selectedDifficultyIndex--
            sprites.destroyAllSpritesOfKind(MenuKind)
            configMenuState = MenuState.Closed
            showDifficultyMenu()
        }
    } else if (nameMenuState == MenuState.Open) {
        // 昵称菜单不支持上下选择，忽略
    } else if (
        menuState == MenuState.Closed &&
        gameMenuState == MenuState.Closed &&
        shopMenuState == MenuState.Closed &&
        configMenuState == MenuState.Closed &&
        nameMenuState == MenuState.Closed
    ) {
        // 每次进入时初始化：不保留上次页签与索引
        levelTab = 0
        levelSelectedIndex = 0
        levelScrollOffset = 0
        // 等级与奖励系统入口
        showLevelMenu()
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, () => {
    if (levelMenuState == MenuState.Open) {
        const len = getCurrentTasks().length
        if (levelSelectedIndex < len - 1) {
            levelSelectedIndex++
            updateLevelMenuDisplay()
        }
    } else if (menuState == MenuState.Open) {
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
    } else if (configMenuState == MenuState.Open) {
        if (selectedDifficultyIndex < 2) {
            selectedDifficultyIndex++
            sprites.destroyAllSpritesOfKind(MenuKind)
            configMenuState = MenuState.Closed
            showDifficultyMenu()
        }
    } else if (nameMenuState == MenuState.Open) {
        // 昵称菜单不支持上下选择，忽略
    } else if (
        menuState == MenuState.Closed &&
        levelMenuState == MenuState.Closed &&
        gameMenuState == MenuState.Closed &&
        shopMenuState == MenuState.Closed &&
        configMenuState == MenuState.Closed &&
        nameMenuState == MenuState.Closed
    ) {
        // 主界面空闲态：下键打开宠物菜单
        showMenu()
    }
})

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    if (levelMenuState == MenuState.Open) {
        claimSelectedTask()
    } else if (menuState == MenuState.Open) {
        executeMenuItem()
    } else if (gameMenuState == MenuState.Open) {
        executeGameChoice()
    } else if (shopMenuState == MenuState.Open) {
        executePurchase()
    } else if (configMenuState == MenuState.Open) {
        proceedToNameMenu()
    } else if (nameMenuState == MenuState.Open) {
        finishConfigAndStart()
    }
})

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    // 若在睡眠模式，B 优先用于唤醒
    if (sleeping) {
        stopSleepMode()
        return
    }
    if (menuState == MenuState.Open) {
        hideMenu()
    } else if (gameMenuState == MenuState.Open) {
        hideGameMenu()
        showMenu()
    } else if (shopMenuState == MenuState.Open) {
        hideShopMenu()
        showMenu()
    } else if (levelMenuState == MenuState.Open) {
        hideLevelMenu()
    } else if (nameMenuState == MenuState.Open) {
        selectedNameIndex = getNextRandomNameIndex()
        sprites.destroyAllSpritesOfKind(MenuKind)
        // 先关闭状态再重建，避免 showNameMenu 提前 return
        nameMenuState = MenuState.Closed
        showNameMenu()
    } else if (
        menuState == MenuState.Closed &&
        gameMenuState == MenuState.Closed &&
        shopMenuState == MenuState.Closed &&
        configMenuState == MenuState.Closed &&
        nameMenuState == MenuState.Closed
    ) {
        // 主界面：随机说话
        petRandomTalk()
    }
})

// 游戏主循环 - 状态自动衰减
game.onUpdateInterval(4000, () => {
    if (gameRunning && pet && !sleeping && configMenuState == MenuState.Closed && nameMenuState == MenuState.Closed) {
        // 仅在困难难度时执行
        if (currentDifficulty != Difficulty.Hard) return;
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

        if (pet) pet.sayText(getRandomDialogue(), 1000, false)
        updateStatusBars()
        updatePetState()

        // 检查游戏结束条件
        if (health <= 0) {
            gameOver()
        }
    }
})

/**
 * 普通难度 8000ms 衰减
 */
game.onUpdateInterval(8000, () => {
    if (gameRunning && pet && !sleeping && configMenuState == MenuState.Closed && nameMenuState == MenuState.Closed) {
        if (currentDifficulty != Difficulty.Normal) return;
        // 状态自动衰减
        hunger = Math.max(0, hunger - 3)
        happiness = Math.max(0, happiness - 2)
        health = Math.max(0, health - 1)
        cleanliness = Math.max(0, cleanliness - 2)
        energy = Math.max(0, energy - (isNight ? 3 : 2))
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
        if (pet) pet.sayText(getRandomDialogue(), 1000, false)
        updateStatusBars()
        updatePetState()
        if (health <= 0) {
            gameOver()
        }
    }
})

/**
 * 简单难度 16000ms 衰减
 */
game.onUpdateInterval(16000, () => {
    if (gameRunning && pet && !sleeping && configMenuState == MenuState.Closed && nameMenuState == MenuState.Closed) {
        if (currentDifficulty != Difficulty.Easy) return;
        // 状态自动衰减
        hunger = Math.max(0, hunger - 3)
        happiness = Math.max(0, happiness - 2)
        health = Math.max(0, health - 1)
        cleanliness = Math.max(0, cleanliness - 2)
        energy = Math.max(0, energy - (isNight ? 3 : 2))
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
        if (pet) pet.sayText(getRandomDialogue(), 1000, false)
        updateStatusBars()
        updatePetState()
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
    // 清除存档标记与配置完成标记，避免下次启动加载到结束状态，并写入默认初始状态
    settings.writeString(SAVE_FLAG_KEY, "0")
    settings.writeString(CONFIG_DONE_KEY, "0")
    resetDefaults()
    saveProgress()

    game.showLongText("你的宠物因为缺乏照顾而离开了...\n记得要定期喂食、玩耍、治疗和清洁哦！", DialogLayout.Center)

    game.over(false)
}


/**
 * 实时更新UI显示（仅在宠物已创建且不在配置菜单时执行，避免清屏导致菜单黑屏）
 */
game.onUpdateInterval(1000, () => {
    if (gameRunning && pet && configMenuState == MenuState.Closed && nameMenuState == MenuState.Closed) {
        updateStatusBars()
        if (sleeping) {
            pet.sayText(sleepSayToggle ? "ZzZ..." : "zZz...", 1000, false)
            sleepSayToggle = !sleepSayToggle
        }
    }
})

/**
 * 自动存档：每10秒后台静默保存一次
 * 不提示，不改变UI
 */
game.onUpdateInterval(10000, () => {
    if (gameRunning) {
        saveProgress()
    }
})

/**
 * 调试组合键检测：A+B 同时按下清空存档并重启
 * 采用短周期检测与1秒去抖，避免误触与连触
 */
game.onUpdateInterval(100, () => {
    if (!DEBUG_MODE) return
    if (controller.down.isPressed() && controller.A.isPressed() && controller.B.isPressed()) {
        const now = game.runtime()
        if (now - lastDebugResetTime > 1000) {
            lastDebugResetTime = now
            debugResetGame()
        }
    }
})

/**
 * 隐藏金手指：方向上+A+B 同时按下增加 1000 金钱
 * 独立于 DEBUG_MODE，采用1秒去抖
 */
game.onUpdateInterval(100, () => {
    if (controller.up.isPressed() && controller.A.isPressed() && controller.B.isPressed()) {
        const now = game.runtime()
        if (now - lastCheatTime > 1000) {
            lastCheatTime = now
            money += 1000
            updateStatusBars()
            effects.confetti.startScreenEffect(500)
            music.playTone(880, 120)
        }
    }
})

/**
 * 首次配置：难度选择菜单
 */
function showDifficultyMenu() {
    if (configMenuState == MenuState.Open) return
    configMenuState = MenuState.Open

    const bg = sprites.create(image.create(160, 120), MenuKind)
    bg.image.fill(menuBgColor)
    bg.setPosition(80, 60)

    const titleImg = image.create(80, menuTitleHeight)
    titleImg.print("选择难度", 14, 0, menuTitleColor)
    const title = sprites.create(titleImg, MenuKind)
    title.setPosition(menuTitlePositionX, menuTitlePositionY)

    const labels = ["简单", "普通", "困难"]
    for (let i = 0; i < labels.length; i++) {
        const choiceImg = image.create(40, 18)
        if (i == selectedDifficultyIndex) {
            choiceImg.fill(menuSelectedFontBgColor)
            choiceImg.print(labels[i], 8, 3, menuSelectedFontColor)
        } else {
            choiceImg.fill(menuFontBgColor)
            choiceImg.print(labels[i], 8, 3, menuFontColor)
        }
        const s = sprites.create(choiceImg, MenuKind)
        s.setPosition(80, 40 + i * 25)
    }

    const hintImg = image.create(menuBarWidth, menuBarHeight)
    hintImg.fill(menuBarBgColor)
    hintImg.print("上下选择 A确认", 3, 3, menuBarFontColor)
    hintImg.print(VERSION, 120, 7, menuBarFontColor)

    const hint = sprites.create(hintImg, MenuKind)
    hint.setPosition(menuBarPositionX, menuBarPositionY)
    updateStatusBars()
}

function proceedToNameMenu() {
    sprites.destroyAllSpritesOfKind(MenuKind)
    configMenuState = MenuState.Closed
    // 进入昵称菜单前，随机一个初始昵称（全量均匀）
    selectedNameIndex = getNextRandomNameIndex()
    showNameMenu()
}

function showNameMenu() {
    if (nameMenuState == MenuState.Open) return
    nameMenuState = MenuState.Open

    const bg = sprites.create(image.create(160, 120), MenuKind)
    bg.image.fill(menuBgColor)
    bg.setPosition(80, 60)

    const titleImg = image.create(80, menuTitleHeight)
    titleImg.print("选择昵称", 14, 0, menuTitleColor)
    const title = sprites.create(titleImg, MenuKind)
    title.setPosition(menuTitlePositionX, menuTitlePositionY)

    // 仅显示当前随机昵称（不再支持上下选择列表）
    const itemImg = image.create(40, 20)
    itemImg.fill(menuSelectedFontBgColor)
    itemImg.print(nameCandidates[selectedNameIndex] || "未命名", 8, 3, menuSelectedFontColor)
    const s = sprites.create(itemImg, MenuKind)
    s.setPosition(80, 60)

    const hintImg = image.create(menuBarWidth, menuBarHeight)
    hintImg.fill(menuBarBgColor)
    hintImg.print("A确认 B随机", 3, 3, menuBarFontColor)
    const hint = sprites.create(hintImg, MenuKind)
    hint.setPosition(menuBarPositionX, menuBarPositionY)
    updateStatusBars()
}

function finishConfigAndStart() {
    currentDifficulty = selectedDifficultyIndex as Difficulty
    petName = nameCandidates[selectedNameIndex] || petName
    // 标记首次配置完成
    settings.writeString(CONFIG_DONE_KEY, "1")
    saveProgress()

    sprites.destroyAllSpritesOfKind(MenuKind)
    nameMenuState = MenuState.Closed

    pet = sprites.create(assets.image`petNormal`, SpriteKind.Player)
    pet.setPosition(80, 80)
    createUI()
    startPetAnimation()
    game.showLongText("欢迎来到电子宠物世界！\n照顾好你的宠物，让它健康快乐地成长！", DialogLayout.Center)
    game.showLongText("菜单:功能 方向:选择\nA:确认 B:返回", DialogLayout.Bottom)
    lastUpdateTime = game.runtime()
    effects.confetti.startScreenEffect(500)
    // 对话框关闭后，主动刷新一次文字精灵，避免初次不显示
    updateStatusBars()

}

// 启动游戏
initGame()
