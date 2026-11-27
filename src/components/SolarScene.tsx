import type { ReactNode } from 'react'
import type { SolarScene as SolarSceneId } from '../types/game'

function Plate({ id, children }: { id: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 160 112" className="solar-scene" aria-hidden>
      <defs>
        <filter id={`sw-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      {children}
    </svg>
  )
}

function Ink({ d, w = 1, o = 1 }: { d: string; w?: number; o?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={o}
    />
  )
}

function Wash({ id, d, o = 0.34 }: { id: string; d: string; o?: number }) {
  return <path d={d} fill="var(--pigment)" stroke="none" opacity={o} filter={`url(#sw-${id})`} />
}

function Mist({ y = 18 }: { y?: number }) {
  return <Ink d={`M12 ${y} C40 ${y - 6} 70 ${y + 4} 148 ${y - 2}`} w={0.6} o={0.28} />
}

const SCENES: Record<SolarSceneId, () => ReactNode> = {
  lichun: () => (
    <Plate id="lichun">
      <Wash id="lichun" d="M18 78 C40 70 62 88 88 76 C112 66 130 80 148 74 L150 104 L14 104 Z" o={0.28} />
      <Ink d="M16 86 C36 80 48 92 70 84 C92 76 118 94 146 82" w={0.7} o={0.4} />
      <Ink d="M28 90 l6 8 M44 88 l4 10 M96 86 l5 9 M120 84 l4 8" w={0.6} o={0.45} />
      <Ink d="M24 70 C48 48 62 36 92 22" w={1.35} />
      <Ink d="M70 40 C62 34 64 24 74 26 C80 18 90 24 86 34 C96 30 100 40 90 42 Z" w={0.9} />
      <circle cx="78" cy="32" r="2.2" fill="var(--pigment)" />
      <circle cx="58" cy="48" r="2.4" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="102" cy="20" r="1.8" fill="var(--pigment)" />
      <Ink d="M108 18 C116 14 122 20 118 26" w={0.7} />
    </Plate>
  ),
  yushui: () => (
    <Plate id="yushui">
      <Ink d="M14 34 H146" w={1.2} />
      <Ink d="M18 34 v8 M32 34 v10 M46 34 v8 M60 34 v10 M74 34 v8 M88 34 v10 M102 34 v8 M116 34 v10 M130 34 v8 M144 34 v9" w={0.7} />
      <Ink d="M22 28 C40 22 58 28 74 24 C96 18 120 26 146 20" w={0.8} o={0.45} />
      <Ink d="M36 46 v22 M52 44 v26 M70 48 v18 M96 42 v28 M118 46 v20" w={0.55} o={0.55} />
      <Wash id="yushui" d="M28 92 C48 78 70 86 86 96 C70 104 40 104 28 92 Z" />
      <Ink d="M48 96 C52 88 58 90 60 98" w={1} />
      <Ink d="M56 86 C60 80 66 82 64 90" w={0.8} />
    </Plate>
  ),
  jingzhe: () => (
    <Plate id="jingzhe">
      <Mist />
      <Ink d="M18 96 C50 90 78 100 112 92 C128 88 140 94 150 90" w={0.7} o={0.4} />
      <Ink d="M30 78 C36 64 28 52 40 46" w={1.15} />
      <circle cx="36" cy="58" r="5" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="48" cy="44" r="4.2" fill="var(--pigment)" opacity="0.85" />
      <circle cx="28" cy="48" r="3.4" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <Ink d="M108 16 l8 18 l-6 2 l10 16" w={0.9} />
      <Ink d="M86 70 C92 62 100 66 98 76 C92 72 86 76 86 70 Z" w={0.9} />
      <Ink d="M94 76 v8 M90 84 h8" w={0.7} />
    </Plate>
  ),
  chunfen: () => (
    <Plate id="chunfen">
      <Wash id="chunfen" d="M12 62 C40 54 78 72 118 58 C140 50 152 60 150 70 C124 84 48 86 16 74 Z" o={0.32} />
      <Ink d="M8 56 H152" w={0.85} />
      <circle cx="118" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
      <Ink d="M118 18 v-4 M118 46 v4 M102 30 h-4 M138 30 h4" w={0.6} o={0.5} />
      <Ink d="M46 48 C40 40 34 42 36 50 C30 48 28 56 36 58 C34 64 44 64 46 56 C52 60 56 52 48 48 Z" w={1} />
      <Ink d="M36 54 l-10 2 M50 52 l8 -2" w={0.7} />
      <Ink d="M48 70 C44 78 52 82 56 76" w={0.6} o={0.45} />
    </Plate>
  ),
  qingming: () => (
    <Plate id="qingming">
      <Ink d="M118 8 C108 36 112 64 96 104" w={1.25} />
      <Ink d="M112 28 C86 34 78 46 82 58 M108 46 C84 54 78 68 84 80 M104 66 C86 72 82 84 90 94" w={0.7} />
      <Ink d="M24 18 v16 M34 24 v18 M46 16 v20 M28 48 v14 M40 52 v12 M56 22 v18" w={0.5} o={0.4} />
      <Ink d="M18 78 C40 70 58 84 78 76" w={0.8} o={0.35} />
      <Wash id="qingming" d="M22 86 C40 74 62 90 80 80 C70 98 36 100 22 86 Z" o={0.22} />
    </Plate>
  ),
  guyu: () => (
    <Plate id="guyu">
      <Wash id="guyu" d="M16 76 C42 66 74 82 108 72 C132 64 148 74 146 86 C118 98 48 100 18 88 Z" o={0.24} />
      <Ink d="M12 68 H148" w={0.7} o={0.45} />
      <ellipse cx="36" cy="78" rx="10" ry="3.4" fill="var(--pigment)" opacity="0.55" />
      <ellipse cx="62" cy="84" rx="8" ry="2.8" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <ellipse cx="96" cy="76" rx="11" ry="3.2" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <ellipse cx="122" cy="86" rx="8" ry="2.6" fill="var(--pigment)" opacity="0.4" />
      <Ink d="M40 40 C48 28 62 30 58 44 C70 36 78 46 66 52" w={1} />
      <Ink d="M108 24 C116 16 128 22 122 34 C132 28 138 38 126 42" w={0.9} />
      <Ink d="M78 36 C86 30 92 34 88 42" w={0.8} />
    </Plate>
  ),
  lixia: () => (
    <Plate id="lixia">
      <Wash id="lixia" d="M18 88 C48 80 90 96 140 86 C132 102 40 104 16 96 Z" o={0.22} />
      <Ink d="M18 90 H142" w={0.7} o={0.4} />
      <Ink d="M34 90 C30 74 40 64 36 50 C44 60 48 74 44 90" w={0.9} />
      <Ink d="M78 96 C80 70 70 48 76 24" w={1.2} />
      <Ink d="M76 40 C60 36 52 26 58 16 M76 58 C96 50 108 40 104 26" w={0.85} />
      <circle cx="40" cy="62" r="1.5" fill="currentColor" />
      <Ink d="M108 70 h10 l2 7 h-8 z" w={0.8} />
      <circle cx="48" cy="78" r="2" fill="var(--pigment)" />
    </Plate>
  ),
  xiaoman: () => (
    <Plate id="xiaoman">
      <Ink d="M28 100 C32 62 24 40 36 18" w={1.05} />
      <Ink d="M36 28 l6 8 M34 40 l-7 6 M38 52 l7 7 M32 66 l-6 6 M40 78 l6 7" w={0.75} />
      <Ink d="M70 104 C78 58 64 36 80 16" w={1.15} />
      <Ink d="M80 26 l7 7 M76 40 l-8 6 M82 54 l8 6 M74 68 l-7 6 M84 82 C96 88 104 96 98 104" w={0.8} />
      <Ink d="M112 100 C116 66 108 44 120 22" w={1} />
      <Ink d="M120 32 l6 7 M118 46 l-6 6 M122 60 l7 6 M116 74 l-6 6" w={0.75} />
      <Wash id="xiaoman" d="M74 14 h16 l-2 12 h-12 z" o={0.45} />
    </Plate>
  ),
  mangzhong: () => (
    <Plate id="mangzhong">
      <Ink d="M22 100 V46 M40 100 V38 M58 100 V50 M76 100 V42" w={1} />
      <Ink d="M22 46 l-5 -12 M22 46 l5 -14 M40 38 l-6 -12 M40 38 l6 -14 M58 50 l-5 -11 M58 50 l6 -12 M76 42 l-5 -12 M76 42 l5 -13" w={0.65} />
      <Ink d="M112 78 C122 60 132 64 128 48 C136 62 126 70 120 86 C114 80 108 84 112 78 Z" w={1} />
      <Ink d="M120 86 V102 M116 96 h8" w={0.8} />
      <circle cx="124" cy="66" r="1.3" fill="var(--pigment)" />
      <Wash id="mangzhong" d="M108 96 H146 V106 H108 Z" o={0.25} />
    </Plate>
  ),
  xiazhi: () => (
    <Plate id="xiazhi">
      <circle cx="80" cy="34" r="11" fill="var(--pigment)" />
      <Ink d="M80 14 v-4 M58 22 l-4 -4 M102 22 l4 -4 M50 34 h-6 M116 34 h6" w={0.7} o={0.55} />
      <Ink d="M16 78 C48 70 112 70 146 78" w={1.1} />
      <Ink d="M80 78 v10" w={1.3} />
      <Ink d="M104 62 C112 54 120 58 116 68 C110 64 104 68 104 62 Z" w={0.85} />
      <Ink d="M108 68 v6" w={0.6} />
      <Wash id="xiazhi" d="M70 88 H90 L84 100 H76 Z" o={0.2} />
    </Plate>
  ),
  xiaoshu: () => (
    <Plate id="xiaoshu">
      <Ink d="M18 30 H78 M22 42 H90 M16 54 H70 M26 66 H84" w={0.8} o={0.55} />
      <Ink d="M104 16 V100" w={1.35} />
      <Ink d="M104 16 H132 M104 40 H128 M104 70 H136 M104 100 H140" w={0.7} />
      <Ink d="M118 58 h14 v12 h-8 v10 h-6 z" w={0.95} />
      <circle cx="124" cy="64" r="1.2" fill="currentColor" />
      <Wash id="xiaoshu" d="M112 78 h18 v16 h-18 z" o={0.28} />
    </Plate>
  ),
  dashu: () => (
    <Plate id="dashu">
      <Ink d="M12 36 C36 28 52 46 80 38 C108 30 124 48 150 40" w={1} />
      <Ink d="M30 48 v30 M48 46 v36 M66 50 v28 M92 48 v34 M114 46 v32 M134 50 v26" w={0.6} o={0.45} />
      <Ink d="M24 96 H146" w={0.9} />
      <circle cx="42" cy="78" r="1.7" fill="var(--pigment)" />
      <circle cx="64" cy="70" r="1.4" fill="var(--pigment)" />
      <circle cx="88" cy="84" r="1.8" fill="var(--pigment)" />
      <circle cx="108" cy="74" r="1.3" fill="var(--pigment)" />
      <circle cx="126" cy="82" r="1.6" fill="var(--pigment)" />
      <Wash id="dashu" d="M36 74 C48 64 60 76 52 88 C40 86 32 82 36 74 Z" o={0.35} />
    </Plate>
  ),
  liqiu: () => (
    <Plate id="liqiu">
      <Ink d="M12 42 C40 36 64 50 96 44 C120 38 136 30 150 26" w={1.05} />
      <Ink d="M28 96 C34 70 30 52 40 40" w={1} />
      <Ink d="M48 96 C52 74 46 58 56 46" w={0.85} />
      <Ink d="M68 98 C72 76 66 60 74 48" w={0.8} />
      <Ink d="M36 58 C48 54 52 62 44 66 M52 62 C62 58 66 66 58 70" w={0.7} />
      <circle cx="46" cy="72" r="2.1" fill="var(--pigment)" />
      <Ink d="M112 58 C122 50 132 58 124 70 C116 62 108 66 112 58 Z" w={1} />
      <Ink d="M118 70 v8" w={0.7} />
    </Plate>
  ),
  chushu: () => (
    <Plate id="chushu">
      <Ink d="M16 24 H72" w={0.6} o={0.35} />
      <Ink d="M34 100 C40 72 30 48 42 28" w={1.15} />
      <Ink d="M42 46 C58 40 66 50 58 62 M42 66 C60 62 70 74 58 84" w={0.85} />
      <Ink d="M78 96 C86 70 80 48 92 34 C100 48 96 70 102 96" w={1} />
      <Ink d="M86 96 H108 M92 90 H104" w={0.7} />
      <Ink d="M118 30 C128 24 138 32 132 42 C140 36 146 28 136 22" w={0.95} />
      <Wash id="chushu" d="M124 28 C136 24 142 36 132 40 C126 34 120 34 124 28 Z" />
    </Plate>
  ),
  bailu: () => (
    <Plate id="bailu">
      <Ink d="M30 104 C34 70 26 48 36 24" w={1} />
      <Ink d="M62 104 C66 66 56 44 68 20" w={1.05} />
      <Ink d="M94 104 C98 72 88 50 100 28" w={1} />
      <circle cx="36" cy="34" r="2" fill="var(--pigment)" />
      <circle cx="68" cy="30" r="2.2" fill="var(--pigment)" />
      <circle cx="100" cy="40" r="1.8" fill="var(--pigment)" />
      <circle cx="48" cy="58" r="1.5" fill="var(--pigment)" opacity="0.8" />
      <Ink d="M118 22 l14 4 l-6 3 l10 8 l-4 2" w={1.05} />
      <Ink d="M132 26 l8 -4 M140 34 l6 2" w={0.7} />
    </Plate>
  ),
  qiufen: () => (
    <Plate id="qiufen">
      <Ink d="M10 56 H150" w={0.75} />
      <Ink d="M24 34 C36 22 52 30 46 44 C58 36 66 24 54 16" w={0.9} o={0.4} />
      <Ink d="M40 30 l-14 6" w={0.7} o={0.35} />
      <Wash id="qiufen" d="M12 78 C36 70 60 88 92 76 C118 66 140 78 152 72 V106 H12 Z" o={0.26} />
      <Ink d="M36 90 C42 82 50 86 48 94" w={0.85} />
      <Ink d="M70 96 h16 M78 90 h8 M104 88 h14" w={0.6} o={0.5} />
    </Plate>
  ),
  hanlu: () => (
    <Plate id="hanlu">
      <circle cx="78" cy="58" r="8" fill="var(--pigment)" />
      <Ink d="M78 50 C70 40 62 46 66 56 C56 50 52 62 64 66 C58 76 72 80 76 68 C86 78 98 70 90 60 C100 56 96 42 84 48 C90 38 80 34 78 50 Z" w={0.95} />
      <Ink d="M78 80 V100" w={1} />
      <Ink d="M70 92 H86" w={0.7} />
      <circle cx="30" cy="28" r="1.8" fill="var(--pigment)" />
      <circle cx="124" cy="36" r="1.5" fill="var(--pigment)" />
      <circle cx="112" cy="22" r="1.3" fill="var(--pigment)" opacity="0.7" />
      <Ink d="M18 24 H46 M108 18 H140" w={0.55} o={0.3} />
    </Plate>
  ),
  shuangjiang: () => (
    <Plate id="shuangjiang">
      <Ink d="M22 20 C36 40 30 64 24 104" w={1.2} />
      <Ink d="M34 42 c12 2 16 12 6 16 M30 62 c14 0 18 12 6 16 M28 82 c12 2 14 10 4 14" w={0.8} />
      <Ink d="M70 36 l6 10 h-12 z" w={0.8} />
      <path d="M96 24 l6 10 h-12 z" fill="var(--pigment)" opacity="0.75" />
      <path d="M118 46 l7 11 h-14 z" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M104 68 l6 10 h-12 z" fill="var(--pigment)" opacity="0.55" />
      <path d="M132 78 l5 9 h-10 z" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <Ink d="M14 100 H148" w={0.55} o={0.35} />
    </Plate>
  ),
  lidong: () => (
    <Plate id="lidong">
      <Ink d="M12 62 C36 54 58 70 84 60 C110 50 130 66 150 58" w={1} />
      <Ink d="M26 62 v10 M44 58 v12 M64 62 v8 M96 56 v14 M122 60 v10" w={0.65} o={0.6} />
      <Wash id="lidong" d="M14 76 C46 68 88 86 132 74 C148 70 152 82 146 92 C110 104 40 102 14 90 Z" o={0.26} />
      <Ink d="M24 84 H70 M34 84 v12 M48 84 v8 M60 84 v14" w={0.8} />
      <Ink d="M96 86 h28 M104 86 v10 M116 86 v7" w={0.7} o={0.7} />
    </Plate>
  ),
  xiaoxue: () => (
    <Plate id="xiaoxue">
      <Wash id="xiaoxue" d="M14 80 C44 72 78 90 118 78 C140 70 152 82 146 94 C112 104 36 102 14 92 Z" o={0.2} />
      <Ink d="M10 82 C40 74 72 92 108 80 C128 74 146 84 154 78" w={0.85} />
      <circle cx="32" cy="28" r="1.3" fill="currentColor" />
      <circle cx="58" cy="40" r="1.15" fill="currentColor" />
      <circle cx="84" cy="24" r="1.2" fill="currentColor" />
      <circle cx="112" cy="36" r="1.1" fill="currentColor" />
      <circle cx="136" cy="22" r="1.25" fill="currentColor" />
      <circle cx="48" cy="58" r="1.05" fill="currentColor" opacity="0.7" />
      <circle cx="96" cy="52" r="1.15" fill="currentColor" opacity="0.75" />
    </Plate>
  ),
  daxue: () => (
    <Plate id="daxue">
      <Ink d="M48 104 C52 72 40 46 58 18" w={1.4} />
      <Ink d="M58 36 C78 30 96 46 86 64 C72 54 58 60 58 44" w={1.05} />
      <Ink d="M70 28 C84 22 92 32 82 40" w={0.8} />
      <Ink d="M22 24 h16 M18 32 h12 M34 18 h12 M108 16 h18 M116 24 h14 M102 32 h16 M124 40 h10" w={0.7} o={0.45} />
      <Ink d="M116 78 C126 68 140 76 134 90 C124 82 114 88 116 78 Z" w={1} />
      <Ink d="M126 90 V104" w={0.85} />
      <circle cx="92" cy="48" r="2" fill="var(--pigment)" />
    </Plate>
  ),
  dongzhi: () => (
    <Plate id="dongzhi">
      <Ink d="M18 46 C48 74 112 74 144 46" w={1.15} />
      <circle cx="80" cy="62" r="4.5" fill="var(--pigment)" />
      <Ink d="M80 70 v8" w={0.8} />
      <Wash id="dongzhi" d="M62 96 C74 84 90 86 98 100 C84 108 66 106 62 96 Z" />
      <Ink d="M80 96 m-6 0 a6 3.2 0 1 0 12 0 a6 3.2 0 1 0 -12 0" w={0.8} />
      <Ink d="M80 96 m-3 0 a3 1.6 0 1 0 6 0" w={0.6} />
      <Ink d="M28 28 H52 M112 24 H138" w={0.5} o={0.3} />
    </Plate>
  ),
  xiaohan: () => (
    <Plate id="xiaohan">
      <Ink d="M18 100 C36 70 28 46 46 30 C62 46 54 74 70 102" w={1.15} />
      <Ink d="M46 30 C70 20 98 28 112 46" w={1} />
      <Ink d="M96 40 C108 36 118 44 112 54 C122 48 130 56 120 62 C128 66 122 76 112 70" w={0.9} />
      <Ink d="M104 48 h10 M108 56 h8" w={0.6} />
      <Ink d="M124 18 l10 4 l-8 2 l6 6" w={0.85} />
      <circle cx="40" cy="24" r="1.2" fill="currentColor" opacity="0.45" />
    </Plate>
  ),
  dahan: () => (
    <Plate id="dahan">
      <Wash id="dahan" d="M18 66 C50 58 96 76 142 64 C150 78 120 96 70 98 C30 96 12 82 18 66 Z" o={0.24} />
      <Ink d="M14 60 H148" w={1.15} />
      <Ink d="M28 60 v16 M46 60 v22 M64 60 v14 M86 60 v26 M108 60 v18 M128 60 v22" w={0.75} />
      <Ink d="M80 78 l18 -8 M80 78 l16 10 M80 78 l-6 16 M80 78 l-16 6" w={0.6} o={0.55} />
      <Ink d="M118 26 C130 16 146 26 138 40 C128 30 118 34 118 26 Z" w={1.05} />
      <Ink d="M128 40 V52" w={0.7} />
    </Plate>
  ),
}

/** 一气一图。墨线勾形，矿物色只点在物象上。 */
export function SolarScene({ id }: { id: SolarSceneId }) {
  const Scene = SCENES[id]
  return <Scene />
}
