import type { Rarity } from '../types/game'

const FLIP_NOTES: Record<Rarity, readonly number[]> = {
  N: [523, 659],
  R: [587, 740],
  SR: [659, 831, 988],
  SSR: [784, 988, 1175],
  SECRET: [880, 1175, 1568, 1760],
}

/** 用 Web Audio 实时合成点击、撕裂、爆发和翻卡，不加载外部音频。 */
class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private muted = false
  private lastTear = 0

  setMuted(muted: boolean) {
    this.muted = muted
  }

  /** 在第一次按键或指针操作里恢复音频上下文。 */
  unlock() {
    const ctx = this.context()
    if (ctx.state === 'suspended') void ctx.resume()
  }

  click() {
    this.tone(740, 0.05, 'triangle', 0, 0.05)
  }

  /** 摇包：短促噪声摩擦加两下闷击。 */
  shake() {
    if (!this.ready()) return
    this.noiseBurst(0.42, 700, 1600, 0.12)
    this.tone(140, 0.08, 'sine', 0, 0.06)
    this.tone(110, 0.09, 'sine', 0.12, 0.05)
  }

  /** 撕裂音高跟着封条进度往上走。 */
  tear(progress: number) {
    const now = performance.now()
    if (now - this.lastTear < 70) return
    this.lastTear = now
    if (!this.ready()) return
    const pitch = 220 + progress * 860
    this.noiseBurst(0.07, pitch, pitch + 400, 0.05)
    this.tone(pitch, 0.06, 'sawtooth', 0, 0.02)
  }

  /** 撕开瞬间的金光和弦与一道噪声光柱。 */
  burst() {
    if (!this.ready()) return
    this.noiseBurst(0.7, 400, 2400, 0.1)
    for (const [index, freq] of [392, 494, 587, 784].entries()) {
      this.tone(freq, 0.85, 'triangle', index * 0.03, 0.06)
    }
  }

  /** 翻卡和弦随稀有度加音。 */
  flip(rarity: Rarity) {
    if (!this.ready()) return
    for (const [index, freq] of FLIP_NOTES[rarity].entries()) {
      this.tone(freq, 0.28, 'sine', index * 0.045, rarity === 'SECRET' ? 0.07 : 0.05)
    }
  }

  coin() {
    if (!this.ready()) return
    this.tone(988, 0.09, 'square', 0, 0.04)
    this.tone(1318, 0.14, 'square', 0.07, 0.04)
  }

  private ready() {
    if (this.muted) return false
    const ctx = this.context()
    if (ctx.state === 'suspended') void ctx.resume()
    return true
  }

  private context() {
    if (!this.ctx) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0.75
      master.connect(ctx.destination)
      this.ctx = ctx
      this.master = master
    }
    return this.ctx
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    when: number,
    peak: number,
  ) {
    if (!this.ready() || !this.master) return
    const ctx = this.context()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = ctx.currentTime + when
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.018)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  private noiseBurst(duration: number, from: number, to: number, peak: number) {
    if (!this.master) return
    const ctx = this.context()
    const source = ctx.createBufferSource()
    source.buffer = this.noise()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(from, ctx.currentTime)
    filter.frequency.linearRampToValueAtTime(to, ctx.currentTime + duration)
    filter.Q.value = 0.7
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start()
    source.stop(ctx.currentTime + duration + 0.02)
  }

  private noise() {
    const ctx = this.context()
    if (this.noiseBuffer) return this.noiseBuffer
    const length = ctx.sampleRate
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < length; index += 1) data[index] = Math.random() * 2 - 1
    this.noiseBuffer = buffer
    return buffer
  }
}

export const sound = new SoundEngine()
