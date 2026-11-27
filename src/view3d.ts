import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { LightLayer } from "./ui/light";

const CARD_W = 2.35;
const CARD_H = 3.32;
const CARD_D = 0.09;
const CARD_R = 0.26;
const PACK_W = 2.55;
const PACK_H = 3.62;
const PACK_D = 0.26;
const PACK_R = 0.38;
const FLAP = 0.28;

export type CardLook = {
  name: string;
  url: string | null;
  gray: boolean;
  sleeve: boolean;
  layers?: LightLayer[];
};

export type CardPose = {
  key: string;
  index: number;
  look: CardLook;
  visible: boolean;
  y: number;
  z: number;
  xMix: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
};

const textureCache = new Map<string, Promise<THREE.CanvasTexture>>();
let foilBack: THREE.CanvasTexture | null = null;

function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// 把画铺到卡面上，未获得的画改成灰度
function cardTexture(look: CardLook): Promise<THREE.CanvasTexture> {
  const key = `${look.url ?? ""}|${look.gray ? 1 : 0}|${look.name}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const pending = (async () => {
    const img = look.url ? await loadImage(look.url) : null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 724;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvasTexture(canvas);
    ctx.fillStyle = look.gray ? "#8d8d8d" : "#fbfbff";
    ctx.fillRect(0, 0, 512, 724);
    if (img) ctx.drawImage(img, 16, 16, 480, 620);
    if (look.gray) {
      const pixels = ctx.getImageData(0, 0, 512, 640);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const tone = pixels.data[i] * 0.3 + pixels.data[i + 1] * 0.59 + pixels.data[i + 2] * 0.11;
        const gray = tone * 0.78 + 28;
        pixels.data[i] = gray;
        pixels.data[i + 1] = gray;
        pixels.data[i + 2] = gray;
      }
      ctx.putImageData(pixels, 0, 0);
    }
    ctx.fillStyle = look.gray ? "rgba(28,28,28,0.9)" : "rgba(255,255,255,0.72)";
    ctx.fillRect(0, 636, 512, 88);
    ctx.fillStyle = look.gray ? "#e6e6e6" : "#2c2744";
    ctx.font = "36px Microsoft YaHei, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(look.name, 256, 682);
    return canvasTexture(canvas);
  })();
  textureCache.set(key, pending);
  return pending;
}

function traceRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 银箔卡背：细纹、双框、四角和中心印
function backTexture(): THREE.CanvasTexture {
  if (foilBack) return foilBack;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 724;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const wash = ctx.createLinearGradient(0, 0, 0, 724);
    wash.addColorStop(0, "#3a424c");
    wash.addColorStop(0.42, "#1a2028");
    wash.addColorStop(1, "#0c1014");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 512, 724);
    const sheen = ctx.createLinearGradient(180, 0, 330, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.5, "rgba(255,255,255,0.14)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 512, 724);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "#d5dde6";
    ctx.lineWidth = 1;
    for (let i = -724; i < 512; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 180, 724);
      ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = "#d7dee6";
    ctx.lineWidth = 3;
    traceRoundRect(ctx, 36, 36, 440, 652, 48);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(215,222,230,0.55)";
    traceRoundRect(ctx, 54, 54, 404, 616, 36);
    ctx.stroke();
    ctx.strokeStyle = "#e7edf2";
    ctx.lineWidth = 2;
    for (const [x, y, sx, sy] of [[78, 78, 1, 1], [434, 78, -1, 1], [78, 646, 1, -1], [434, 646, -1, -1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * 36);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * 36, y);
      ctx.stroke();
    }
    const cx = 256;
    const cy = 362;
    ctx.beginPath();
    ctx.arc(cx, cy, 86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40);
    ctx.lineTo(cx + 32, cy);
    ctx.lineTo(cx, cy + 40);
    ctx.lineTo(cx - 32, cy);
    ctx.closePath();
    ctx.fillStyle = "rgba(215,222,230,0.16)";
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#e7edf2";
    ctx.fill();
    ctx.fillRect(cx - 54, cy - 118, 108, 4);
    ctx.fillRect(cx - 54, cy + 114, 108, 4);
    for (const [dx, dy] of [[0, -104], [0, 104], [-104, 0], [104, 0]] as const) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  foilBack = canvasTexture(canvas);
  return foilBack;
}

// 圆角厚板，正面、背面和侧边分成三次绘制
function roundedSlab(
  width: number,
  height: number,
  depth: number,
  radius: { top: number; bottom: number },
  pivot: "center" | "bottom",
): THREE.BufferGeometry {
  const top = Math.min(radius.top, width / 2, height / 2);
  const bottom = Math.min(radius.bottom, width / 2, height / 2);
  const x0 = -width / 2;
  const y0 = -height / 2;
  const x1 = width / 2;
  const y1 = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + bottom, y0);
  shape.lineTo(x1 - bottom, y0);
  if (bottom > 0) shape.quadraticCurveTo(x1, y0, x1, y0 + bottom);
  else shape.lineTo(x1, y0);
  shape.lineTo(x1, y1 - top);
  if (top > 0) shape.quadraticCurveTo(x1, y1, x1 - top, y1);
  else shape.lineTo(x1, y1);
  shape.lineTo(x0 + top, y1);
  if (top > 0) shape.quadraticCurveTo(x0, y1, x0, y1 - top);
  else shape.lineTo(x0, y1);
  shape.lineTo(x0, y0 + bottom);
  if (bottom > 0) shape.quadraticCurveTo(x0, y0, x0 + bottom, y0);
  else shape.lineTo(x0, y0);
  const extruded = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10, steps: 1 });
  extruded.translate(0, pivot === "bottom" ? height / 2 : 0, -depth / 2);
  const loose = extruded.toNonIndexed();
  extruded.dispose();
  loose.computeVertexNormals();
  const pos = loose.getAttribute("position");
  const norm = loose.getAttribute("normal");
  const uv = loose.getAttribute("uv");
  const front: number[] = [];
  const back: number[] = [];
  const side: number[] = [];
  for (let i = 0; i < pos.count; i += 3) {
    const nz = (norm.getZ(i) + norm.getZ(i + 1) + norm.getZ(i + 2)) / 3;
    const bucket = nz > 0.45 ? front : nz < -0.45 ? back : side;
    bucket.push(i, i + 1, i + 2);
    if (Math.abs(nz) <= 0.45) continue;
    for (let k = 0; k < 3; k += 1) {
      const u = pos.getX(i + k) / width + 0.5;
      const v = pivot === "bottom" ? pos.getY(i + k) / height : pos.getY(i + k) / height + 0.5;
      uv.setXY(i + k, nz > 0 ? u : 1 - u, v);
    }
  }
  loose.setIndex(new THREE.BufferAttribute(new Uint32Array([...front, ...back, ...side]), 1));
  loose.clearGroups();
  loose.addGroup(0, front.length, 0);
  loose.addGroup(front.length, back.length, 1);
  loose.addGroup(front.length + back.length, side.length, 2);
  return loose;
}

function foilFace(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.42, roughness: 0.28 });
}

function foilSide(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xe4dcff,
    metalness: 0.85,
    roughness: 0.18,
    emissive: new THREE.Color(0xc9b6ff),
    emissiveIntensity: 0.12,
  });
}

// 拼一块圆角卡，正面贴画，侧边是浅箔
export function createCardMesh(): THREE.Mesh {
  const front = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.46, metalness: 0.02 });
  const back = new THREE.MeshStandardMaterial({ map: backTexture(), roughness: 0.42, metalness: 0.34 });
  const edge = new THREE.MeshStandardMaterial({
    color: 0xf4f1ff,
    roughness: 0.58,
    metalness: 0.06,
    emissive: new THREE.Color(0xf4f1ff),
    emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(
    roundedSlab(CARD_W, CARD_H, CARD_D, { top: CARD_R, bottom: CARD_R }, "center"),
    [front, back, edge],
  );
  mesh.castShadow = false;
  return mesh;
}

// 画好之后换上正面贴图，金边卡套只改侧边颜色
export function applyCardLook(mesh: THREE.Mesh, look: CardLook): void {
  const materials = mesh.material as THREE.MeshStandardMaterial[];
  materials[2].color.set(look.sleeve ? 0xc6a15a : 0xf4f1ff);
  if (look.sleeve) materials[2].metalness = 0.42;
  void cardTexture(look).then((map) => {
    materials[0].map = map;
    materials[0].needsUpdate = true;
  });
  mesh.userData.layers = look.layers ?? [];
}

function motionReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 按这一张当前的层，改卡边亮度和星点
function pulseCard(mesh: THREE.Mesh, now: number): void {
  const layers = (mesh.userData.layers as LightLayer[] | undefined) ?? [];
  const reduced = motionReduced();
  const edge = (mesh.material as THREE.MeshStandardMaterial[])[2];
  const hold = layers.includes("hold");
  const rim = layers.includes("rim") || hold;
  const sweep = layers.includes("sweep") && !reduced;
  const prism = layers.includes("prism") && !reduced;
  edge.emissive.set(hold ? 0xffe2a8 : 0xf4f1ff);
  let intensity = rim || hold ? 0.55 : 0;
  if (sweep) intensity = 0.15 + 0.45 * (0.5 + 0.5 * Math.sin(now / 280));
  if (prism) {
    edge.emissive.setHSL((now / 1200) % 1, 0.45, 0.72);
    intensity = Math.max(intensity, 0.8);
  }
  if (hold) intensity = Math.max(intensity, 0.85);
  edge.emissiveIntensity = intensity;
  const sparks = mesh.children.filter((child) => child.userData.spark);
  const wantSparks = layers.includes("sparks") && !reduced;
  if (!wantSparks) {
    for (const spark of sparks) mesh.remove(spark);
  } else if (sparks.length === 0) {
    for (let i = 0; i < 3; i += 1) {
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      );
      spark.userData.spark = i + 1;
      spark.position.set(i === 0 ? -0.7 : i === 1 ? 0.75 : 0.1, 0.9 - i * 0.45, 0.12);
      mesh.add(spark);
    }
  }
}

// 让箔边呼吸，减弱动效时除外
function pulsePack(root: THREE.Object3D, now: number): void {
  const reduced = motionReduced();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !Array.isArray(mesh.material)) return;
    const side = mesh.material[2] as THREE.MeshStandardMaterial;
    if (!side?.emissive) return;
    side.emissiveIntensity = reduced ? 0.12 : 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(now / 700));
  });
}

function coverSlice(img: HTMLImageElement, from: number, to: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = Math.max(1, Math.round(img.naturalHeight * (to - from)));
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(
    img,
    0,
    img.naturalHeight * from,
    img.naturalWidth,
    img.naturalHeight * (to - from),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvasTexture(canvas);
}

function makeRenderer(host: HTMLElement): { renderer: THREE.WebGLRenderer; camera: THREE.PerspectiveCamera; stop: () => void } {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const fit = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  fit();
  const observer = new ResizeObserver(fit);
  observer.observe(host);
  return { renderer, camera, stop: () => observer.disconnect() };
}

function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xf7f8ff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(2.2, 6.2, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9d4ff, 0.55);
  fill.position.set(-4, 2, 3);
  scene.add(fill);
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) material.dispose();
  });
}

// 袋身分成封口和袋腹，封口绕撕口朝镜头掀起
function createTearPack(): { root: THREE.Group; flap: THREE.Group; mouth: THREE.Mesh } {
  const root = new THREE.Group();
  const bodyH = PACK_H * (1 - FLAP);
  const flapH = PACK_H * FLAP;
  const body = new THREE.Mesh(
    roundedSlab(PACK_W, bodyH, PACK_D, { top: 0, bottom: PACK_R }, "center"),
    [foilFace(), foilFace(), foilSide()],
  );
  body.position.y = -flapH / 2;
  const flap = new THREE.Group();
  flap.position.y = bodyH / 2 - flapH / 2;
  const flapMesh = new THREE.Mesh(
    roundedSlab(PACK_W, flapH, PACK_D, { top: PACK_R, bottom: 0 }, "bottom"),
    [foilFace(), foilFace(), foilSide()],
  );
  flap.add(flapMesh);
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(PACK_W * 0.9, 0.05, PACK_D * 0.55),
    new THREE.MeshStandardMaterial({ color: 0x100e0c, roughness: 1 }),
  );
  mouth.position.y = flap.position.y;
  mouth.visible = false;
  root.add(body, mouth, flap);
  root.userData.body = body;
  root.userData.flapMesh = flapMesh;
  return { root, flap, mouth };
}

// 封面贴到封口和袋腹上
async function paintPack(root: THREE.Group, url: string | null): Promise<void> {
  const body = root.userData.body as THREE.Mesh;
  const flapMesh = root.userData.flapMesh as THREE.Mesh;
  if (!url) return;
  const img = await loadImage(url);
  if (!img) return;
  const top = coverSlice(img, 0, FLAP);
  const lower = coverSlice(img, FLAP, 1);
  (flapMesh.material as THREE.MeshStandardMaterial[])[0].map = top;
  (flapMesh.material as THREE.MeshStandardMaterial[])[0].needsUpdate = true;
  (body.material as THREE.MeshStandardMaterial[])[0].map = lower;
  (body.material as THREE.MeshStandardMaterial[])[0].needsUpdate = true;
}

// 小窗里放一只袋子，拖动时跟着转
export function mountPackPortrait(host: HTMLElement, url: string | null): () => void {
  const { renderer, camera, stop } = makeRenderer(host);
  const scene = new THREE.Scene();
  addLights(scene);
  const { root } = createTearPack();
  root.rotation.y = -0.62;
  scene.add(root);
  camera.position.set(0.35, 0.1, 6.6);
  camera.lookAt(0, 0, 0);
  void paintPack(root, url);
  let dragging = false;
  let dragged = false;
  let lastX = 0;
  const onDown = (event: PointerEvent) => {
    dragging = true;
    dragged = false;
    lastX = event.clientX;
  };
  const onMove = (event: PointerEvent) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    if (Math.abs(dx) > 3) dragged = true;
    lastX = event.clientX;
    root.rotation.y += dx * 0.012;
  };
  const onUp = () => {
    dragging = false;
  };
  const onClick = (event: MouseEvent) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  };
  host.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  host.addEventListener("click", onClick);
  renderer.setAnimationLoop(() => {
    if (!dragging) root.rotation.y += 0.004;
    pulsePack(root, performance.now());
    renderer.render(scene, camera);
  });
  return () => {
    renderer.setAnimationLoop(null);
    host.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    host.removeEventListener("click", onClick);
    stop();
    disposeObject(root);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}

// 近看一张卡，打开时正面朝前，拖动再旋转
export function mountCardViewer(host: HTMLElement, look: CardLook): () => void {
  const { renderer, camera, stop } = makeRenderer(host);
  const scene = new THREE.Scene();
  addLights(scene);
  const mesh = createCardMesh();
  applyCardLook(mesh, look);
  scene.add(mesh);
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "卡面");
  camera.position.set(0, 0, 6.2);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.rotateSpeed = 0.75;
  controls.minDistance = 3.4;
  controls.maxDistance = 9;
  controls.target.set(0, 0, 0);
  renderer.setAnimationLoop(() => {
    controls.update();
    pulseCard(mesh, performance.now());
    renderer.render(scene, camera);
  });
  return () => {
    renderer.setAnimationLoop(null);
    stop();
    controls.dispose();
    disposeObject(mesh);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}

// 拆卡桌上的袋子和正在落下的卡
export class OpenTable {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private pack: THREE.Group;
  private flap: THREE.Group;
  private mouth: THREE.Mesh;
  private cards = new Map<string, THREE.Mesh>();
  private host: HTMLElement;
  private stopResize: () => void = () => {};

  constructor(host: HTMLElement) {
    this.host = host;
    const made = makeRenderer(host);
    this.renderer = made.renderer;
    this.camera = made.camera;
    this.stopResize = made.stop;
    addLights(this.scene);
    const pack = createTearPack();
    this.pack = pack.root;
    this.flap = pack.flap;
    this.mouth = pack.mouth;
    this.pack.position.set(0, 1.72, 0);
    this.scene.add(this.pack);
    this.camera.position.set(0, 0.25, 13.6);
    this.camera.lookAt(0, 0.05, 0);
  }

  setCover(url: string | null): void {
    void paintPack(this.pack, url);
  }

  // 撕开进度带动封口掀起
  setTear(amount: number): void {
    this.flap.rotation.x = amount * 0.72;
    this.mouth.visible = amount > 0.08;
  }

  setCards(poses: CardPose[]): void {
    const live = new Set(poses.filter((pose) => pose.visible).map((pose) => pose.key));
    for (const [key, mesh] of this.cards) {
      if (live.has(key)) continue;
      this.scene.remove(mesh);
      disposeObject(mesh);
      this.cards.delete(key);
    }
    const gap = Math.min(2.62, Math.max(1.85, (this.camera.aspect * 6.1) / 4));
    for (const pose of poses) {
      if (!pose.visible) continue;
      let mesh = this.cards.get(pose.key);
      if (!mesh) {
        mesh = createCardMesh();
        mesh.userData.index = pose.index;
        applyCardLook(mesh, pose.look);
        this.cards.set(pose.key, mesh);
        this.scene.add(mesh);
      }
      mesh.userData.layers = pose.look.layers ?? [];
      const slotX = (pose.index - 2) * gap;
      mesh.position.set(slotX * pose.xMix, pose.y, pose.z);
      mesh.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
      mesh.scale.setScalar(pose.scale);
    }
  }

  // 点中已经落下的某一张
  pick(event: MouseEvent): number | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const hit = ray.intersectObjects([...this.cards.values()], false)[0];
    const index = hit?.object.userData.index;
    return typeof index === "number" ? index : null;
  }

  render(): void {
    const now = performance.now();
    pulsePack(this.pack, now);
    for (const mesh of this.cards.values()) pulseCard(mesh, now);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const mesh of this.cards.values()) disposeObject(mesh);
    this.cards.clear();
    this.stopResize();
    disposeObject(this.pack);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
