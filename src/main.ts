import "./styles.css";
import { PACKS } from "./catalog";
import { packArtReady, type PackDef } from "./art";
import { rollFive, withPreviewGold, type Rarity } from "./odds";
import { isOpened, tearProgress } from "./tear";
import {
  buyPack,
  commitOpen,
  equip,
  finishOpen,
  freshSave,
  loadSave,
  type SaveData,
} from "./save";
import { advance, initialReveal, PAUSE, type RevealState } from "./reveal";
import { mountCardViewer, OpenTable, type CardPose } from "./view3d";
import { renderHome } from "./ui/home";
import { renderShop, type ShopPack } from "./ui/shop";
import { renderDex } from "./ui/dex";
import { renderOpen, type OpenPack } from "./ui/open-view";
import { renderContents, renderInspect } from "./ui/overlay";
import { cardLayers, settledLayers } from "./ui/light";
import { openPrompt } from "./ui/open";

const SAVE_KEY = "open-packs-save";
const FLOAT_MS = 800;
const FLIP_MS = 700;
const LAND_MS = 500;
const RETRACT_MS = 350;

const RARITY_TABS: { id: Rarity; label: string }[] = [
  { id: "gold", label: "金卡" },
  { id: "flash", label: "闪卡" },
  { id: "super", label: "超稀有" },
  { id: "rare", label: "稀有" },
  { id: "common", label: "普通" },
];

type Route = "home" | "shop" | "open" | "dex";
type CosmeticKind = "cover" | "sleeve" | "cloth";
type OpenMode =
  | { kind: "pick" }
  | { kind: "sealed"; packId: string }
  | { kind: "show"; reveal: RevealState }
  | { kind: "bare"; packId: string };

const STARTER = freshSave();
const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("缺少 #app");

let save = loadSave(localStorage.getItem(SAVE_KEY));
let artFiles: Set<string> | null = null;
let route: Route = "home";
let dexRarity: Rarity = "gold";
let dexPackId = PACKS[0].id;
let selectedShopId: string | null = null;
let cosmeticKind: CosmeticKind | null = null;
let selectedOpenId: string | null = null;
let openMode: OpenMode = { kind: "pick" };
let tear = 0;
let tearDir: 1 | -1 = 1;
let drag: { pointerId: number; originX: number } | null = null;
let retract: { from: number; started: number } | null = null;
let lastTick = 0;

let stageEl: HTMLElement | null = null;
let nextBtn: HTMLButtonElement | null = null;
let table: OpenTable | null = null;
let inspectStop: (() => void) | null = null;
const stop3d: Array<() => void> = [];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

// 把存档写回浏览器
function persistSave(): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

// 换上新存档并立刻写入
function replaceSave(next: SaveData): void {
  save = next;
  persistSave();
}

