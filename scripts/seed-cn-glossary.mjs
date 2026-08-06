/** Seed missing archive names with editable draft translations.
 * Existing reviewed/draft entries are never overwritten.
 * These drafts make the UI readable while the maintenance page remains the
 * source of truth for human review against the China-server terminology.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'src/data/locales/zh-CN/glossary.json');

const DRAFTS = {
    Talon: '黑爪',
    'The Chernobog Conspiracy': '切尔诺博格阴谋',
    IJC: '国际正义委员会',
    'The Sombra Collective': '黑影集体',
    'The Phreaks': 'Phreaks帮',
    'La Coterie': '同盟会',
    'Los Muertos': '亡者',
    'Crusader Initiative': '十字军计划',
    'Inti Warriors': '因蒂勇士',
    'Caribbean Coalition': '加勒比联盟',
    'Deep Sea Raiders': '深海掠夺者',
    'Colloseo Gladiatori': '斗兽场角斗士',
    'Helix Securities': '赫利克斯安保',
    'The Anubis Omnic Crisis': '阿努比斯智械危机',
    'Ironclad Guild': '铁甲公会',
    'Lucheng Interstellar': '路城国际',
    'Oasis Ministries': '绿洲部门',
    'Pacific Energy Solutions': '太平洋能源方案',
    'The Martins Collective': '马丁斯集团',
    'Lumérico Incorporated': '卢梅里科公司',
    'Heliotech Industries': '赫利俄斯科技',
    'Wuxing University': '五行大学',
    'Yamagami Blades': '山神刀刃',
    'Wayfinder Society': '探路者协会',
    Ecopoints: '生态监测站',
    Numbani: '努巴尼',
    Casino: '卡西诺',
    'Dae-Hyun': '大贤',
    King: '金',
    Overlord: '霸王',
    Boomslang: '树蛇',
    Jackdaw: '寒鸦',
    Revel: '雷维尔',
    Susannah: '苏珊娜',
    'Touch Up': '补妆',
    'B.O.B': 'B.O.B',
    Bars: '巴斯',
    Bez: '贝兹',
    Frankie: '弗兰基',
    'The Triplets': '三胞胎',
    Chisaka: '千坂',
    Nobuto: '信人',
    Ryota: '良太',
    Sakura: '樱',
    Asa: '朝',
    'Kamori-san': '鸭森先生',
    Sojiro: '宗次郎',
    Toshiro: '敏郎',
    Geiger: '盖格',
    Mason: '梅森',
    Meri: '梅里',
    Chao: '赵',
    Harold: '哈罗德',
    Jiayi: '嘉怡',
    Adawe: '阿达维',
    Athena: '雅典娜',
    Claudio: '克劳迪奥',
    Efi: '伊菲',
    'Gérard': '杰拉德',
    Hector: '赫克托',
    Liao: '廖',
    Adeyemi: '阿德耶米',
    Antonio: '安东尼奥',
    Maximillien: '马克西米利安',
    Ngumi: '恩古米',
    Sanjay: '桑杰',
    Vialli: '维亚利',
    Alisa: '阿丽莎',
    Anubis: '阿努比斯',
    Aurora: '奥罗拉',
    Balderich: '巴尔德里希',
    Bhatt: '巴特',
    Katya: '卡佳',
    Mondatta: '蒙达塔',
    Naughton: '诺顿',
    Osai: '奥赛',
    Portero: '波特罗',
    Emily: '艾米丽',
    Iggy: '伊吉',
    Ingrid: '英格丽德',
    Kendra: '肯德拉',
    Lanet: '拉内特',
    'Lynx 17': '山猫17',
    Nameless: '无名',
    Sven: '斯文',
    Vincent: '文森特',
    Zera: '泽拉',
    Kace: '凯斯',
};

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
data.terms ||= {};
let added = 0;
for (const [source, target] of Object.entries(DRAFTS)) {
    if (data.terms[source]) continue;
    data.terms[source] = {
        target,
        status: 'draft',
        source: '自动初译，待国服核对',
    };
    added += 1;
}
fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log(`[glossary] added ${added} editable draft terms`);
