// Complete-linkage hierarchical clustering on Euclidean distances, following R's
// hclust(dist(m), "complete") (hclust.f + hcass2): same merges, heights and leaf order,
// so heatmap rows come out as in pheatmap in the issue's script. Ties may break
// differently. O(n³): fine for the few hundred rows a heatmap shows.

export interface Tree {
  merge: [number, number][] // R convention: -i = row i (1-based), +s = cluster formed at step s
  height: number[]
  order: number[] // rows (0-based) top to bottom
}

export function hclustComplete(rows: number[][]): Tree {
  const n = rows.length
  if (n < 2) return { merge: [], height: [], order: rows.map((_, i) => i) }
  const d = rows.map(a => rows.map(b => Math.sqrt(a.reduce((sum, v, k) => sum + (v - b[k]) ** 2, 0))))
  const active = rows.map(() => true)
  const formedAt = rows.map(() => 0) // step that formed the cluster a row represents (0 = still a single row)
  const merge: [number, number][] = []
  const height: number[] = []

  for (let step = 1; step < n; step++) {
    // Closest pair; on ties the first (i, j) in row order, like hclust.f
    let bi = -1, bj = -1, best = Infinity
    for (let i = 0; i < n; i++) {
      if (!active[i]) continue
      for (let j = i + 1; j < n; j++) if (active[j] && d[i][j] < best) { best = d[i][j]; bi = i; bj = j }
    }
    const a = formedAt[bi] || -(bi + 1)
    const b = formedAt[bj] || -(bj + 1)
    // hcass2: a single row goes first; two clusters in the order they were formed
    merge.push(a > 0 && b < 0 ? [b, a] : a > 0 && b > 0 ? [Math.min(a, b), Math.max(a, b)] : [a, b])
    height.push(best)
    // The merged cluster keeps the smaller row index; complete linkage = farthest members
    for (let k = 0; k < n; k++) {
      if (active[k] && k !== bi && k !== bj) d[bi][k] = d[k][bi] = Math.max(d[bi][k], d[bj][k])
    }
    active[bj] = false
    formedAt[bi] = step
  }

  // Leaf order: start from the last merge and replace each cluster by its two members
  const order = [...merge[n - 2]]
  for (let step = n - 2; step >= 1; step--) order.splice(order.indexOf(step), 1, ...merge[step - 1])
  return { merge, height, order: order.map(x => -x - 1) }
}