// 根据哈希确定当前页面
function readRoute(): Route {
  const hash = location.hash.replace(/^#/, "") || "/";
  if (hash === "/shop") return "shop";
  if (hash === "/open") return "open";
  if (hash === "/dex") return "dex";
  return "home";
}

// 合计各卡组还剩多少袋子
function bagTotal(data: SaveData): number {
  return Object.values(data.packs).reduce((sum, count) => sum + count, 0);
}

// 地址查询带 preview=gold 时，下一次撕开要看到金卡
function wantsGoldPreview(): boolean {
  return new URLSearchParams(location.search).get("preview") === "gold";
}

// 记录这次会话里真正取到的袋面和卡图
async function cacheArtFiles(): Promise<void> {
  const found = new Set<string>();
  const rels: string[] = [];
  for (const pack of PACKS) {
    rels.push(`packs/${pack.id}.webp`);
    for (const card of pack.cards) rels.push(`cards/${pack.id}/${card.id}.webp`);
  }
  await Promise.all(rels.map(async (rel) => {
    try {
      const res = await fetch(`/${rel}`, { headers: { Accept: "image/webp" } });
      if (res.ok) found.add(rel);
      await res.body?.cancel();
    } catch {
      return;
    }
  }));
  artFiles = found;
}

function packById(id: string): PackDef | undefined {
  return PACKS.find((pack) => pack.id === id);
}

// 只留下还有袋子并且图齐的卡包
function heldReadyPacks(files: Set<string>): PackDef[] {
  return PACKS.filter((pack) => (save.packs[pack.id] ?? 0) > 0 && packArtReady(pack, files));
}

// 查出这张卡在卡组里的等级
function rarityOf(packId: string, cardId: string): Rarity {
  const card = packById(packId)?.cards.find((item) => item.id === cardId);
  return card?.rarity ?? "common";
}

// 这张卡落到桌上的时刻
function landedAt(rarity: Rarity): number {
  return FLOAT_MS + PAUSE[rarity] + FLIP_MS + LAND_MS;
}

// 统计已经落在桌上的张数
function presentedCount(state: RevealState): number {
  if (state.phase === "done") return state.rarities.length;
  if (state.phase !== "card") return 0;
  const rarity = state.rarities[state.cardIndex];
  if (!rarity) return state.cardIndex;
  return state.elapsed >= landedAt(rarity) ? state.cardIndex + 1 : state.cardIndex;
}

// 从存档接着播这一包，不再抽卡
function revealFromSave(current: NonNullable<SaveData["current"]>): RevealState {
  const rarities = current.cards.map((card) => rarityOf(current.packId, card.id));
  if (current.shown <= 0) return initialReveal(rarities);
  if (current.shown >= rarities.length) {
    return { rarities, phase: "done", cardIndex: rarities.length, elapsed: 0 };
  }
  return { rarities, phase: "card", cardIndex: current.shown, elapsed: 0 };
}

// 把已经播完的张数写进存档
function rememberShown(): void {
  if (!save.current || openMode.kind !== "show") return;
  const shown = presentedCount(openMode.reveal);
  if (shown === save.current.shown) return;
  replaceSave({ ...save, current: { ...save.current, shown } });
}

// 进入拆卡页时，有未写完的一包就接着播
function syncOpenFromSave(): void {
  drag = null;
  retract = null;
  tearDir = 1;
  if (save.current && save.current.cards.length > 0) {
    tear = 1;
    openMode = { kind: "show", reveal: revealFromSave(save.current) };
    return;
  }
  tear = 0;
  openMode = { kind: "pick" };
}

function clearStageRefs(): void {
  stageEl = null;
  nextBtn = null;
}

// 把地址改回首页
function goHome(): void {
  location.hash = "#/";
}

// 首页优先摆手里图齐的第一袋，否则用目录里第一只齐图的包
function homeCoverUrl(): string | null {
  const files = artFiles;
  if (!files) return null;
  const featured = heldReadyPacks(files)[0] ?? PACKS.find((pack) => packArtReady(pack, files));
  return featured ? coverUrl(featured.id) : null;
}

// 商店只上架图已经齐的卡包
function shopPacks(): ShopPack[] {
  const files = artFiles;
  if (!files) return [];
  return PACKS.filter((pack) => packArtReady(pack, files)).map((pack) => ({
    id: pack.id,
    name: pack.name,
    seriesName: pack.seriesName,
    held: save.packs[pack.id] ?? 0,
    coverUrl: coverUrl(pack.id),
  }));
}

// 开局就有的装饰，标出当前装上的那一个
function shopCosmetics(): { kind: CosmeticKind; id: string; on: boolean }[] {
  const kinds: CosmeticKind[] = ["cover", "sleeve", "cloth"];
  return kinds.flatMap((kind) => STARTER.cosmetics[kind].map((id) => ({
    kind,
    id,
    on: save.equipped[kind] === id,
  })));
}

// 手里有袋子，但这包的图还不齐
function hasUnreadyHeld(): boolean {
  const files = artFiles;
  if (!files) return false;
  return PACKS.some((pack) => (save.packs[pack.id] ?? 0) > 0 && !packArtReady(pack, files));
}

// 拆卡台只摆手里且图齐的袋子
function heldPacks(): OpenPack[] {
  const files = artFiles;
  if (!files) return [];
  return heldReadyPacks(files).map((pack) => ({
    id: pack.id,
    name: pack.name,
    held: save.packs[pack.id] ?? 0,
    coverUrl: coverUrl(pack.id),
  }));
}

function selectShopPack(id: string): void {
  selectedShopId = id;
  renderPage();
}

function selectCosmeticKind(kind: CosmeticKind): void {
  cosmeticKind = kind;
  renderPage();
}

// 打开商店里这一包的清单
function showShopContents(id: string): void {
  selectedShopId = id;
  renderPage();
  openPackContents(id);
}

function selectOpenPack(id: string): void {
  selectedOpenId = id;
  renderPage();
}

// 图鉴一次只摊开当前包的一个稀有度
function mountDex(): void {
  const pack = packById(dexPackId) ?? PACKS[0];
  renderDex(app!, {
    packs: PACKS.map((item) => ({ id: item.id, name: item.name })),
    packId: pack.id,
    rarity: dexRarity,
    cards: pack.cards.filter((card) => card.rarity === dexRarity).map((card) => ({
      id: card.id,
      name: card.name,
      owned: save.owned[card.id] ?? 0,
      url: cardUrl(pack.id, card.id),
    })),
    onHome: goHome,
    onPack: (id) => {
      dexPackId = id;
      renderPage();
    },
    onRarity: (rarity) => {
      dexRarity = rarity;
      renderPage();
    },
    onInspect: (id) => {
      // 没拆到的卡不进入近看
      if ((save.owned[id] ?? 0) <= 0) return;
      openInspect(pack.id, id);
    },
  });
}

// 选包时摆手里的袋子，撕和播时把舞台交给三维桌子
function mountOpenPage(): void {
  const files = artFiles;
  const mount = renderOpen(app!, {
    mode: openMode.kind,
    packs: heldPacks(),
    selectedId: selectedOpenId,
    prompt: openPrompt(
      openMode.kind,
      openMode.kind === "show" && openMode.reveal.phase === "done",
      files ? heldReadyPacks(files).length : 0,
      hasUnreadyHeld(),
    ),
    onHome: goHome,
    onSelect: selectOpenPack,
    onTear: choosePack,
    onContents: openPackContents,
    onNext: finishThisPack,
  });
  stop3d.push(mount.stop);
  nextBtn = mount.nextButton;
  if ((openMode.kind === "sealed" || openMode.kind === "show") && mount.stageHost) {
    stageEl = mount.stageHost;
    table = new OpenTable(mount.stageHost);
    const packId = facingPackId();
    if (packId) table.setCover(coverUrl(packId));
    mount.stageHost.addEventListener("click", onStageClick);
  }
  if (openMode.kind === "sealed" || openMode.kind === "show") {
    paintTear();
    if (openMode.kind === "show") paintShow();
  }
}

// 按当前页面重画
function renderPage(): void {
  closeInspect();
  closeContents();
  for (const stop of stop3d) stop();
  stop3d.length = 0;
  table?.dispose();
  table = null;
  clearStageRefs();
  app!.replaceChildren();
  if (route === "home") {
    stop3d.push(renderHome(app!, {
      total: bagTotal(save),
      coverUrl: homeCoverUrl(),
      onHome: goHome,
    }));
    return;
  }
  if (route === "shop") {
    stop3d.push(renderShop(app!, {
      packs: shopPacks(),
      selectedId: selectedShopId,
      cosmeticKind,
      cosmetics: shopCosmetics(),
      onHome: goHome,
      onSelect: selectShopPack,
      onBuy: buyListedPack,
      onContents: showShopContents,
      onCosmeticKind: selectCosmeticKind,
      onEquip: wearCosmetic,
    }));
    return;
  }
  if (route === "dex") {
    mountDex();
    return;
  }
  mountOpenPage();
}

// 拆卡桌上正在面对的那一包
function facingPackId(): string | null {
  if (openMode.kind === "sealed" || openMode.kind === "bare") return openMode.packId;
  if (openMode.kind === "show") return save.current?.packId ?? null;
  return null;
}

function coverUrl(packId: string): string | null {
  const rel = `packs/${packId}.webp`;
  return artFiles?.has(rel) ? `/${rel}` : null;
}

function cardUrl(packId: string, cardId: string): string | null {
  const rel = `cards/${packId}/${cardId}.webp`;
  return artFiles?.has(rel) ? `/${rel}` : null;
}

function usesSleeve(): boolean {
  return save.equipped.sleeve !== "plain";
}

// 摆上选中的那一只还没撕的袋子
function choosePack(packId: string): void {
  const pack = packById(packId);
  if (!artFiles || !pack || !packArtReady(pack, artFiles)) return;
  if ((save.packs[packId] ?? 0) < 1) return;
  tear = 0;
  tearDir = 1;
  retract = null;
  drag = null;
  openMode = { kind: "sealed", packId };
  renderPage();
}

// 买入指定卡包的一袋
function buyListedPack(packId: string): void {
  const pack = packById(packId);
  if (!artFiles || !pack || !packArtReady(pack, artFiles)) return;
  replaceSave(buyPack(save, packId));
  renderPage();
}

// 装备已经拥有的封面、卡套或桌布
function wearCosmetic(kind: CosmeticKind, id: string): void {
  if (!STARTER.cosmetics[kind].includes(id)) return;
  replaceSave(equip(save, kind, id));
  renderPage();
}

// 撕到阈值后抽出五张并扣掉这一袋
function sealOpen(): void {
  if (openMode.kind !== "sealed" || save.current) return;
  const pack = packById(openMode.packId);
  if (!pack || (save.packs[pack.id] ?? 0) < 1) return;
  drag = null;
  retract = null;
  let drawn = rollFive(pack.cards, Math.random);
  if (wantsGoldPreview()) drawn = withPreviewGold(drawn, pack.cards);
  replaceSave(commitOpen(save, pack.id, drawn.map((card) => ({ id: card.id, name: card.name }))));
  openMode = { kind: "show", reveal: initialReveal(drawn.map((card) => card.rarity)) };
  renderPage();
}

// 按住撕口，开始一次左右拖动
function gripTear(event: PointerEvent): void {
  const hit = (event.target as HTMLElement).closest?.(".stage-hit");
  if (!hit || openMode.kind !== "sealed" || save.current) return;
  retract = null;
  drag = { pointerId: event.pointerId, originX: event.clientX };
  (hit as HTMLElement).setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

// 只认水平位移，向左拖也折成正向进度
function dragTear(event: PointerEvent): void {
  if (!drag || event.pointerId !== drag.pointerId || openMode.kind !== "sealed") return;
  const dx = event.clientX - drag.originX;
  if (dx === 0) return;
  tearDir = dx < 0 ? -1 : 1;
  const dragPx = dx < 0 ? -dx : dx;
  tear = tearProgress(dragPx, (stageEl?.clientWidth ?? 0) * 0.42);
  paintTear();
  if (isOpened(tear)) sealOpen();
}

// 没撕开就松手，裂口在 0.35 秒内回到 0
function releaseTear(event: PointerEvent): void {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag = null;
  if (openMode.kind !== "sealed" || isOpened(tear)) return;
  retract = { from: tear, started: performance.now() };
}

function shownTear(): number {
  if (openMode.kind === "sealed") return tear;
  if (openMode.kind !== "show") return 0;
  if (openMode.reveal.phase === "settle") return tear + (1 - tear) * clamp01(openMode.reveal.elapsed / 600);
  return 1;
}

// 把撕开进度交给三维桌子
function paintTear(): void {
  table?.setTear(shownTear());
}

// 五张落定后点卡面进入近看
function onStageClick(event: MouseEvent): void {
  if (!table || openMode.kind !== "show" || openMode.reveal.phase !== "done" || !save.current) return;
  const index = table.pick(event);
  const card = index == null ? undefined : save.current.cards[index];
  if (card) openInspect(save.current.packId, card.id);
}

// 按演出时钟把五张卡摆进三维桌子
function paintShow(): void {
  if (openMode.kind !== "show" || !save.current || !table) return;
  paintTear();
  table.setCards(showPoses());
  if (nextBtn) nextBtn.hidden = openMode.reveal.phase !== "done";
}

// 算出每张卡此刻的位置，落定后正面朝前
function showPoses(): CardPose[] {
  if (openMode.kind !== "show" || !save.current) return [];
  const state = openMode.reveal;
  const packId = save.current.packId;
  return save.current.cards.map((card, index) => {
    const rarity = state.rarities[index] ?? "common";
    const flipStart = FLOAT_MS + PAUSE[rarity];
    const landAt = flipStart + FLIP_MS + LAND_MS;
    const beating = state.phase === "card"
      && index === state.cardIndex
      && state.elapsed >= flipStart
      && state.elapsed < landAt;
    const landed = state.phase === "done"
      || (state.phase === "card" && index < state.cardIndex)
      || (state.phase === "card" && index === state.cardIndex && state.elapsed >= landAt);
    const pose: CardPose = {
      key: `${index}:${card.id}`,
      index,
      look: {
        name: card.name,
        url: cardUrl(packId, card.id),
        gray: false,
        sleeve: usesSleeve(),
        layers: cardLayers(rarity, beating, landed),
      },
      visible: false,
      y: -1.95,
      z: 0,
      xMix: 1,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scale: 1,
    };
    if (landed) return { ...pose, visible: true };
    if (state.phase !== "card" || index !== state.cardIndex || state.elapsed >= landAt) return pose;
    const elapsed = state.elapsed;
    const landStart = flipStart + FLIP_MS;
    let y = 0.15;
    let xMix = 1;
    let scale = 1;
    let z = 0.2;
    if (elapsed < FLOAT_MS) {
      const t = easeOut(clamp01(elapsed / FLOAT_MS));
      y = lerp(1.2, 0.15, t);
      xMix = t;
      scale = lerp(0.4, 1, t);
      z = lerp(0.45, 0.2, t);
    } else if (elapsed >= landStart) {
      const t = easeOut(clamp01((elapsed - landStart) / LAND_MS));
      y = lerp(0.15, -1.95, t);
      z = lerp(0.2, 0, t);
    }
    let rotY = Math.PI;
    if (elapsed >= landStart) rotY = 0;
    else if (elapsed >= flipStart) rotY = Math.PI * (1 - easeOut(clamp01((elapsed - flipStart) / FLIP_MS)));
    return { ...pose, visible: true, y, z, xMix, scale, rotY };
  });
}

// 五张落定后写入图鉴，同包还有袋子就再放一只
function finishThisPack(): void {
  if (!save.current || openMode.kind !== "show" || openMode.reveal.phase !== "done") return;
  const packId = save.current.packId;
  replaceSave(finishOpen(save));
  tear = 0;
  tearDir = 1;
  drag = null;
  retract = null;
  openMode = (save.packs[packId] ?? 0) > 0 ? { kind: "sealed", packId } : { kind: "bare", packId };
  renderPage();
}

// 近看时持有数来自图鉴，还没写入图鉴的这张写本包开出
function openInspect(packId: string, cardId: string): void {
  const pack = packById(packId);
  const card = pack?.cards.find((item) => item.id === cardId);
  if (!pack || !card) return;
  const owned = save.owned[card.id] ?? 0;
  const current = save.current;
  const inCurrent = current != null && current.packId === pack.id && current.cards.some((item) => item.id === card.id);
  // 没拆到、也不是这一包刚开出的，不打开
  if (owned <= 0 && !inCurrent) return;
  closeInspect();
  const rarity = RARITY_TABS.find((tab) => tab.id === card.rarity)?.label ?? "";
  const view = renderInspect(app!, {
    name: card.name,
    meta: `${pack.name} · ${rarity}`,
    hold: owned > 0 ? `持有 ${owned}` : "本包开出",
    onClose: closeInspect,
  });
  inspectStop = mountCardViewer(view, {
    name: card.name,
    url: cardUrl(pack.id, card.id),
    gray: false,
    sleeve: usesSleeve(),
    layers: settledLayers(card.rarity),
  });
}

// 关掉近看并停掉卡的旋转
function closeInspect(): void {
  inspectStop?.();
  inspectStop = null;
  app?.querySelector(".overlay.inspect")?.remove();
}

function closeContents(): void {
  app?.querySelector(".overlay.contents")?.remove();
}

// 按稀有度列出这一包，没获得的不能近看
function openPackContents(packId: string): void {
  const pack = packById(packId);
  if (!pack) return;
  closeContents();
  const tiers = RARITY_TABS.flatMap((tab) => {
    const cards = pack.cards.filter((card) => card.rarity === tab.id);
    if (cards.length === 0) return [];
    return [{
      label: `${tab.label} · ${cards.length}`,
      cards: cards.map((card) => ({
        id: card.id,
        name: card.name,
        owned: save.owned[card.id] ?? 0,
        url: cardUrl(pack.id, card.id),
      })),
    }];
  });
  renderContents(app!, {
    title: `${pack.name} · ${pack.cards.length} 张`,
    tiers,
    onClose: closeContents,
    onInspect: (id) => {
      if ((save.owned[id] ?? 0) <= 0) return;
      openInspect(pack.id, id);
    },
  });
}

// 离开商店或拆卡时清掉该页选中，离开拆卡时写回播到第几张
function onHash(): void {
  const next = readRoute();
  if (route === "shop" && next !== "shop") {
    selectedShopId = null;
    cosmeticKind = null;
  }
  if (route === "open" && next !== "open") {
    rememberShown();
    selectedOpenId = null;
  }
  const entering = next === "open" && route !== "open";
  route = next;
  if (entering) syncOpenFromSave();
  renderPage();
}

// Esc 先关清单或近看，没有这两层才回首页
function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  if (app!.querySelector(".overlay.inspect")) {
    closeInspect();
    return;
  }
  if (app!.querySelector(".overlay.contents")) {
    closeContents();
    return;
  }
  goHome();
}

// 按两次绘制之间的时间回弹裂口，或推进翻面
function stepFrame(now: number): void {
  const dt = lastTick === 0 ? 16 : Math.min(64, now - lastTick);
  lastTick = now;
  if (route === "open") {
    if (retract && openMode.kind === "sealed") {
      const t = (now - retract.started) / RETRACT_MS;
      if (t >= 1) {
        tear = 0;
        retract = null;
      } else {
        tear = retract.from * (1 - easeOut(clamp01(t)));
      }
      paintTear();
    } else if (openMode.kind === "show" && artFiles && openMode.reveal.phase !== "done") {
      // 翻面过程中只改桌子和下一包按钮
      openMode = { kind: "show", reveal: advance(openMode.reveal, dt) };
      rememberShown();
      paintShow();
    } else if (openMode.kind === "sealed" || openMode.kind === "show") {
      paintTear();
    }
    table?.render();
  }
  requestAnimationFrame(stepFrame);
}

route = readRoute();
if (route === "open") syncOpenFromSave();
renderPage();
void cacheArtFiles().then(() => {
  if (readRoute() === route) renderPage();
});
window.addEventListener("hashchange", onHash);
window.addEventListener("pagehide", () => {
  if (readRoute() === "open") rememberShown();
});
window.addEventListener("keydown", onKeyDown);
window.addEventListener("pointermove", dragTear);
window.addEventListener("pointerup", releaseTear);
window.addEventListener("pointercancel", releaseTear);
app.addEventListener("pointerdown", gripTear);
requestAnimationFrame(stepFrame);
