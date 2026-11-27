import { GRADE_HIT_SEC } from '../gradeHit'
import type { Rarity } from '../types/game'

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

  /** 撕开瞬间的光柱。包里最高品级越高，和弦越亮、越长。 */
  burst(rarity: Rarity = 'N') {
    if (!this.ready()) return
    const high = rarity === 'SR' || rarity === 'SSR' || rarity === 'SECRET'
    this.noiseBurst(high ? 0.85 : 0.55, high ? 280 : 500, rarity === 'SECRET' ? 4200 : 2400, high ? 0.11 : 0.08)
    const chord =
      rarity === 'SECRET'
        ? [392, 494, 587, 784, 988]
        : rarity === 'SSR'
          ? [392, 494, 587, 784]
          : rarity === 'SR'
            ? [349, 440, 554]
            : [392, 494, 587]
    for (const [index, freq] of chord.entries()) {
      this.tone(freq, rarity === 'SECRET' ? 1.15 : 0.85, 'triangle', index * 0.04, rarity === 'N' ? 0.045 : 0.06)
    }
    if (rarity === 'SR') this.drop(180, 0.2, 0.06)
    if (rarity === 'SSR' || rarity === 'SECRET') {
      this.drop(rarity === 'SECRET' ? 90 : 140, 0.34, 0.07)
      this.glide(440, rarity === 'SECRET' ? 1760 : 1175, 0.7, 'sine', 0.05, 0.03)
    }
  }

  /** 翻开时按品级给不同的声音。高等级先轻轻升起，落到正中再落印。 */
  flip(rarity: Rarity) {
    if (!this.ready()) return
    if (rarity === 'N') {
      this.noiseBurst(0.07, 1400, 2100, 0.03)
      this.tone(349, 0.09, 'sine', 0.01, 0.03)
      return
    }
    if (rarity === 'R') {
      this.tone(523, 0.14, 'triangle', 0, 0.045)
      this.tone(659, 0.18, 'triangle', 0.07, 0.038)
      return
    }
    const hit = GRADE_HIT_SEC
    this.glide(196, 620, hit, 'sine', 0, 0.016)
    this.noiseBurst(hit * 0.85, 420, 1400, 0.022)
    if (rarity === 'SR') {
      this.drop(210, 0.16, 0.07, hit)
      this.noiseBurst(0.16, 700, 2400, 0.045, hit)
      this.tone(587, 0.2, 'triangle', hit + 0.04, 0.05)
      this.tone(740, 0.24, 'triangle', hit + 0.1, 0.044)
      this.tone(988, 0.28, 'sine', hit + 0.16, 0.036)
      return
    }
    if (rarity === 'SSR') {
      this.drop(160, 0.28, 0.06, hit)
      this.noiseBurst(0.42, 280, 3400, 0.06, hit)
      this.glide(392, 1175, 0.55, 'sine', hit + 0.02, 0.032)
      for (const [index, freq] of [523, 659, 784, 1047].entries()) {
        this.tone(freq, 0.72, 'triangle', hit + index * 0.06, 0.048)
      }
      this.tone(1568, 0.36, 'sine', hit + 0.22, 0.026)
      this.noiseBurst(0.32, 220, 3800, 0.06, hit + 0.2)
      this.tone(1318, 0.42, 'sine', hit + 0.2, 0.03)
      return
    }
    this.drop(92, 0.45, 0.08, hit)
    this.noiseBurst(0.85, 180, 4600, 0.07, hit)
    this.glide(330, 1760, 0.9, 'sine', hit + 0.06, 0.034)
    for (const [index, freq] of [523, 784, 1047, 1319, 1568].entries()) {
      this.tone(freq, 1.15, 'triangle', hit + 0.08 + index * 0.09, 0.042)
      this.tone(freq * 1.01, 1.05, 'sine', hit + 0.1 + index * 0.09, 0.016)
    }
    this.noiseBurst(0.4, 160, 4800, 0.075, hit + 0.22)
    this.tone(2093, 0.5, 'sine', hit + 0.24, 0.028)
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

  /** 音高往上滑，高等级翻开时有一道上升的光。 */
  private glide(
    from: number,
    to: number,
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
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(to, start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  /** 一下闷击，音高很快落下去。 */
  private drop(freq: number, duration: number, peak: number, when = 0) {
    if (!this.ready() || !this.master) return
    const ctx = this.context()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = ctx.currentTime + when
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), start + duration)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }

  private noiseBurst(duration: number, from: number, to: number, peak: number, when = 0) {
    if (!this.master) return
    const ctx = this.context()
    const start = ctx.currentTime + when
    const source = ctx.createBufferSource()
    source.buffer = this.noise()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(from, start)
    filter.frequency.linearRampToValueAtTime(to, start + duration)
    filter.Q.value = 0.7
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start(start)
    source.stop(start + duration + 0.02)
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
