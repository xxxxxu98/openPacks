const plates = import.meta.glob('../assets/plates/*/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function plateSrc(art: string) {
  const entry = Object.entries(plates).find(([path]) => path.endsWith(`/${art}.jpg`))
  return entry?.[1] ?? ''
}

/** 画心卡的整张画面。没有图时留空底，题款仍由卡面印。 */
export function PlateArt({ art }: { art: string }) {
  const src = plateSrc(art)
  if (!src) return <div className="plate-missing" />
  return <img className="plate-art" src={src} alt="" />
}
