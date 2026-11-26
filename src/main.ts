import "./styles.css";
import { PACKS } from "./catalog";
import { packArtReady, type PackDef } from "./art";
import { rollFive, withPreviewGold, type CardDef, type Rarity } from "./odds";
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

const SERIES_TINT: Record<string, string> = {
  danqing: "#8a6244",
  suihua: "#6d8a62",
  shierchen: "#9a4038",
  shanhai: "#3e6d6a",
  weimian: "#6d5b7a",
  tieyi: "#5a616c",
  hongqu: "#8d3a48",
  yandi: "#4c6a7e",
  xuanhai: "#1b4c5c",
  qunfang: "#a15a74",
};

type Route = "home" | "shop" | "open" | "dex";
type ShopTab = "pack" | "cover" | "sleeve" | "cloth";
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
let shopTab: ShopTab = "pack";
let dexSeries = PACKS[0].seriesId;
let dexPack = PACKS[0].id;
let dexRarity: Rarity = "gold";
let openMode: OpenMode = { kind: "pick" };
let tear = 0;
let tearDir: 1 | -1 = 1;
let drag: { pointerId: number; originX: number } | null = null;
let retract: { from: number; started: number } | null = null;
let landedCount = -1;
let floatIndex = -1;
let lastTick = 0;

let stageEl: HTMLElement | null = null;
let bagEl: HTMLElement | null = null;
let crimpEl: HTMLElement | null = null;
let ripEl: HTMLElement | null = null;
let gapEl: HTMLElement | null = null;
let foilEl: HTMLElement | null = null;
let landedEl: HTMLElement | null = null;
let floaterEl: HTMLElement | null = null;
let floaterInner: HTMLElement | null = null;
let nextBtn: HTMLButtonElement | null = null;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

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

