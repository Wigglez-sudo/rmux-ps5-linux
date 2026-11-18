<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { look, hexRGB } from '../look'

// Background, ported from pdfgrabber. Near particles move faster, which gives the field depth.
const canvas = ref<HTMLCanvasElement>()

type P = Record<string, any>
let ctx: CanvasRenderingContext2D, w = 0, h = 0, parts: P[] = [], raf = 0, last = 0
let kind = '', moving = true, accent = '205,184,255', speed = 1, amount = 1

const KINDS: Record<string, { slant: number, density: number, max: number, make(initial: boolean): P, draw(p: P): void }> = {
  stars: {
    slant: 0.24, density: 6500, max: 340,
    make(initial) {
      const z = Math.random() ** 1.8
      return { x: Math.random() * (w + h * 0.24), y: initial ? Math.random() * h : -Math.random() * 60, r: 0.35 + z * 1.2, v: 10 + z * 64, a: 0.2 + z * 0.65, tw: Math.random() * 6.283, tint: Math.random() < 0.07 }
    },
    draw(p) {
      const alpha = p.a * (0.82 + 0.18 * Math.sin(p.tw))
      const rgb = p.tint ? accent : '238,242,255'
      const len = moving ? p.v * 0.18 * Math.min(2, Math.sqrt(speed)) : 0
      if (len > 3) {
        ctx.strokeStyle = `rgba(${rgb},${alpha * 0.3})`
        ctx.lineWidth = p.r * 1.1
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + len * 0.24, p.y - len); ctx.stroke()
      }
      ctx.fillStyle = `rgba(${rgb},${alpha})`
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill()
    },
  },
  rain: {
    slant: 0.1, density: 4200, max: 460,
    make(initial) {
      const z = Math.random() ** 1.5
      return { x: Math.random() * (w + h * 0.1), y: initial ? Math.random() * h : -Math.random() * h * 0.4, r: 0.6 + z * 0.9, v: 380 + z * 720, a: 0.07 + z * 0.3, len: 10 + z * 28, tint: Math.random() < 0.04 }
    },
    draw(p) {
      ctx.strokeStyle = `rgba(${p.tint ? accent : '200,214,235'},${p.a})`
      ctx.lineWidth = p.r
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.len * 0.1, p.y - p.len); ctx.stroke()
    },
  },
  snow: {
    slant: 0, density: 7000, max: 300,
    make(initial) {
      const z = Math.random() ** 1.6
      return { x: Math.random() * w, y: initial ? Math.random() * h : -8 - Math.random() * 40, r: 0.8 + z * 2.4, v: 12 + z * 40, a: 0.25 + z * 0.6, ph: Math.random() * 6.283, sway: 6 + z * 20, tint: Math.random() < 0.05 }
    },
    draw(p) {
      ctx.fillStyle = `rgba(${p.tint ? accent : '245,247,255'},${p.a})`
      ctx.beginPath(); ctx.arc(p.x + Math.sin(p.ph) * p.sway, p.y, p.r, 0, 6.283); ctx.fill()
    },
  },
}

function seed() {
  const k = KINDS[kind]
  parts = k ? Array.from({ length: Math.round(Math.min(k.max, w * h / k.density) * amount) }, () => k.make(true)) : []
}
function resize() {
  const c = canvas.value!, dpr = Math.min(2, devicePixelRatio || 1)
  w = innerWidth; h = innerHeight
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  seed()
}
function draw(dt: number) {
  ctx.clearRect(0, 0, w, h)
  const k = KINDS[kind]
  if (!k) return
  ctx.lineCap = 'round'
  for (const p of parts) {
    if (dt) {
      p.y += p.v * dt; p.x -= p.v * k.slant * dt
      if (p.tw !== undefined) p.tw += dt * 1.4
      if (p.ph !== undefined) p.ph += dt * 0.9
      if (p.y > h + 40 || p.x < -40) Object.assign(p, k.make(false))
    }
    k.draw(p)
  }
}
function frame(t: number) {
  const dt = last ? Math.min(0.05, (t - last) / 1000) * speed : 0
  last = t; draw(dt); raf = requestAnimationFrame(frame)
}
function stop() { cancelAnimationFrame(raf); raf = 0; last = 0 }
function start() {
  stop()
  if (!KINDS[kind]) { ctx.clearRect(0, 0, w, h); return }
  if (moving && !document.hidden) raf = requestAnimationFrame(frame)
  else draw(0)
}
function sync() {
  const reseed = look.bg !== kind || look.amount !== amount
  kind = look.bg; moving = look.motion === 'moving'; accent = hexRGB(look.accent).join(','); speed = look.speed; amount = look.amount
  if (reseed) seed()
  start()
}

let resizeTimer: ReturnType<typeof setTimeout>
const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { resize(); start() }, 150) }

onMounted(() => {
  ctx = canvas.value!.getContext('2d')!
  resize()
  sync()
  addEventListener('resize', onResize)
  document.addEventListener('visibilitychange', start)
})
onBeforeUnmount(() => {
  stop()
  removeEventListener('resize', onResize)
  document.removeEventListener('visibilitychange', start)
})
watch(look, sync)
</script>

<template>
  <canvas ref="canvas" class="sky" aria-hidden="true" />
</template>

<style scoped>
.sky { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
</style>
