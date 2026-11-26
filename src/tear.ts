export const TEAR_THRESHOLD = 2 / 3;

// 按轨道宽度把水平拖动折算成 0~1 撕开进度
export function tearProgress(dragPx: number, trackPx: number): number {
  if (trackPx <= 0) return 0;
  return Math.min(1, Math.max(0, dragPx / trackPx));
}

// 判断撕开进度是否达到打开阈值
export function isOpened(progress: number): boolean {
  return progress >= TEAR_THRESHOLD;
}