// 按系列收集图已经齐的卡包
function groupsForSale(files: Set<string>): { seriesName: string; packs: PackDef[] }[] {
  const order: string[] = [];
  const grouped = new Map<string, PackDef[]>();
  for (const pack of PACKS) {
    if (!packArtReady(pack, files)) continue;
    const list = grouped.get(pack.seriesName);
    if (list) list.push(pack);
    else {
      grouped.set(pack.seriesName, [pack]);
      order.push(pack.seriesName);
    }
  }
  return order.map((seriesName) => ({ seriesName, packs: grouped.get(seriesName) ?? [] }));
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

// 给开局就有的装饰起页面上的名字
function cosmeticName(kind: CosmeticKind, id: string): string {
  if (kind === "sleeve" && id === "plain") return "无卡套";
  if (kind === "cover" && id === "default") return "默认封面";
  if (kind === "cloth" && id === "default") return "默认桌布";
  return id;
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
  bagEl = null;
  crimpEl = null;
  ripEl = null;
  gapEl = null;
  foilEl = null;
  landedEl = null;
  floaterEl = null;
  floaterInner = null;
  nextBtn = null;
  landedCount = -1;
  floatIndex = -1;
}

function homeLink(): HTMLAnchorElement {
  const link = el("a", "home-link", "回首页");
  link.href = "#/";
  return link;
}

function coinMark(): HTMLParagraphElement {
  const coin = el("p", "coin", "∞");
  coin.setAttribute("aria-label", "金币");
  return coin;
}

// 按当前页面重画
function renderPage(): void {
  closeLarge();
  clearStageRefs();
  app!.replaceChildren();
  if (route === "home") renderHome();
  else if (route === "shop") renderShop();
  else if (route === "dex") renderDex();
  else renderOpen();
}

// 首页画出袋子总数、无限金币和三个入口
function renderHome(): void {
  const page = el("main", "home");
  page.append(el("p", "eyebrow", "银箔袋"));
  const total = el("p", "total");
  total.append(el("span", "total-num", String(bagTotal(save))));
  total.append(el("span", "total-unit", "袋"));
  const nav = el("nav", "entries");
  for (const [href, label] of [["#/shop", "商店"], ["#/open", "拆卡"], ["#/dex", "图鉴"]] as const) {
    const link = el("a", "entry", label);
    link.href = href;
    nav.append(link);
  }
  page.append(total, coinMark(), nav);
  app!.append(page);
}

// 商店按页签列出图齐的卡包，以及开局就有的装饰
function renderShop(): void {
  const page = el("main", "page");
  const bar = el("header", "topbar");
  bar.append(homeLink(), coinMark());
  const sheet = el("div", "sheet");
  const tabs = el("div", "tabs");
  const tabItems = [
    ["pack", "卡包"],
    ["cover", "封面"],
    ["sleeve", "卡套"],
    ["cloth", "桌布"],
  ] as const;
  for (const [id, label] of tabItems) {
    const button = el("button", shopTab === id ? "on" : "", label);
    button.type = "button";
    button.dataset.shopTab = id;
    tabs.append(button);
  }
  sheet.append(tabs);
  if (shopTab === "pack") sheet.append(packCatalog());
  else sheet.append(cosmeticList(shopTab));
  page.append(bar, sheet);
  app!.append(page);
}

function packCatalog(): HTMLElement {
  const list = el("div", "pack-groups");
  list.dataset.packList = "1";
  if (!artFiles) return list;
  for (const group of groupsForSale(artFiles)) {
    list.append(el("h2", "series-name", group.seriesName));
    for (const pack of group.packs) {
      const row = el("div", "sale");
      row.dataset.pack = pack.id;
      row.append(el("span", "sale-name", pack.name));
      row.append(el("span", "sale-own", `持有 ${save.packs[pack.id] ?? 0}`));
      const button = el("button", "buy", "买一袋");
      button.type = "button";
      button.dataset.buy = pack.id;
      row.append(button);
      list.append(row);
    }
  }
  return list;
}

function cosmeticList(kind: CosmeticKind): HTMLElement {
  const list = el("div", "cosmetic-list");
  for (const id of STARTER.cosmetics[kind]) {
    const button = el("button", save.equipped[kind] === id ? "cosmetic on" : "cosmetic");
    button.type = "button";
    button.dataset.equipKind = kind;
    button.dataset.equipId = id;
    button.append(el("span", "", cosmeticName(kind, id)));
    if (save.equipped[kind] === id) button.append(el("span", "using", "使用中"));
    list.append(button);
  }
  return list;
}

// 图鉴先选系列和卡包，再按等级从高到低分格
function renderDex(): void {
  const page = el("main", "page");
  const bar = el("header", "topbar");
  bar.append(homeLink(), el("h1", "top-title", "图鉴"));
  const sheet = el("div", "sheet");
  const seriesRow = el("div", "chips");
  const seen = new Set<string>();
  for (const pack of PACKS) {
    if (seen.has(pack.seriesId)) continue;
    seen.add(pack.seriesId);
    const button = el("button", pack.seriesId === dexSeries ? "chip on" : "chip", pack.seriesName);
    button.type = "button";
    button.dataset.series = pack.seriesId;
    seriesRow.append(button);
  }
  const packs = PACKS.filter((pack) => pack.seriesId === dexSeries);
  const current = packs.find((pack) => pack.id === dexPack) ?? packs[0];
  if (current) dexPack = current.id;
  const packRow = el("div", "chips");
  for (const pack of packs) {
    const button = el("button", pack.id === dexPack ? "chip on" : "chip", pack.name);
    button.type = "button";
    button.dataset.dexPack = pack.id;
    packRow.append(button);
  }
  const rarityRow = el("div", "chips");
  for (const tab of RARITY_TABS) {
    const button = el("button", tab.id === dexRarity ? "chip on" : "chip", tab.label);
    button.type = "button";
    button.dataset.rarity = tab.id;
    rarityRow.append(button);
  }
  const grid = el("div", "dex-grid");
  if (current) {
    for (const card of current.cards) {
      if (card.rarity !== dexRarity) continue;
      grid.append(dexSlot(current, card));
    }
  }
  sheet.append(seriesRow, packRow, rarityRow, grid);
  page.append(bar, sheet);
  app!.append(page);
}

function dexSlot(pack: PackDef, card: CardDef): HTMLElement {
  const owned = save.owned[card.id] ?? 0;
  const slot = el("div", owned > 0 ? "slot owned" : "slot unowned");
  slot.style.setProperty("--tint", SERIES_TINT[pack.seriesId] ?? "#6a5a48");
  if (owned <= 0) {
    slot.setAttribute("aria-label", "未获得");
    slot.append(silhouette());
    return slot;
  }
  const rel = `cards/${pack.id}/${card.id}.webp`;
  if (artFiles?.has(rel)) {
    const img = el("img", "slot-img");
    img.src = `/${rel}`;
    img.alt = "";
    slot.append(img);
  }
  slot.append(el("p", "slot-name", card.name));
  slot.append(el("span", "slot-count", String(owned)));
  return slot;
}

function silhouette(): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 80 120");
  svg.setAttribute("class", "silhouette");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("d", "M40 16c9 0 15 7 15 16S49 48 40 48 25 41 25 32 31 16 40 16zM20 56c5-9 13-13 20-13s15 4 20 13l9 50H11L20 56z");
  svg.append(path);
  return svg;
}

