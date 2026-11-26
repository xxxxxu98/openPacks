export type OwnedCard = { id: string; name: string };

export type SaveData = {
  packs: Record<string, number>;
  owned: Record<string, number>;
  names: Record<string, string>;
  cosmetics: { cover: string[]; sleeve: string[]; cloth: string[] };
  equipped: { cover: string; sleeve: string; cloth: string };
  current: { packId: string; cards: OwnedCard[]; shown: number } | null;
};

// 返回未眠三袋的初始存档
export function freshSave(): SaveData {
  return {
    packs: { weimian: 3 },
    owned: {},
    names: {},
    cosmetics: { cover: ["default"], sleeve: ["plain"], cloth: ["default"] },
    equipped: { cover: "default", sleeve: "plain", cloth: "default" },
    current: null,
  };
}

// 从 JSON 字符串解析存档，异常或缺字段时回到开局
export function loadSave(raw: string | null): SaveData {
  if (!raw) return freshSave();
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed.packs || typeof parsed.packs.weimian !== "number") return freshSave();
    return parsed;
  } catch {
    return freshSave();
  }
}

// 扣减一袋并记录本次开出的五张卡
export function commitOpen(save: SaveData, packId: string, cards: OwnedCard[]): SaveData {
  const left = save.packs[packId] ?? 0;
  if (left < 1) throw new Error("没有这个袋子");
  return {
    ...save,
    packs: { ...save.packs, [packId]: left - 1 },
    current: { packId, cards, shown: 0 },
  };
}

// 把当前包写入图鉴计数并清空 current
export function finishOpen(save: SaveData): SaveData {
  if (!save.current) return save;
  const owned = { ...save.owned };
  const names = { ...save.names };
  for (const card of save.current.cards) {
    owned[card.id] = (owned[card.id] ?? 0) + 1;
    names[card.id] = card.name;
  }
  return { ...save, owned, names, current: null };
}

// 指定卡包库存加一
export function buyPack(save: SaveData, packId: string): SaveData {
  return { ...save, packs: { ...save.packs, [packId]: (save.packs[packId] ?? 0) + 1 } };
}

// 解锁装饰（若未拥有）并设为当前装备
export function equip(save: SaveData, kind: "cover" | "sleeve" | "cloth", id: string): SaveData {
  const owned = save.cosmetics[kind].includes(id)
    ? save.cosmetics
    : { ...save.cosmetics, [kind]: [...save.cosmetics[kind], id] };
  return { ...save, cosmetics: owned, equipped: { ...save.equipped, [kind]: id } };
}