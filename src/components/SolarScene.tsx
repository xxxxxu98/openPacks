import type { SolarScene as SolarSceneId } from '../types/game'

const scenes = import.meta.glob('../assets/solar/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

/** 按节气 id 取画心。文件名与场景 id 相同。 */
function sceneSrc(id: SolarSceneId) {
  const entry = Object.entries(scenes).find(([path]) => path.endsWith(`/${id}.jpg`))
  return entry?.[1] ?? ''
}

/** 节气画心。一气一张工笔，题款和品级仍印在册页上。 */
export function SolarScene({ id }: { id: SolarSceneId }) {
  return <img className="solar-scene" src={sceneSrc(id)} alt="" />
}