// 拆卡页只放可撕的袋子；有未完成的一包就接着演
function renderOpen(): void {
  const page = el("main", "open");
  const bar = el("header", "topbar");
  const title = openTitle();
  bar.append(homeLink(), el("h1", "top-title", title));
  page.append(bar);
  if (openMode.kind === "pick") page.append(pickList());
  else page.append(stageView());
  const foot = el("div", "open-foot");
  if (openMode.kind === "sealed") foot.append(el("p", "hint", "按住撕口，左右撕开"));
  if (openMode.kind === "show") {
    nextBtn = el("button", "next", "下一包");
    nextBtn.type = "button";
    nextBtn.dataset.next = "1";
    nextBtn.hidden = openMode.reveal.phase !== "done";
    foot.append(nextBtn);
  }
  if (openMode.kind === "bare") {
    const shop = el("a", "to-shop", "去商店");
    shop.href = "#/shop";
    foot.append(shop);
  }
  page.append(foot);
  app!.append(page);
  if (openMode.kind === "sealed" || openMode.kind === "show") {
    placeLayers();
    paintTear();
    if (openMode.kind === "show") paintShow();
  }
}

function openTitle(): string {
  if (openMode.kind === "sealed" || openMode.kind === "bare") return packById(openMode.packId)?.name ?? "拆卡";
  if (openMode.kind === "show" && save.current) return packById(save.current.packId)?.name ?? "拆卡";
  return "拆卡";
}

function pickList(): HTMLElement {
  const wrap = el("div", "sheet");
  if (!artFiles) return wrap;
  const ready = heldReadyPacks(artFiles);
  if (ready.length === 0) {
    const holding = PACKS.some((pack) => (save.packs[pack.id] ?? 0) > 0);
    wrap.append(el("p", holding ? "missing-art" : "quiet", holding ? "图还没齐" : "没有可拆的袋子"));
    if (!holding) {
      const shop = el("a", "to-shop", "去商店");
      shop.href = "#/shop";
      wrap.append(shop);
    }
    return wrap;
  }
  const list = el("div", "pack-groups");
  for (const pack of ready) {
    const button = el("button", "choice", `${pack.name} · ${save.packs[pack.id] ?? 0} 袋`);
    button.type = "button";
    button.dataset.choose = pack.id;
    list.append(button);
  }
  wrap.append(list);
  return wrap;
}

