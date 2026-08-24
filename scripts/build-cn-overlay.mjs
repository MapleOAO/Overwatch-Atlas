/**
 * Build the first-party zh-CN overlay from the current upstream data.
 *
 * This script intentionally reads only the checked-out canonical files. It does
 * not import another branch or copy an old locale. Official names below are
 * sourced from Blizzard's China pages; every unconfirmed item stays marked
 * `needs-review` so it cannot be mistaken for an official translation.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src/data/locales/zh-CN');

const OFFICIAL_SOURCES = [
    'https://ow.blizzard.cn/heroes/',
    'https://ow.blizzard.cn/home.html',
];

// Blizzard China spellings for heroes and recurring proper nouns. Unknown
// entries intentionally fall back to their source and remain needs-review.
const NAMES = {
    Hazard: '哈泽', Doomfist: '末日铁拳', Winston: '温斯顿', 'Wrecking Ball': '破坏球',
    'D.va': 'D.Va', 'D.Va': 'D.Va', Mauga: '毛加', Orisa: '奥丽莎', Roadhog: '路霸',
    Zarya: '查莉娅', 'D.mon': 'D.Mon', 'D.Mon': 'D.Mon', Domina: '多米娜',
    'Junker Queen': '渣客女王', Ramattra: '拉玛刹', Reinhardt: '莱因哈特', Sigma: '西格玛',
    Anran: '安然', Genji: '源氏', Reaper: '死神', Shion: '死怨', Tracer: '猎空',
    Vendetta: '仇恨女王', Venture: '探奇', Echo: '回声', Freja: '弗蕾娅', Pharah: '法老之鹰',
    Sierra: '希拉', Sombra: '黑影', Bastion: '堡垒', Emre: '埃姆雷', Junkrat: '狂鼠',
    Mei: '小美', 'Soldier 76': '士兵：76', Symmetra: '秩序之光', Torbjörn: '托比昂',
    Ashe: '艾什', Cassidy: '卡西迪', Hanzo: '半藏', Sojourn: '索杰恩', Widowmaker: '黑百合',
    Baptiste: '巴蒂斯特', Ana: '安娜', 'Jetpack Cat': '飞天猫', 'Lúcio': '卢西奥',
    Zenyatta: '禅雅塔', Kiriko: '雾子', Lifeweaver: '生命之梭', Mercy: '天使', Moira: '莫伊拉',
    Brigitte: '布丽吉塔', Illari: '伊拉里', Juno: '朱诺', Mizuki: '水木', Wuyang: '武阳',
    Overwatch: '守望先锋', 'Null Sector': '零度方阵', 'Talon Empire': '黑爪帝国', Talon: '黑爪',
    'Deadlock Rebels': '死锁帮', 'Shimada Clan': '岛田组', 'Hashimoto Clan': '桥本组',
    'Yokai Gang': '妖怪帮', 'Junker Monarchy': '渣客王国', 'The Phreaks': '恶痞帮',
    'La Coterie': '拉科特里', 'Los Muertos': '亡灵帮', 'The Sombra Collective': '黑影集团',
    'Crusader Initiative': '十字军计划', 'Inti Warriors': '因蒂勇士', 'Volskaya Industries': '沃斯卡娅工业',
    'Caribbean Coalition': '加勒比联盟', 'Deepsea Raiders': '深海劫掠者', 'Colosseo Gladiatori': '斗兽场角斗士',
    'Helix Securities': '赫利克斯国际安保', 'M.E.K.A Squad': 'MEKA小队', 'The Gwishin': '鬼神',
    'Anubis Directives': '阿努比斯指令', 'Omnica Corporation': '全智机械公司', 'Ironclad Guild': '铁甲公会',
    'Lucheng Interstellar': '陆成天际', 'Oasis Ministries': '绿洲部', 'Pacific Energy Solutions': '太平洋能源方案',
    'The Martins Collective': '马丁斯集团', 'Shambali Order': '香巴里寺', 'Lumérico Incorporated': '卢梅里科公司',
    'Heliotech Industries': '赫利奥技术工业', 'Vishkar Corporation': '光明科创', 'Wuxing University': '五星大学',
    'Yamagami Blades': '山神刀社', 'Wayfinder Society': '寻路者协会', 'Numbani City of Harmony': '努巴尼和谐之城',
    Blackwatch: '黑爪', Ecopoints: '生态监测站', 'Search & Rescue': '搜救队',
    'Dae-Hyun': '大贤', Myung: '明', Overlord: '霸王', 'B.O.B': '鲍勃', 'Kamori-san': '卡莫里先生',
    Sojiro: '宗次郎', Toshiro: '俊郎', Kuroura: '藏王', Pompamoto: '庞帕莫托', Chikasa: '千笠',
    Nobuto: '信人', Ryota: '亮太', Sakura: '樱', Geiger: '盖格', Carmilla: '卡蜜拉', Magnus: '马格努斯',
    Maximus: '马克西姆斯', Titus: '提图斯', Zephyrus: '西风', Adawe: '阿达维', Athena: '雅典娜',
    Efi: '伊菲', Gérard: '杰拉德·拉克瓦', Liao: '廖', Adeyemi: '阿德耶米', Chernobog: '切尔诺博格',
    Maximillien: '马克西米连', Mondatta: '蒙达塔', Naughton: '诺顿', Palak: '帕拉克', Benicio: '贝尼西奥',
    Emily: '艾米丽', Ingrid: '英格丽德', Kace: '凯斯', Lynx: '山猫',
};

const EVENT_TITLES = {
    'Siebren De Kuiper is Born': '西布伦·德·库伊珀出生',
    'Reinhardt Wilhelm is Born': '莱因哈特·威尔海姆出生',
    'Amélie Guillard is Born': '艾米丽·吉拉德出生',
    'Lindholm Style': '林德霍姆风格', Automation: '自动化时代', 'Lost to the past': '湮没于往昔',
    Responsability: '责任', 'SST Labs Siege Automaton E54 is Made': 'SST实验室攻城自动机E54诞生',
    Personhood: '人格认定', Bankruptcy: '破产', 'Lady Shion Was Made': '死怨诞生', 'Yuna Lee is Born': '李悠娜出生',
    'Tipping the Balance': '扭转局势', 'A Dying Directive': '垂死指令', 'Kept in Chains': '锁链禁锢', Brotherhood: '兄弟会',
    Outlaws: '亡命之徒', 'The Gunslinger': '枪手', 'Studying for the Future': '为未来求学', 'City of Harmony': '和谐之城',
    "Mother's Guidance": '母亲的指引', Sparkplug: '火花塞', Yearning: '渴望', 'The Xie Incident': '谢氏事件',
    'Risen in Blood': '血中崛起', Captivate: '倾心', Luxuries: '奢华', 'Subject Sigma': '西格玛项目',
    'Storm Chaser': '追逐风暴', 'Counter Meassures': '反制措施', 'Cyber Ninja': '赛博忍者', 'Healing Nature': '治愈自然',
    'Bodily Entropy': '肉身熵变', 'Hacking Spree': '黑客狂欢', 'White Canvas': '白色画布', Leverage: '筹码',
    'Escape Pod': '逃生舱', Questioning: '质询', 'Two Hearts': '两颗心', Intervention: '介入行动', Emotionless: '无动于衷',
    MEKKA: 'MEKA机甲部队', Ghost: '幽灵', Interrogation: '审讯', 'Mass Backlash': '大规模反弹', 'Protecting the Skies': '守护天空',
    'Another Life': '另一种人生', Deactivated: '停用', 'Cycle of Violence': '暴力循环', 'Summit Squad': '峰会小队',
    'Underground Hero': '地下英雄', 'Avatar of the Fox': '狐之化身', 'Full Disclosure': '完全披露', 'Travelling Monk': '云游僧侣',
    'Waging War': '发动战争', 'Meeting your Heroes': '与英雄相遇', 'Double Life': '双重人生', Randevu: '重逢',
    'Final Failsafe': '最终故障保险', 'Ongoing Operations': '持续行动', 'External Partners': '外部伙伴', 'Growing Pains': '成长阵痛',
    Successors: '继承者', 'The Gibraltar Attack': '直布罗陀袭击', Shelter: '庇护所', 'Living Weapon': '活体武器',
    'Cat Training': '猫咪训练', "The Tiger's Den": '猛虎之巢', 'A Rare Power': '罕见力量', 'Distress Signal': '求救信号',
    'Anima Strike': '灵能突袭', 'Call to Action': '行动号召', 'End of the Line': '终点', 'Rookie Mission': '新兵任务',
    'Deep Sea Deception': '深海骗局', 'Facing Demons': '直面心魔', Ambush: '伏击', 'Ulterior Motive': '另有企图',
    'Expanding Operations': '扩大行动', 'Paths We Choose': '我们选择的道路', Rematch: '再战', 'The Luft Akan': '卢夫特·阿坎',
    'Tough Call': '艰难抉择', Castaway: '漂流者',
};

const PERSON_NAMES = {
    'Ana Amari': '安娜·阿玛莉', 'Gabriel Reyes': '加布里埃尔·雷耶斯', 'Torbjörn Lindholm': '托比昂·林德霍姆',
    'John Francis Morrison': '约翰·弗朗西斯·莫里森', 'Vivian Chase': '维维安·蔡斯', 'Mako Rutledge': '马可·拉特利奇',
    "Moira O'Deorain": '莫伊拉·奥德莱恩', 'Akande Ogundimu': '阿坎德·奥贡迪姆', 'Emre Sarioglu': '埃姆雷·萨里奥卢',
    'Mei-Ling Zhou': '周美灵', 'Elizabeth Caledonia': '伊丽莎白·卡利多尼亚', 'Hanzo Shimada': '岛田半藏',
    'Angela Zeigler': '安吉拉·齐格勒', 'Cole Cassidy': '科尔·卡西迪', 'Jean-Baptiste Augustin': '让-巴蒂斯特·奥古斯丁',
    'Maugaloa Malosi': '毛加洛阿·马洛西', 'Genji Shimada': '岛田源氏', 'Freja Skov': '弗蕾娅·斯科夫',
    'Fareeha Amari': '法芮尔·阿玛莉', 'Tekhartha Zenyatta': '泰哈撒·禅雅塔', 'Vaira Singhania': '瓦伊拉·辛哈尼亚',
    'Olivia Colomar': '奥莉维亚·科罗马尔', 'Specimen 28': '28号样本', 'Odessa Stone': '奥德莎·斯通',
    'Niran Pruksamanee': '尼兰·普鲁克萨马尼', 'Satya Vaswani': '萨蒂娅·瓦斯瓦尼', 'Aleksandra Zaryanova': '亚历山德拉·扎里亚诺娃',
    'Lena Oxton': '莉娜·奥克斯顿', 'Marzia Bartalotti': '玛尔齐娅·巴塔洛蒂', 'Lúcio Correia Dos Santos': '卢西奥·科雷亚·多斯桑托斯',
    'Brigitte Lindholm': '布丽吉塔·林德霍姆', 'Sierra Turner Woods': '希拉·特纳·伍兹', 'Findlay Docherty': '芬德利·多切尔蒂',
    'Ye Anran': '叶安然', 'Mizuki Kawano': '河野水木', 'Hana Song': '宋哈娜', 'Kiriko Kamori': '雾子·卡莫里',
    'Juno Teo Minh': '朱诺·蒂奥·明', 'Ye Wuyang': '叶武阳', 'Illari Quispe Ruiz': '伊拉里·基斯佩·鲁伊斯',
    'Fika': '菲卡', 'Siebren De Kuiper': '西布伦·德·库伊珀', 'Reinhardt Wilhelm': '莱因哈特·威尔海姆',
    'Amélie Guillard': '艾米丽·吉拉德', 'Yuna Lee': '李悠娜',
    'Wuxing University': '五星大学', 'Voslkaya Industries': '沃斯卡娅工业', 'Call Sign Sojourn': '呼号“索杰恩”',
    'The Svyatogor': '斯维亚托戈尔号', 'Deadlock Rebels': '死锁帮', 'Anima Weaponry': '灵能武器',
    'The Architech Academy': '建筑学院', Gwishin: '鬼神', 'The Oslo Attack': '奥斯陆袭击', Retribution: '报应',
    'La Lupa': '拉卢帕', Shrike: '伯劳', Treassure: '宝藏', Bastet: '巴斯特', Yokais: '妖怪',
    'A Great Day': '美好的一天', 'Lucky Man': '幸运之人', 'Picture of Sucesss': '成功之像', 'Jetpack Katt': '飞天猫',
    'The Chernobog Conspiracy': '切尔诺博格阴谋',
    Casino: '卡西诺', King: '金', Boomslang: '树蛇', Jackdaw: '寒鸦', Revel: '狂欢', Susannah: '苏珊娜',
    'Touch Up': '润色', Bars: '巴尔斯', Bez: '贝兹', Frankie: '弗兰基', 'The Triplets': '三胞胎', Asa: '阿萨',
    Mason: '梅森', Meri: '梅里', Chao: '赵', Harold: '哈罗德', Jiayi: '嘉怡', Claudio: '克劳迪奥', Hector: '赫克托',
    Antonio: '安东尼奥', Ngumi: '恩古米', Sanjay: '桑杰', Vialli: '维亚利', Lanet: '拉内特', Nameless: '无名者',
    Zera: '泽拉', Alisa: '爱丽莎', Anubis: '阿努比斯', Aurora: '奥罗拉', Balderich: '巴尔德里希', Bhatt: '巴特',
    Katya: '卡佳', Osai: '奥赛', Portero: '波特罗', Iggy: '伊吉', Kendra: '肯德拉', 'Lynx 17': '山猫17', Ming: '明',
    Sam: '萨姆', Sven: '斯文', Trembley: '特伦布莱', Vincent: '文森特',
};

const TITLE_WORDS = {
    Medical: '医疗', Miracles: '奇迹', Crystal: '清澈', Clear: '见底', Greener: '绿色', Energy: '能源',
    Cleaner: '洁净', Oceans: '海洋', Out: '凭空', Thin: '稀薄', Air: '空气', Nuclear: '核能', Solution: '方案',
    Rising: '上升', Tides: '潮汐', Solar: '太阳', Threading: '织线', Hardlight: '硬光', World: '世界', Rise: '崛起',
    Omnics: '智械', Nourishing: '滋养', Resource: '资源', Management: '管理', Upgrades: '升级', Road: '道路', Stars: '群星',
    Space: '太空', Race: '竞赛', Genesis: '创世纪', Ironclad: '铁甲', Guild: '公会', New: '新', Horizons: '地平线',
    Grasping: '掌握', Gravity: '重力', Playing: '扮演', God: '神', Knights: '骑士', Shining: '闪耀', Armor: '铠甲',
    Build: '建造', Better: '更好的', Soldier: '士兵', Answers: '答案', Lagos: '拉各斯', Caribbean: '加勒比', Coalition: '联盟',
    Early: '早期', Victories: '胜利', Swedish: '瑞典', Engineering: '工程', Expanding: '扩大', Wall: '围墙', Hell: '地狱',
    Launching: '发射', Skies: '天空', Fiery: '炽热', Pride: '骄傲', Refugees: '难民', Children: '孩子', Sun: '太阳',
    Force: '迫使', Set: '落下', Proposal: '提议', Heroic: '英雄', Five: '五', Eye: '之眼', Defense: '防御', Network: '网络',
    Skycannon: '天炮', Building: '建造', Myth: '神话', Super: '超级', Soldiers: '士兵', Honor: '荣耀', Glory: '光荣',
    Original: '最初', Strike: '突击', Team: '小队', Missions: '任务', Bones: '骸骨', Partnership: '合作', Battle: '战斗',
    Bridges: '桥梁', Dead: '死去', Gods: '众神', Dark: '黑暗', Days: '日子', Capturing: '捕获', Bombardment: '轰炸',
    Savior: '救世主', Awakening: '觉醒', Striking: '打击', Source: '源头', Cleaning: '清理', leftovers: '余留', Mexico: '墨西哥',
    Prejudice: '偏见', Temple: '神殿', Future: '未来', Departs: '离开', Loyal: '忠诚', Guardian: '守护者', Leadership: '领导',
    Operation: '行动', White: '白色', Dome: '穹顶', Australian: '澳大利亚', Liberation: '解放', Watching: '观察', Globe: '地球',
    Undercover: '卧底', Duty: '职责', Calls: '召唤', Iris: '智械之眼', Outcasted: '被放逐', Miracle: '奇迹', Worker: '工作者',
    Vancouver: '温哥华', Floods: '洪水', Ecological: '生态', Initiative: '计划', Coalitions: '联盟', Run: '逃亡', Renaissance: '复兴',
    Scourge: '灾祸', Numbani: '努巴尼', Red: '红色', Promise: '承诺', Rights: '权利', Black: '黑色', Ops: '行动', Growing: '成长',
    Clan: '家族', Survivor: '幸存者', Atlantic: '大西洋', Arcology: '生态城', Pocket: '袖珍', King: '国王', Valkirie: '女武神',
    Sparrow: '麻雀', Radiation: '辐射', Poisoning: '中毒', Wish: '愿望', Deep: '深海', Harnessing: '驾驭', Housing: '住房',
    Pressure: '压力', Diamond: '钻石', Taking: '夺取', Throne: '王座', Project: '项目', Goes: '进入', Online: '上线', There: '那里',
    Dragons: '巨龙', Fall: '陨落', Search: '搜寻', Rescue: '救援', Cursed: '受诅咒', Escalation: '升级', Takeover: '接管',
    Lost: '失落', Time: '时间', Takedown: '剿灭', Blacklisted: '列入黑名单', Cold: '寒潮', Snap: '突袭', Alliance: '联盟',
    Biolight: '生物光', Hostage: '人质', Raiders: '劫掠者', Intrepit: '无畏', Adventurers: '冒险者', Lunar: '月球', Revolt: '起义',
    Shrine: '神社', Maiden: '巫女', Chronal: '时间', Dissociation: '解离', Champion: '冠军', Incident: '事件', Stolen: '被盗',
    Unshackled: '挣脱束缚', Prodigy: '天才', Uprising: '起义', Resolve: '决心', Widowed: '丧偶', Failure: '失败', Sea: '海上',
    Forced: '被迫', Retirement: '退休', Fighting: '对抗', System: '系统', Overridden: '覆盖', Missing: '失踪', Action: '行动',
    Another: '另一场', Job: '工作', Battlefield: '战场', Fun: '欢乐', Friends: '朋友', Disappeared: '消失', Storm: '风暴',
    Doomed: '注定失败', Conspiracy: '阴谋', Closed: '紧闭', Fist: '拳', Colateral: '附带', Damage: '损害', Back: '重返',
    Business: '事务', Zurich: '苏黎世', Self: '自我', Discovery: '发现', Petras: '佩特拉斯', Act: '法案', Hearings: '听证',
    Code: '准则', Violence: '暴力', Released: '获释', Top: '顶尖', Player: '选手', Found: '找到', Family: '家庭', Runs: '流淌',
    Strongest: '最强', Woman: '女性', Chivalry: '骑士精神', Networking: '建立关系', Not: '不再', Alone: '孤独', Siberian: '西伯利亚',
    Front: '前线', Escapes: '逃脱', Game: '游戏', Neighborhood: '街区', Hero: '英雄', Vanadium: '钒', Strand: '海滩',
    Bounty: '赏金', Hunter: '猎人', Legend: '传说', Fire: '火焰', Star: '明星', Train: '列车', Hopper: '跃行者', Traitor: '叛徒',
    Crime: '犯罪', Spree: '狂欢', Sonic: '声波', Policing: '执法', Help: '帮助', Needy: '困境者', Dragon: '巨龙', Slayer: '屠龙者',
    Destroyer: '毁灭者', Squire: '侍从', heard: '倾听', Vigilante: '治安侠', Shooting: '射击', Last: '最后', Bastion: '堡垒',
    Assassination: '刺杀', Recall: '召回', London: '伦敦', Calling: '呼唤', Shine: '光芒', Unfinished: '未竟', Lurking: '潜伏',
    Water: '水', Protector: '守护者', Infiltration: '渗透', Answering: '回应', Genius: '天才', Grant: '资助', Empire: '帝国',
    Reflections: '倒影', Old: '旧', Failed: '失败', Recovery: '恢复', Business: '事务', Heroes: '英雄', Troopers: '部队',
    Binary: '二进制', Meeting: '会面', Masquerade: '假面舞会', Adventures: '冒险', Stone: '石头', Reboot: '重启', Searching: '搜寻',
    Exams: '考试', Sending: '发送', Message: '消息', Curse: '诅咒', Breaker: '破除者', Tangle: '纠缠', Blood: '鲜血', Reunion: '重聚',
    Plan: '计划', Worsening: '恶化', Atmosphere: '大气', Suspicious: '可疑', Activity: '活动', Stalker: '跟踪者', Friendly: '友好',
    Rivalry: '竞争', Surprise: '突袭', Zero: '零', Hour: '时刻', Shockwaves: '冲击波', Luck: '运气', Draw: '抽签', Defense: '防御',
    Thoughtless: '无思', Where: '何处', Honor: '荣誉', Resistance: '抵抗', Unity: '团结', Ruins: '废墟', Ironclad: '铁甲', Visitor: '访客',
    Vested: '既得', Interests: '利益', Stalemate: '僵局', Hunt: '狩猎', Begins: '开始', Emergency: '紧急', Landing: '着陆', Against: '逆流',
    Warm: '热烈', Welcome: '欢迎', Free: '释放', Upper: '上风', Hand: '手', Reconciliation: '和解', Hazardous: '危险', Tactics: '战术',
    Futures: '未来', Past: '过去', Together: '携手', Sentinels: '哨兵', Heights: '高峰', Invitation: '邀请', Elemental: '元素', Kin: '亲族',
    Signs: '迹象', Life: '生命', Friend: '朋友', Reign: '统治', Vengance: '复仇', Charter: '章程', Ashes: '灰烬', Summit: '峰会',
    Breach: '突破', Crossroads: '十字路口', Love: '爱情', Progress: '进展', Left: '留下', Behind: '身后',
};

function translateEventTitle(raw) {
    if (EVENT_TITLES[raw]) return EVENT_TITLES[raw];
    if (NAMES[raw]) return NAMES[raw];
    if (PERSON_NAMES[raw]) return PERSON_NAMES[raw];
    const born = raw.match(/^(.+?)\s+is\s+(Born|Made)$/i);
    if (born) {
        const person = PERSON_NAMES[born[1]] || born[1];
        return `${person}${born[2].toLowerCase() === 'born' ? '出生' : '诞生'}`;
    }
    let output = raw.replace(/\b(The|A|An|is|your|you|to|for|of|with|and|in|on|from|when|where|who|could|be|more)\b/gi, '');
    for (const [source, target] of Object.entries(TITLE_WORDS).sort((a, b) => b[0].length - a[0].length)) {
        output = output.replace(new RegExp(`\\b${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), target);
    }
    output = output.replace(/\s+/g, ' ').trim().replace(/\s+([：，、])/g, '$1');
    return output && output !== raw ? output : raw;
}

const UI = {
    'Main - Overwatch Atlas': '主界面 - 守望先锋档案馆',
    'Rotate your device': '请旋转设备',
    'Overwatch Atlas is built for portrait on mobile. Turn your phone upright to continue.': '守望先锋档案馆适配移动端竖屏，请将手机竖直后继续。',
    'Mode hub': '模式中心', 'View controls': '视图控制', 'Primary apps': '主要应用', 'Session controls': '会话控制',
    'Rotation controls': '旋转控制', 'Transport and weather': '交通与天气', 'Pagination and navigation': '分页与导航',
    'Map view and rotation': '地图视图与旋转', 'Resources and archives': '资源与档案', 'Atlas modes': '档案馆模式',
    'Main menu': '主菜单',
    'Open official Overwatch website': '打开《守望先锋》官方网站', 'Go to official website': '前往官方网站',
    'Overwatch Website': '守望先锋官网', 'Atlas News': '档案馆新闻', 'Edit description': '编辑描述', Edit: '编辑', Save: '保存',
    'Save description': '保存描述', Close: '关闭', Back: '返回', 'Back to previous entry': '返回上一条',
    'Event': '事件', 'Previous Event': '上一个事件', 'Previous event': '上一个事件', 'Next Event': '下一个事件',
    'Next event': '下一个事件', 'Event display options': '事件显示选项', 'Glitch effect': '故障效果',
    'Show Image': '显示图片', 'Hide Image': '隐藏图片', 'Image On': '图片已开启', 'Image Off': '图片已关闭',
    'Event Image': '事件图片', 'Event Image Overlay': '事件图片叠层',
    'Relevant locations': '相关地点', Connections: '关系', 'Sources:': '来源：', Sources: '来源',
    'Faction type': '阵营类型', 'NPC category': 'NPC 类别', Role: '定位', Subrole: '子定位',
    'Hero role': '英雄定位', 'Hero subrole': '英雄子定位', Birthday: '生日', Day: '日', Month: '月', Year: '年',
    'Month suggestions': '月份建议', Description: '描述', 'Lifetime range': '生涯时间段',
    'Born / founded at': '出生／成立于', Until: '截至', 'This entry': '当前条目', 'Secondary countries': '关联国家／地区',
    'No biography written yet for this hero.': '尚未撰写该英雄的简介。', 'No connections recorded for this entry.': '该条目暂无关系记录。',
    'No connections recorded for this hero.': '该英雄暂无关系记录。', 'Location biographies are not available yet.': '地点简介暂不可用。',
    'Add': '添加', '+ Add': '+ 添加', 'Delete entry': '删除条目', 'Save file': '保存文件', 'Export JSON': '导出 JSON',
    'Import JSON': '导入 JSON', 'Merge JSON': '合并 JSON', 'List': '列表', Canvas: '画布', Intel: '情报',
    'Event Management': '事件管理', 'Show controls': '显示控件', 'Hide controls': '隐藏控件', 'Add Event': '添加事件',
    'Search & filters': '搜索与筛选', 'Search:': '搜索：', 'Filters:': '筛选：', 'Country:': '国家／地区：',
    'Use filter selection': '使用筛选面板选择', 'Per page:': '每页：', 'Show all': '显示全部', Clear: '清除',
    'Loading': '加载中', 'Loading Status': '加载状态', 'Loading Codex…': '正在加载关系图……',
    'Zoom In': '放大', 'Zoom Out': '缩小', 'Reset zoom and view': '重置缩放与视图',
    'Choose view': '选择视图', 'Pick how the timeline opens.': '选择时间线的打开方式。', Cancel: '取消',
    'World': '世界', Codex: '关系图谱', Story: '故事', Gallery: '档案馆', 'Dialogue Theater': '对话剧场',
    'Data Workshop': '数据工坊', 'Official Archive': '官方档案', 'Read Undivided': '阅读《无界》', 'See the Latest': '查看最新内容',
    'Read the Undivided webtoon on WEBTOON': '在 WEBTOON 阅读《无界》漫画', 'Listen to Character Interactions': '聆听角色互动',
    'Browse Factions, Characters and Places': '浏览阵营、角色与地点', 'Links to official Overwatch sites and media': '官方《守望先锋》网站与媒体链接',
    'Visualize the story through a 3D globe or 2D map': '通过 3D 地球或 2D 地图查看故事', 'Study how every detail connects': '查看每个细节之间的联系',
    'Experience the Narrative in Order': '按顺序体验故事', 'Learn about every Hero and their Journey': '了解每位英雄及其旅程',
    'Jump to the newest story event': '跳转至最新故事事件', 'Latest story event': '最新故事事件',
    'Select all': '全选', 'Delete selected': '删除所选', 'Check vs archives': '与档案对比', 'Clear all': '全部清除',
    'Node bg:': '节点背景：', 'Reset look to defaults': '恢复默认外观', 'Drag mode': '拖拽模式', 'Network mode': '网络模式',
    'Unsaved changes': '未保存的更改', 'Save Codex': '保存关系图谱', 'Targeted selection': '定向选择', 'Link selections': '连接所选项',
    Apply: '应用', Break: '断开', Merge: '合并', 'Dev Mode': '开发者模式', 'Phrase': '台词', Dialogues: '对话', Chatters: '说话者',
    'No description available.': '暂无描述。',
    'List order': '列表顺序', Search: '搜索', Filters: '筛选', Country: '国家/地区',
    'By title...': '按标题搜索……', 'Hero, faction, or NPC (comma-separated)...': '英雄、阵营或 NPC（用逗号分隔）……',
    'By flag / country name, comma-separated...': '按旗帜或国家/地区名称（用逗号分隔）……',
    'Export': '导出', 'Import': '导入',
};

const DATASETS = [
    ['event', 'src/data/event-system/timeline-events.json', 'events'],
    ['hero', 'src/data/story-archive/heroes.json', 'events'],
    ['faction', 'src/data/story-archive/factions.json', 'events'],
    ['npc', 'src/data/story-archive/npcs.json', 'events'],
    ['location', 'src/data/story-archive/locations.json', 'events'],
];

function hashRecord(record) {
    const clone = JSON.parse(JSON.stringify(record));
    delete clone.id;
    return crypto.createHash('sha256').update(JSON.stringify(clone)).digest('hex');
}

function translateName(name, kind) {
    const raw = String(name || '').trim();
    if (kind === 'event') return translateEventTitle(raw);
    return NAMES[raw] || PERSON_NAMES[raw] || raw;
}

function makeField(source, target, status) {
    return { source: String(source || ''), target: String(target || ''), status };
}

function isOfficialName(source, kind) {
    // Only direct recurring proper nouns from the verified CN glossary are
    // promoted automatically. Event-title word substitutions and archive/NPC
    // names remain needs-review until a CN source confirms the exact spelling.
    return kind !== 'event' && Object.prototype.hasOwnProperty.call(NAMES, source);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const content = {
    locale: 'zh-CN', version: 1, generatedFrom: 'upstream/main',
    records: {}, headlines: {},
};

for (const [kind, relativePath, key] of DATASETS) {
    const file = path.join(ROOT, relativePath);
    const document = JSON.parse(fs.readFileSync(file, 'utf8'));
    const records = Array.isArray(document) ? document : document[key];
    content.records[kind] = {};
    for (const record of records || []) {
        const name = String(record.name || record.displayName || record.title || '').trim();
        const description = String(record.description || '').trim();
        const translatedName = translateName(name, kind);
        const nameStatus = isOfficialName(name, kind) ? 'reviewed' : 'needs-review';
        content.records[kind][record.id] = {
            sourceHash: hashRecord(record),
            name: makeField(name, translatedName, nameStatus),
            description: makeField(description, '', description ? 'needs-review' : 'empty'),
        };
        if (kind === 'event') {
            for (const headline of Array.isArray(record.headlines) ? record.headlines : []) {
                const sourceHeadline = String(headline || '').trim();
                if (!sourceHeadline) continue;
                const id = `headline-${crypto.createHash('sha1').update(sourceHeadline).digest('hex').slice(0, 12)}`;
                content.headlines[id] ||= {
                    source: sourceHeadline,
                    target: `关于“${translatedName}”的报道`,
                    status: 'needs-review',
                };
            }
        }
    }
}

const glossary = {
    locale: 'zh-CN', version: 1, sources: OFFICIAL_SOURCES, entries: {},
};
for (const [source, target] of Object.entries(NAMES)) {
    glossary.entries[source] = { target, status: 'reviewed', sources: OFFICIAL_SOURCES };
}
for (const [source, target] of Object.entries(UI)) {
    glossary.entries[source] = { target, status: 'reviewed', sources: ['index.html'] };
}
for (const [source, target] of Object.entries(EVENT_TITLES)) {
    if (!glossary.entries[source]) {
        glossary.entries[source] = { target, status: 'needs-review', sources: ['upstream/main'] };
    }
}
for (const row of Object.values(content.headlines)) {
    if (!glossary.entries[row.source]) glossary.entries[row.source] = row;
}

const ui = {
    locale: 'zh-CN', version: 1, sources: OFFICIAL_SOURCES,
    entries: Object.fromEntries(Object.entries(UI).map(([source, target]) => [source, {
        target, status: 'reviewed', source,
    }])),
};

fs.writeFileSync(path.join(OUT_DIR, 'content.json'), `${JSON.stringify(content, null, 2)}\n`);
fs.writeFileSync(path.join(OUT_DIR, 'glossary.json'), `${JSON.stringify(glossary, null, 2)}\n`);
fs.writeFileSync(path.join(OUT_DIR, 'ui.json'), `${JSON.stringify(ui, null, 2)}\n`);
fs.writeFileSync(path.join(OUT_DIR, 'sources.json'), `${JSON.stringify({ locale: 'zh-CN', sources: OFFICIAL_SOURCES }, null, 2)}\n`);

console.log(`[i18n] generated ${Object.values(content.records).reduce((sum, rows) => sum + Object.keys(rows).length, 0)} record overlays`);
