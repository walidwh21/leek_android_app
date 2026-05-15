import type { ProductWithStock } from "@/lib/types/database";

/** Read on-hand quantity from joined inventory row(s). */
export function stockOf(p: ProductWithStock): number {
  const inv = p.inventory;
  if (!inv) return 0;
  const row = Array.isArray(inv) ? inv[0] : inv;
  return row?.quantity ?? 0;
}