function stageView(): HTMLElement {
  stageEl = el("div", "stage");
  const table = el("div", "table");
  table.dataset.cloth = save.equipped.cloth;
  landedEl = el("div", "landed");
  stageEl.append(table, landedEl);
  const packId = openMode.kind === "show" ? save.current?.packId : openMode.kind === "sealed" ? openMode.packId : "";
  if (packId && openMode.kind !== "bare") stageEl.append(packet(packId));
  return stageEl;
}

function packet(packId: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const pack = packById(packId);
  bagEl = el("div", "bag");
  bagEl.dataset.cover = save.equipped.cover;
  bagEl.append(el("div", "bag-foil"));
  const rel = `packs/${packId}.webp`;
  if (pack && artFiles?.has(rel)) {
    const face = el("img", "bag-face");
    face.src = `/${rel}`;
    face.alt = pack.name;
    face.draggable = false;
    bagEl.append(face);
  }
  crimpEl = el("div", "crimp");
  bagEl.append(crimpEl);
  ripEl = el("div", "rip grow-right");
  gapEl = el("div", "rip-gap");
  const guide = el("div", "rip-guide");
  const hit = el("div", "rip-hit");
  hit.setAttribute("aria-label", "撕口");
  if (openMode.kind !== "sealed") hit.style.pointerEvents = "none";
  ripEl.append(gapEl, guide, hit);
  floaterEl = el("div", "floater");
  floaterEl.hidden = true;
  foilEl = el("div", "foil");
  fragment.append(bagEl, ripEl, floaterEl, foilEl);
  return fragment;
}

function cardBack(): HTMLElement {
  return el("div", "card-back");
}

