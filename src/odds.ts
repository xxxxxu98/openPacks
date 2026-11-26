export type Rarity = "common" | "rare" | "super" | "flash" | "gold";

export type CardDef = {
  id: string;
  name: string;
  rarity: Rarity;
  source?: string;
};

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 0.9275,
  rare: 0.06,
  super: 0.01,
  flash: 0.002,
  gold: 0.0005,
};

const ORDER: Rarity[] = ["common", "rare", "super", "flash", "gold"];

/** 由种子生成确定性伪随机数序列 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRarity(random: () => number): Rarity {
  const x = random();
  let acc = 0;
  for (const rarity of ORDER) {
    acc += RARITY_WEIGHT[rarity];
    if (x < acc) return rarity;
  }
  return "common";
}

/** 按稀有度权重随机抽取五张卡 */
export function rollFive(cards: CardDef[], random: () => number): CardDef[] {
  return Array.from({ length: 5 }, () => {
    const rarity = pickRarity(random);
    const pool = cards.filter((card) => card.rarity === rarity);
    if (pool.length === 0) throw new Error(`档位没有卡: ${rarity}`);
    return pool[Math.floor(random() * pool.length)];
  });
}

/** 将首张替换为该卡包中的金卡预览 */
export function withPreviewGold(drawn: CardDef[], cards: CardDef[]): CardDef[] {
  const gold = cards.find((card) => card.rarity === "gold");
  if (!gold) throw new Error("这包没有金卡");
  const next = drawn.slice();
  next[0] = gold;
  return next;
}