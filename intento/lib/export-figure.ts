// Downloads for figures (SVG, PNG) and tables (CSV), all generated in the browser.

type Cell = string | number | boolean | null | undefined

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const csvCell = (v: Cell) => {
  if (v == null) return "NA"
  // Uploads have no auth: text such as a gene ID starting with "=" would run as a formula in Excel.
  // Only strings are escaped, so negative numbers (log2FC) stay numeric.
  const s = typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// BOM so Excel reads UTF-8 (°C, accents); R's read.csv handles it too
export const downloadCsv = (rows: Cell[][], filename: string) =>
  save(new Blob(["﻿" + rows.map(r => r.map(csvCell).join(",")).join("\n") + "\n"], { type: "text/csv;charset=utf-8" }), filename)

function serialize(svg: SVGSVGElement) {
  const { width, height } = svg.viewBox.baseVal
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  clone.setAttribute("width", String(width))
  clone.setAttribute("height", String(height))
  clone.removeAttribute("class")
  return { text: new XMLSerializer().serializeToString(clone), width, height }
}

export const downloadSvg = (svg: SVGSVGElement, name: string) =>
  save(new Blob([serialize(svg).text], { type: "image/svg+xml" }), `${name}.svg`)

// The figure's user units are CSS pixels (96 per inch), so 300 dpi = 300/96 times larger
export async function downloadPng(svg: SVGSVGElement, name: string, dpi = 300) {
  const { text, width, height } = serialize(svg)
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(width * dpi / 96)
    canvas.height = Math.round(height * dpi / 96)
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"))
    if (blob) save(blob, `${name}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}