function cardFront(packId: string, card: { id: string; name: string }, sheen: boolean): HTMLElement {
  const front = el("div", "card-front");
  const rel = `cards/${packId}/${card.id}.webp`;
  if (artFiles?.has(rel)) {
    const img = el("img", "card-img");
    img.src = `/${rel}`;
    img.alt = "";
    img.draggable = false;
    front.append(img);
  }
  front.append(el("p", "card-name", card.name));
  if (sheen && artFiles?.has(rel)) front.append(el("div", "sheen"));
  return front;
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
  const hit = (event.target as HTMLElement).closest?.(".rip-hit");
  if (!hit || openMode.kind !== "sealed" || save.current) return;
  retract = null;
  drag = { pointerId: event.pointerId, originX: event.clientX };
  (hit as HTMLElement).setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

// 只认水平位移，向左拖也折成正向进度
function dragTear(event: PointerEvent): void {
  followFoil(event);
  if (!drag || event.pointerId !== drag.pointerId || openMode.kind !== "sealed") return;
  const dx = event.clientX - drag.originX;
  if (dx === 0) return;
  tearDir = dx < 0 ? -1 : 1;
  const dragPx = dx < 0 ? -dx : dx;
  tear = tearProgress(dragPx, ripEl?.clientWidth ?? 0);
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

// 让箔面高光停在指针底下
function followFoil(event: PointerEvent): void {
  if (!foilEl || !bagEl) return;
  const rect = bagEl.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  foilEl.style.setProperty("--hx", `${x}%`);
  foilEl.style.setProperty("--hy", `${y}%`);
}

function shownTear(): number {
  if (openMode.kind === "sealed") return tear;
  if (openMode.kind !== "show") return 0;
  if (openMode.reveal.phase === "settle") return tear + (1 - tear) * clamp01(openMode.reveal.elapsed / 600);
  return 1;
}

// 按进度画出裂口，方向跟着手指
function paintTear(): void {
  if (!gapEl || !ripEl) return;
  const amount = shownTear();
  gapEl.style.width = `${ripEl.clientWidth * amount}px`;
  ripEl.classList.toggle("grow-left", tearDir < 0);
  ripEl.classList.toggle("grow-right", tearDir >= 0);
  const guide = ripEl.querySelector<HTMLElement>(".rip-guide");
  if (guide) guide.hidden = amount > 0.02;
  if (crimpEl) {
    const lift = openMode.kind === "show"
      ? (openMode.reveal.phase === "settle" ? clamp01(openMode.reveal.elapsed / 600) : 1)
      : 0;
    crimpEl.style.transform = lift ? `translateY(${-10 * lift}px)` : "";
  }
}

// 把裂口和箔光对齐到袋身
function placeLayers(): void {
  if (!stageEl || !bagEl) return;
  const stage = stageEl.getBoundingClientRect();
  const bag = bagEl.getBoundingClientRect();
  const left = bag.left - stage.left;
  const top = bag.top - stage.top;
  if (ripEl) {
    ripEl.style.left = `${left}px`;
    ripEl.style.top = `${top + 22}px`;
    ripEl.style.width = `${bag.width}px`;
  }
  if (foilEl) {
    foilEl.style.left = `${left}px`;
    foilEl.style.top = `${top}px`;
    foilEl.style.width = `${bag.width}px`;
    foilEl.style.height = `${bag.height}px`;
  }
}

function cardBox(): { width: number; height: number; gap: number } {
  const stageWidth = stageEl?.clientWidth ?? 640;
  const gap = stageWidth < 720 ? 8 : 14;
  const width = Math.min(118, Math.floor((stageWidth - 24 - gap * 4) / 5));
  return { width, height: Math.round(width * 1.46), gap };
}

function slotCenter(index: number): { x: number; y: number } {
  const box = cardBox();
  const width = stageEl?.clientWidth ?? 0;
  const height = stageEl?.clientHeight ?? 0;
  const total = box.width * 5 + box.gap * 4;
  const start = (width - total) / 2;
  return {
    x: start + index * (box.width + box.gap) + box.width / 2,
    y: height - 18 - box.height / 2,
  };
}

function tearCenter(): { x: number; y: number } {
  if (!stageEl || !bagEl) return { x: 0, y: 0 };
  const stage = stageEl.getBoundingClientRect();
  const bag = bagEl.getBoundingClientRect();
  return {
    x: bag.left - stage.left + bag.width / 2,
    y: bag.top - stage.top + 34,
  };
}

function hoverCenter(index: number): { x: number; y: number } {
  const slot = slotCenter(index);
  const bagTop = stageEl && bagEl ? bagEl.getBoundingClientRect().top - stageEl.getBoundingClientRect().top : 150;
  return { x: slot.x, y: Math.max(cardBox().height / 2 + 8, bagTop - 28) };
}

function fillLanded(count: number): void {
  if (!landedEl || !save.current) return;
  const packId = save.current.packId;
  const box = cardBox();
  landedEl.style.gap = `${box.gap}px`;
  landedEl.replaceChildren();
  save.current.cards.forEach((card, index) => {
    if (index >= count) {
      const spacer = el("div", "card-spacer");
      spacer.style.width = `${box.width}px`;
      spacer.style.height = `${box.height}px`;
      landedEl!.append(spacer);
      return;
    }
    const rarity = save.current ? rarityOf(packId, card.id) : "common";
    const button = el("button", usesSleeve() ? "card with-sleeve" : "card");
    button.type = "button";
    button.dataset.zoom = String(index);
    button.style.width = `${box.width}px`;
    button.style.height = `${box.height}px`;
    button.disabled = openMode.kind !== "show" || openMode.reveal.phase !== "done";
    const inner = el("div", "card-inner");
    const shine = rarity === "flash" || rarity === "gold";
    inner.append(cardBack(), cardFront(packId, card, shine));
    button.append(inner);
    landedEl!.append(button);
  });
}

function hideFloater(): void {
  if (floaterEl) floaterEl.hidden = true;
}

function buildFloater(index: number): void {
  if (!floaterEl || !save.current) return;
  const card = save.current.cards[index];
  const rarity = openMode.kind === "show" ? openMode.reveal.rarities[index] : rarityOf(save.current.packId, card.id);
  const box = cardBox();
  floaterEl.replaceChildren();
  floaterEl.hidden = false;
  floaterEl.classList.toggle("with-sleeve", usesSleeve());
  floaterEl.style.width = `${box.width}px`;
  floaterEl.style.height = `${box.height}px`;
  floaterInner = el("div", "card-inner");
  floaterInner.append(cardBack(), cardFront(save.current.packId, card, false));
  floaterEl.append(floaterInner);
  floaterEl.dataset.rarity = rarity;
}

// 按演出时钟摆正在飘的那一张和已经落下的卡
function paintShow(): void {
  if (openMode.kind !== "show" || !save.current) return;
  const state = openMode.reveal;
  const count = presentedCount(state);
  if (count !== landedCount) {
    landedCount = count;
    fillLanded(count);
  }
  paintTear();
  const rarity = state.phase === "card" ? state.rarities[state.cardIndex] : undefined;
  if (state.phase !== "card" || !rarity || state.elapsed >= landedAt(rarity)) {
    hideFloater();
    floatIndex = -1;
  } else {
    if (floatIndex !== state.cardIndex) {
      floatIndex = state.cardIndex;
      buildFloater(state.cardIndex);
    }
    moveFloater(state.cardIndex, state.elapsed, rarity);
  }
  if (nextBtn) nextBtn.hidden = state.phase !== "done";
  const clickable = state.phase === "done";
  landedEl?.querySelectorAll("button").forEach((button) => {
    (button as HTMLButtonElement).disabled = !clickable;
  });
}

// 飘出后停住，闪卡和金卡先亮边，再翻面落下
function moveFloater(index: number, elapsed: number, rarity: Rarity): void {
  if (!floaterEl || !floaterInner) return;
  const origin = tearCenter();
  const hover = hoverCenter(index);
  const slot = slotCenter(index);
  const pause = PAUSE[rarity];
  const flipStart = FLOAT_MS + pause;
  const landStart = flipStart + FLIP_MS;
  let x = hover.x;
  let y = hover.y;
  let scale = 1;
  let tilt = (index - 2) * 4;
  if (elapsed < FLOAT_MS) {
    const t = easeOut(clamp01(elapsed / FLOAT_MS));
    x = lerp(origin.x, hover.x, t);
    y = lerp(origin.y, hover.y, t);
    scale = lerp(0.28, 1, t);
    tilt = lerp(0, (index - 2) * 4, t);
  } else if (elapsed >= landStart) {
    const t = easeOut(clamp01((elapsed - landStart) / LAND_MS));
    y = lerp(hover.y, slot.y, t);
    tilt = lerp((index - 2) * 4, 0, t);
  }
  const spin = elapsed < flipStart ? 0 : 180 * easeOut(clamp01((elapsed - flipStart) / FLIP_MS));
  floaterEl.style.left = `${x}px`;
  floaterEl.style.top = `${y}px`;
  floaterEl.style.transform = `translate(-50%, -50%) rotate(${tilt}deg) scale(${scale})`;
  floaterInner.style.transform = `rotateY(${spin}deg)`;
  const showFront = spin >= 90;
  const back = floaterInner.querySelector<HTMLElement>(".card-back");
  const front = floaterInner.querySelector<HTMLElement>(".card-front");
  if (back) back.style.visibility = showFront ? "hidden" : "visible";
  if (front) front.style.visibility = showFront ? "visible" : "hidden";
  const edgeLit = elapsed >= FLOAT_MS && elapsed < landStart;
  floaterEl.classList.toggle("edge-flash", edgeLit && rarity === "flash");
  floaterEl.classList.toggle("edge-gold", edgeLit && rarity === "gold");
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

// 点开已经落下的卡看大图
function openLarge(index: number): void {
  if (openMode.kind !== "show" || openMode.reveal.phase !== "done" || !save.current) return;
  const card = save.current.cards[index];
  if (!card) return;
  closeLarge();
  const layer = el("div", "zoom");
  layer.dataset.zoomLayer = "1";
  const frame = el("figure", "zoom-card");
  const rel = `cards/${save.current.packId}/${card.id}.webp`;
  if (artFiles?.has(rel)) {
    const img = el("img");
    img.src = `/${rel}`;
    img.alt = card.name;
    frame.append(img);
  }
  frame.append(el("figcaption", "", card.name));
  const close = el("button", "zoom-close", "关闭");
  close.type = "button";
  close.dataset.closeZoom = "1";
  layer.append(frame, close);
  layer.addEventListener("click", (event) => {
    if (event.target === layer) closeLarge();
  });
  app!.append(layer);
}

function closeLarge(): void {
  app?.querySelector("[data-zoom-layer]")?.remove();
}

// 处理买袋、换装饰、选包、翻面后的下一包和大图
function onClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  const tab = target.closest<HTMLElement>("[data-shop-tab]");
  if (tab?.dataset.shopTab === "pack" || tab?.dataset.shopTab === "cover" || tab?.dataset.shopTab === "sleeve" || tab?.dataset.shopTab === "cloth") {
    shopTab = tab.dataset.shopTab;
    renderPage();
    return;
  }
  const buy = target.closest<HTMLElement>("[data-buy]");
  if (buy?.dataset.buy) {
    buyListedPack(buy.dataset.buy);
    return;
  }
  const worn = target.closest<HTMLElement>("[data-equip-kind]");
  const kind = worn?.dataset.equipKind;
  if (worn?.dataset.equipId && (kind === "cover" || kind === "sleeve" || kind === "cloth")) {
    wearCosmetic(kind, worn.dataset.equipId);
    return;
  }
  const series = target.closest<HTMLElement>("[data-series]");
  if (series?.dataset.series) {
    dexSeries = series.dataset.series;
    const first = PACKS.find((pack) => pack.seriesId === dexSeries);
    if (first) dexPack = first.id;
    renderPage();
    return;
  }
  const picked = target.closest<HTMLElement>("[data-dex-pack]");
  if (picked?.dataset.dexPack) {
    dexPack = picked.dataset.dexPack;
    renderPage();
    return;
  }
  const rarity = target.closest<HTMLElement>("[data-rarity]");
  if (rarity?.dataset.rarity === "gold" || rarity?.dataset.rarity === "flash" || rarity?.dataset.rarity === "super" || rarity?.dataset.rarity === "rare" || rarity?.dataset.rarity === "common") {
    dexRarity = rarity.dataset.rarity;
    renderPage();
    return;
  }
  const choose = target.closest<HTMLElement>("[data-choose]");
  if (choose?.dataset.choose) {
    choosePack(choose.dataset.choose);
    return;
  }
  if (target.closest("[data-next]")) {
    finishThisPack();
    return;
  }
  if (target.closest("[data-close-zoom]")) {
    closeLarge();
    return;
  }
  const zoom = target.closest<HTMLElement>("[data-zoom]");
  if (zoom?.dataset.zoom) openLarge(Number(zoom.dataset.zoom));
}

// 离开拆卡页时写回播到第几张
function onHash(): void {
  const next = readRoute();
  if (route === "open" && next !== "open") rememberShown();
  const entering = next === "open" && route !== "open";
  route = next;
  if (entering) syncOpenFromSave();
  renderPage();
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
      placeLayers();
      paintTear();
    } else if (openMode.kind === "show" && artFiles && openMode.reveal.phase !== "done") {
      openMode = { kind: "show", reveal: advance(openMode.reveal, dt) };
      rememberShown();
      placeLayers();
      paintShow();
    } else {
      placeLayers();
      if (openMode.kind === "sealed" || openMode.kind === "show") paintTear();
    }
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
window.addEventListener("pointermove", dragTear);
window.addEventListener("pointerup", releaseTear);
window.addEventListener("pointercancel", releaseTear);
app.addEventListener("pointerdown", gripTear);
app.addEventListener("click", onClick);
requestAnimationFrame(stepFrame);
