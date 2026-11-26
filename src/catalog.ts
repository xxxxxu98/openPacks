import type { CardDef, Rarity } from "./odds";
import type { PackDef } from "./art";

/** 按给定张数把名单依次标成金、闪、超稀有、稀有和普通 */
function spread(packId: string, names: string[], gold: number, flash: number, superRare: number, rare: number): CardDef[] {
  const plan: Rarity[] = [
    ...Array(gold).fill("gold"),
    ...Array(flash).fill("flash"),
    ...Array(superRare).fill("super"),
    ...Array(rare).fill("rare"),
    ...Array(names.length - gold - flash - superRare - rare).fill("common"),
  ];
  return names.map((name, index) => ({
    id: `${packId}-${index + 1}`,
    name,
    rarity: plan[index],
  }));
}

function pack(id: string, name: string, cards: CardDef[]): PackDef {
  return { id, name, seriesId: id, seriesName: name, cards };
}

const danqing: CardDef[] = [
  { id: "danqing-1", name: "群虾", rarity: "flash", source: "齐白石《虾》" },
  { id: "danqing-2", name: "清明上河", rarity: "gold", source: "清明上河图" },
  { id: "danqing-3", name: "千里江山", rarity: "gold", source: "千里江山图" },
  { id: "danqing-4", name: "富春山居", rarity: "super", source: "富春山居图" },
  { id: "danqing-5", name: "洛神", rarity: "flash", source: "洛神赋图" },
  { id: "danqing-6", name: "夜宴", rarity: "super", source: "韩熙载夜宴图" },
  { id: "danqing-7", name: "步辇", rarity: "common", source: "步辇图" },
  { id: "danqing-8", name: "虢国夫人", rarity: "common", source: "虢国夫人游春图" },
  { id: "danqing-9", name: "簪花", rarity: "common", source: "簪花仕女图" },
  { id: "danqing-10", name: "五牛", rarity: "common", source: "五牛图" },
  { id: "danqing-11", name: "照夜白", rarity: "common", source: "照夜白图" },
  { id: "danqing-12", name: "溪山行旅", rarity: "rare", source: "溪山行旅图" },
  { id: "danqing-13", name: "早春", rarity: "rare", source: "早春图" },
  { id: "danqing-14", name: "游春", rarity: "rare", source: "游春图" },
  { id: "danqing-15", name: "汉宫春晓", rarity: "rare", source: "汉宫春晓图" },
  { id: "danqing-16", name: "朝元", rarity: "common", source: "八十七神仙卷" },
  { id: "danqing-17", name: "兰竹", rarity: "common", source: "郑板桥兰竹" },
  { id: "danqing-18", name: "奔马", rarity: "common", source: "徐悲鸿《奔马》" },
  { id: "danqing-19", name: "桃实", rarity: "common", source: "吴昌硕《桃实图》" },
  { id: "danqing-20", name: "雄视", rarity: "common", source: "潘天寿《雄视》" },
  { id: "danqing-21", name: "飞天", rarity: "rare", source: "敦煌壁画飞天" },
  { id: "danqing-22", name: "九色鹿", rarity: "rare", source: "敦煌壁画九色鹿" },
  { id: "danqing-23", name: "兰亭", rarity: "super", source: "王羲之《兰亭序》" },
  { id: "danqing-24", name: "祭侄稿", rarity: "common", source: "颜真卿《祭侄文稿》" },
  { id: "danqing-25", name: "寒食", rarity: "common", source: "苏轼《黄州寒食诗帖》" },
  { id: "danqing-26", name: "蜀素帖", rarity: "common", source: "米芾《蜀素帖》" },
  { id: "danqing-27", name: "自叙帖", rarity: "common", source: "怀素《自叙帖》" },
  { id: "danqing-28", name: "玄秘塔", rarity: "common", source: "柳公权《玄秘塔碑》" },
];

export const PACKS: PackDef[] = [
  pack("danqing", "丹青", danqing),
  pack("suihua", "岁华", spread("suihua", [
    "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑",
    "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至", "小寒", "大寒",
  ], 1, 2, 3, 6)),
  pack("shierchen", "十二辰", spread("shierchen", [
    "虎", "鼠", "牛", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪",
  ], 1, 2, 1, 2)),
  pack("shanhai", "山海", spread("shanhai", [
    "精卫", "九尾狐", "烛龙", "相柳", "穷奇", "毕方", "夔", "应龙", "陆吾", "英招", "帝江", "三足乌",
    "猰貐", "化蛇", "蛊雕", "天狗", "当康", "文鳐", "何罗", "赤鱬", "旋龟", "夫诸", "狰", "鬼车",
  ], 1, 2, 3, 6)),
  pack("weimian", "未眠", spread("weimian", [
    "掌柜", "夜生", "侍女", "货郎", "雨客", "灯童", "守柜", "扫阶", "送信", "看门",
    "邻座", "醉客", "更夫", "报童", "药师", "画工", "过客",
  ], 1, 2, 2, 4)),
  pack("tieyi", "铁衣", spread("tieyi", [
    "左骑", "右骑", "盾卫", "戟卫", "弓卫", "号手", "旗手", "铸师", "磨刃", "门卫",
    "巡夜", "拾骨", "葬铃", "先锋", "殿后", "王旗", "副将",
  ], 1, 2, 2, 4)),
  pack("hongqu", "红氍", spread("hongqu", [
    "班主", "老生", "小生", "花旦", "青衣", "花脸", "丑角", "武生", "琴师", "鼓师",
    "提灯", "检场", "司衣", "学徒", "看客", "票友", "司幕",
  ], 1, 2, 2, 4)),
  pack("yandi", "檐滴", spread("yandi", [
    "主事", "助手", "雨客", "黑猫", "白猫", "车夫", "报信", "邻人", "店员", "画师",
    "医生", "学生", "老人", "船夫", "门房", "酒保", "夜归",
  ], 1, 2, 2, 4)),
  pack("xuanhai", "玄海", spread("xuanhai", [
    "灯笼鱼", "琵琶鱼", "皇带鱼", "大王乌贼", "幽灵蛸", "管水母", "宽咽鱼", "囊鳃鳗", "斧头鱼", "蝰鱼",
    "巨口鱼", "吞鳗", "栉水母", "水滴鱼", "尖牙鱼", "深海龙鱼", "琵琶鲨", "棘银鲛", "皇冠水母", "十字水母",
  ], 1, 2, 2, 4)),
  pack("qunfang", "群芳", spread("qunfang", [
    "牡丹", "芍药", "荷花", "菊花", "梅花", "兰花", "桃花", "杏花", "海棠", "玉兰", "芙蓉", "山茶",
    "杜鹃", "紫藤", "水仙", "茉莉", "桂花", "梨花", "李花", "石榴", "萱草", "蔷薇", "辛夷", "木槿",
  ], 1, 2, 3, 6)),
];
