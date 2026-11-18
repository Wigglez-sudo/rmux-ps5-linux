import { reactive } from 'vue'

// Appearance settings, ported from the pdfgrabber web UI. Saved in this browser only.

export const ACCENTS = [
  ['Lilac', '#cdb8ff'],
  ['Starlight', '#f5d08a'],
  ['Ice', '#a7d3ff'],
  ['Mint', '#8fe3c5'],
  ['Rose', '#ffa3b5'],
  ['Paper', '#f5f5f7'],
] as const
export const BACKGROUNDS = [['stars', 'Stars'], ['rain', 'Rain'], ['snow', 'Snow'], ['off', 'Off']] as const
export const LOOKS = [['filled', 'Filled'], ['outline', 'Outline'], ['flat', 'Flat']] as const
export const CORNERS = [['soft', 'Soft'], ['sharp', 'Sharp'], ['round', 'Round']] as const

export type Look = {
  bg: string
  motion: string
  speed: number
  amount: number
  accent: string
  look: string
  corners: string
  opacity: number
}

const KEY = 'ps5guide.look'
const DEFAULTS: Look = {
  bg: 'stars', motion: 'moving', speed: 1, amount: 1,
  accent: ACCENTS[0][1], look: 'outline', corners: 'soft', opacity: 0.84,
}

export const look = reactive<Look>({ ...DEFAULTS })

function read(): Partial<Look> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}
function write() {
  try { localStorage.setItem(KEY, JSON.stringify(look)) } catch {}
}

export function hexRGB(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16 & 255, n >> 8 & 255, n & 255]
}
function luminance(rgb: number[]) {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export function contrastOnBlack(hex: string) { return (luminance(hexRGB(hex)) + 0.05) / 0.05 }
export function accentName(hex: string) { return ACCENTS.find(a => a[1] === hex.toLowerCase())?.[0] || 'Custom' }

export function applyLook() {
  const root = document.documentElement
  root.style.setProperty('--accent', look.accent)
  root.style.setProperty('--accent-ink', luminance(hexRGB(look.accent)) > 0.35 ? '#15120b' : '#ffffff')
  root.style.setProperty('--card-alpha', String(look.opacity))
  root.dataset.look = look.look
  root.dataset.corners = look.corners
}

export function loadLook() {
  const saved = read()
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const pick = (v: any, list: readonly (readonly string[])[], fb: string) => list.some(o => o[0] === v) ? v : fb
  const num = (v: any, min: number, max: number, fb: number) => typeof v === 'number' && v >= min && v <= max ? v : fb
  Object.assign(look, {
    bg: pick(saved.bg, BACKGROUNDS, DEFAULTS.bg),
    motion: saved.motion === 'still' || saved.motion === 'moving' ? saved.motion : reduce ? 'still' : 'moving',
    speed: num(saved.speed, 0.25, 3, 1),
    amount: num(saved.amount, 0.25, 2, 1),
    accent: /^#[0-9a-f]{6}$/i.test(saved.accent || '') ? saved.accent : DEFAULTS.accent,
    look: pick(saved.look, LOOKS, DEFAULTS.look),
    corners: pick(saved.corners, CORNERS, DEFAULTS.corners),
    opacity: num(saved.opacity, 0.4, 1, DEFAULTS.opacity),
  })
  applyLook()
}

export function setLook(change: Partial<Look>) {
  Object.assign(look, change)
  write()
  applyLook()
}

export function resetLook() {
  try { localStorage.removeItem(KEY) } catch {}
  loadLook()
}

// Runs in <head> before the page paints, so a saved look never flashes the default
export const EARLY_SCRIPT = `try{var l=JSON.parse(localStorage.getItem('${KEY}')||'{}'),r=document.documentElement;r.dataset.look=l.look||'outline';r.dataset.corners=l.corners||'soft';if(/^#[0-9a-f]{6}$/i.test(l.accent||''))r.style.setProperty('--accent',l.accent);if(l.opacity)r.style.setProperty('--card-alpha',l.opacity)}catch(e){}`
