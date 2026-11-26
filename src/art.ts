import type { CardDef } from "./odds";

export type PackDef = {
  id: string;
  name: string;
  seriesId: string;
  seriesName: string;
  cards: CardDef[];
};

/** 袋面和每张卡图都在才算这包图齐 */
export function packArtReady(pack: PackDef, files: Set<string>): boolean {
  if (!files.has(`packs/${pack.id}.webp`)) return false;
  return pack.cards.every((card) => files.has(`cards/${pack.id}/${card.id}.webp`));
}
