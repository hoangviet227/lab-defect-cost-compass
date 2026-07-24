// 2D Strip Packing — First-Fit Decreasing Height (FFDH shelf algorithm)
// Packs rectangular items onto a roll of fixed width, minimizing used length.

export type NestItem = {
  id: string;
  label: string;
  width: number;   // cm
  height: number;  // cm
  qty: number;
  allowRotate?: boolean;
};

export type PlacedRect = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotated: boolean;
  index: number; // instance index for the same item
};

export type NestingResult = {
  rollWidth: number;
  usedLength: number;         // cm along the roll
  placements: PlacedRect[];
  totalItemArea: number;      // sum of item areas
  usedArea: number;           // rollWidth * usedLength
  utilization: number;        // totalItemArea / usedArea (0..1)
  unplaced: { id: string; label: string; qty: number }[];
};

/**
 * FFDH-style shelf packing with kerf/gap and optional rotation.
 * @param items list of items with qty
 * @param rollWidth roll width (cm), e.g. 60
 * @param kerf blade/gap between items (cm)
 */
export function packStrip(
  items: NestItem[],
  rollWidth: number,
  kerf = 0.2
): NestingResult {
  // Expand qty → instances; each instance oriented so width ≤ rollWidth
  type Inst = { id: string; label: string; w: number; h: number; rotated: boolean; index: number };
  const insts: Inst[] = [];
  const unplaced: { id: string; label: string; qty: number }[] = [];

  for (const it of items) {
    for (let i = 0; i < it.qty; i++) {
      let w = it.width, h = it.height, rotated = false;
      if (w > rollWidth) {
        if (it.allowRotate !== false && h <= rollWidth) {
          [w, h] = [h, w]; rotated = true;
        } else {
          const found = unplaced.find((u) => u.id === it.id);
          if (found) found.qty += 1; else unplaced.push({ id: it.id, label: it.label, qty: 1 });
          continue;
        }
      } else if (it.allowRotate !== false && h <= rollWidth && h > w) {
        // prefer taller side along roll to shorten used length
        [w, h] = [h, w]; rotated = true;
      }
      insts.push({ id: it.id, label: it.label, w, h, rotated, index: i });
    }
  }

  // Sort by decreasing height (dimension along roll length)
  insts.sort((a, b) => b.h - a.h);

  type Shelf = { y: number; h: number; cursorX: number };
  const shelves: Shelf[] = [];
  const placements: PlacedRect[] = [];
  let usedLength = 0;

  for (const it of insts) {
    let placed = false;
    for (const s of shelves) {
      const needX = s.cursorX === 0 ? it.w : s.cursorX + kerf + it.w;
      if (needX <= rollWidth && it.h <= s.h + 1e-6) {
        const x = s.cursorX === 0 ? 0 : s.cursorX + kerf;
        placements.push({ id: it.id, label: it.label, x, y: s.y, w: it.w, h: it.h, rotated: it.rotated, index: it.index });
        s.cursorX = x + it.w;
        placed = true;
        break;
      }
    }
    if (!placed) {
      const y = usedLength === 0 ? 0 : usedLength + kerf;
      shelves.push({ y, h: it.h, cursorX: it.w });
      placements.push({ id: it.id, label: it.label, x: 0, y, w: it.w, h: it.h, rotated: it.rotated, index: it.index });
      usedLength = y + it.h;
    }
  }

  const totalItemArea = placements.reduce((s, p) => s + p.w * p.h, 0);
  const usedArea = rollWidth * usedLength;
  const utilization = usedArea > 0 ? totalItemArea / usedArea : 0;

  return { rollWidth, usedLength, placements, totalItemArea, usedArea, utilization, unplaced };
}
