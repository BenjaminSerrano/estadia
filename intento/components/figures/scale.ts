// Shared helpers for the publication figures (explicit fonts and colors, so exports match the screen)

export const FONT = "Arial, Helvetica, sans-serif"

// Round ticks (1, 2 or 5 × 10^k) that cover [lo, hi], about `count` of them
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!(hi > lo)) hi = lo + 1
  const raw = (hi - lo) / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].find(m => m * mag >= raw)! * mag
  const ticks: number[] = []
  for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + step / 1e6; v += step) ticks.push(+v.toFixed(10))
  return ticks
}

export const truncate = (s: string, n: number) => s.length > n ? `${s.slice(0, n - 1)}…` : s

// Linear blend of two "#rrggbb" colors (t = 0 → a, t = 1 → b)
export function mixColor(a: string, b: string, t: number) {
  const ch = (c: string, i: number) => parseInt(c.slice(1 + 2 * i, 3 + 2 * i), 16)
  return "#" + [0, 1, 2].map(i => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, "0")).join("")
}
