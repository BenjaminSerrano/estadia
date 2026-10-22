import type { Results } from "./api-service"
import { formatCondition, STATUS_COLOR, STATUS_LABEL, type Status } from "./deg"

// Colors and names used by the figures, editable in "Figure settings" (issue #1 asked for both).
// Colors and status names are a personal preference shared by every dataset; comparison and
// control names belong to one dataset. Kept in this browser only: there are no accounts.

export interface FigureColors { up: string; down: string; ns: string; mid: string; missing: string }
type ShownStatus = "up" | "down" | "ns"

export interface FigureSettings {
  colors: FigureColors
  statusLabels: Record<ShownStatus, string>
  comparisonLabels: Record<string, string> // condition id -> name ("" = default)
  controlLabel: string
}

// What the figures draw with: every name already resolved
export interface FigureStyle {
  colors: FigureColors
  status: Record<Status, string>
  comparisons: string[] // one per comparison, in Results order
  control: string | null
}

// Defaults from the issue's R script
export const DEFAULT_COLORS: FigureColors = { ...pick(STATUS_COLOR), mid: "#FFFFFF", missing: "#D5D5D5" }
export const DEFAULT_STATUS_LABELS: Record<ShownStatus, string> = pick(STATUS_LABEL)
export const DEFAULT_SETTINGS: FigureSettings = {
  colors: DEFAULT_COLORS, statusLabels: DEFAULT_STATUS_LABELS, comparisonLabels: {}, controlLabel: "",
}

function pick<T>(r: Record<Status, T>): Record<ShownStatus, T> {
  return { up: r.up, down: r.down, ns: r.ns }
}

export function resolveStyle(r: Results, s: FigureSettings): FigureStyle {
  const name = (custom: string | undefined, label: string) => custom?.trim() || formatCondition(label)
  return {
    colors: s.colors,
    status: { ...STATUS_LABEL, ...Object.fromEntries(Object.entries(s.statusLabels).map(([k, v]) => [k, v.trim() || STATUS_LABEL[k as Status]])) },
    comparisons: r.comparisons.map(c => name(s.comparisonLabels[c.id], c.label)),
    control: r.control == null ? null : name(s.controlLabel, r.control),
  }
}

const SHARED_KEY = "dpdds_figure_style"
const labelsKey = (datasetId: number) => `dpdds_figure_labels_${datasetId}`
const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)
const isText = (v: unknown): v is string => typeof v === "string"

// Storage can be empty, blocked or hold anything: keep only well-formed values
export function loadSettings(datasetId: number): FigureSettings {
  let shared: any = {}, own: any = {}
  try { shared = JSON.parse(localStorage.getItem(SHARED_KEY) || "{}") ?? {} } catch { /* defaults */ }
  try { own = JSON.parse(localStorage.getItem(labelsKey(datasetId)) || "{}") ?? {} } catch { /* defaults */ }
  const keep = <T extends object>(defaults: T, stored: any, ok: (v: unknown) => boolean) =>
    Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, ok(stored?.[k]) ? stored[k] : v])) as T
  return {
    colors: keep(DEFAULT_COLORS, shared.colors, isHex),
    statusLabels: keep(DEFAULT_STATUS_LABELS, shared.statusLabels, isText),
    comparisonLabels: Object.fromEntries(Object.entries(own.comparisonLabels ?? {}).filter(([, v]) => isText(v))) as Record<string, string>,
    controlLabel: isText(own.controlLabel) ? own.controlLabel : "",
  }
}

export function saveSettings(datasetId: number, s: FigureSettings) {
  try {
    localStorage.setItem(SHARED_KEY, JSON.stringify({ colors: s.colors, statusLabels: s.statusLabels }))
    localStorage.setItem(labelsKey(datasetId), JSON.stringify({ comparisonLabels: s.comparisonLabels, controlLabel: s.controlLabel }))
  } catch { /* storage unavailable: the settings still apply until the page is closed */ }
}
