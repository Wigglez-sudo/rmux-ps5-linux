<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { look, setLook, resetLook, ACCENTS, BACKGROUNDS, LOOKS, CORNERS, accentName, contrastOnBlack } from '../look'
import { toast } from '../toast'

// Appearance panel, ported from the pdfgrabber Settings page. Opens from the nav bar.
const open = ref(false)
const panel = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const lowContrast = computed(() => contrastOnBlack(look.accent) < 3)

async function toggle() {
  open.value = !open.value
  if (open.value) { await nextTick(); panel.value?.querySelector<HTMLElement>('input:checked, input, button')?.focus() }
}
function close(returnFocus = true) {
  if (!open.value) return
  open.value = false
  if (returnFocus) trigger.value?.focus()
}
function reset() { resetLook(); toast('Appearance reset to default.') }

const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
const onDown = (e: PointerEvent) => {
  const t = e.target as Node
  if (open.value && !panel.value?.contains(t) && !trigger.value?.contains(t)) close(false)
}
onMounted(() => { addEventListener('keydown', onKey); addEventListener('pointerdown', onDown) })
onBeforeUnmount(() => { removeEventListener('keydown', onKey); removeEventListener('pointerdown', onDown) })
</script>

<template>
  <div class="appearance">
    <button ref="trigger" class="trigger" type="button" :aria-expanded="open" aria-controls="look-panel" title="Appearance" @click="toggle">
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 2.5a7.5 7.5 0 1 0 0 15c.9 0 1.4-.6 1.4-1.3 0-.4-.2-.7-.4-1-.2-.2-.3-.5-.3-.9 0-.7.6-1.3 1.3-1.3h1.6a3.9 3.9 0 0 0 3.9-3.9C17.5 5.6 14.1 2.5 10 2.5Z" fill="none" stroke="currentColor" stroke-width="1.5" /><circle cx="6.2" cy="9.4" r="1.1" fill="currentColor" /><circle cx="8.6" cy="6.2" r="1.1" fill="currentColor" /><circle cx="12.4" cy="6.4" r="1.1" fill="currentColor" /></svg>
      <span class="sr">Appearance</span>
    </button>
    <Transition name="pop">
      <div v-if="open" id="look-panel" ref="panel" class="panel" role="dialog" aria-label="Appearance">
        <div class="panel-head">
          <div><h2>Appearance</h2><p class="sub">Saved in this browser only.</p></div>
          <button class="btn quiet" type="button" @click="reset">Reset</button>
        </div>

        <div class="opt">
          <span class="opt-title" id="lp-bg">Background</span>
          <fieldset class="seg" aria-labelledby="lp-bg">
            <label v-for="[id, name] in BACKGROUNDS" :key="id"><input type="radio" name="lp-bg" :value="id" :checked="look.bg === id" @change="setLook({ bg: id })"><span>{{ name }}</span></label>
          </fieldset>
        </div>
        <div class="opt">
          <span class="opt-title" id="lp-motion">Motion</span>
          <fieldset class="seg" aria-labelledby="lp-motion" :disabled="look.bg === 'off'">
            <label><input type="radio" name="lp-motion" value="moving" :checked="look.motion === 'moving'" @change="setLook({ motion: 'moving' })"><span>Moving</span></label>
            <label><input type="radio" name="lp-motion" value="still" :checked="look.motion === 'still'" @change="setLook({ motion: 'still' })"><span>Still</span></label>
          </fieldset>
        </div>
        <div class="opt">
          <label class="opt-title" for="lp-speed">Speed</label>
          <span class="range"><input id="lp-speed" type="range" min="0.25" max="3" step="0.25" :value="look.speed" :disabled="look.bg === 'off'" @input="setLook({ speed: +($event.target as HTMLInputElement).value })"><output for="lp-speed">{{ look.speed }}x</output></span>
        </div>
        <div class="opt">
          <label class="opt-title" for="lp-amount">Amount</label>
          <span class="range"><input id="lp-amount" type="range" min="0.25" max="2" step="0.25" :value="look.amount" :disabled="look.bg === 'off'" @input="setLook({ amount: +($event.target as HTMLInputElement).value })"><output for="lp-amount">{{ Math.round(look.amount * 100) }}%</output></span>
        </div>

        <div class="divider" />

        <div class="opt wide">
          <span class="opt-title" id="lp-style">Style</span>
          <div class="styles" role="radiogroup" aria-labelledby="lp-style">
            <label v-for="[id, name] in LOOKS" :key="id" class="style-tile" :data-look="id">
              <input type="radio" name="lp-look" :value="id" :checked="look.look === id" @change="setLook({ look: id })">
              <span class="style-frame" aria-hidden="true">
                <span class="mini-card">
                  <span class="mini-line" /><span class="mini-line short" />
                  <span class="mini-btns"><span class="mini-btn primary">Boot</span><span class="mini-btn">Docs</span></span>
                </span>
              </span>
              <span class="style-name">{{ name }}</span>
            </label>
          </div>
        </div>
        <div class="opt">
          <span class="opt-title" id="lp-corners">Corners</span>
          <fieldset class="seg" aria-labelledby="lp-corners">
            <label v-for="[id, name] in CORNERS" :key="id"><input type="radio" name="lp-corners" :value="id" :checked="look.corners === id" @change="setLook({ corners: id })"><span>{{ name }}</span></label>
          </fieldset>
        </div>
        <div class="opt wide">
          <span class="opt-title" id="lp-accent">Accent <span class="accent-name">{{ accentName(look.accent) }}</span></span>
          <div class="swatches" role="radiogroup" aria-labelledby="lp-accent">
            <label v-for="[name, hex] in ACCENTS" :key="hex" class="swatch" :title="name" :style="{ '--c': hex }">
              <input type="radio" name="lp-accent" :value="hex" :checked="look.accent.toLowerCase() === hex" @change="setLook({ accent: hex })"><span /><span class="sr">{{ name }}</span>
            </label>
            <label title="Custom color"><span class="sr">Custom color</span><input type="color" :value="look.accent" @input="setLook({ accent: ($event.target as HTMLInputElement).value })"></label>
          </div>
          <p v-if="lowContrast" class="warn">This color is hard to see on black ({{ contrastOnBlack(look.accent).toFixed(1) }}:1). Pick a lighter one.</p>
        </div>
        <div class="opt">
          <label class="opt-title" for="lp-opacity">Card opacity</label>
          <span class="range"><input id="lp-opacity" type="range" min="0.4" max="1" step="0.05" :value="look.opacity" @input="setLook({ opacity: +($event.target as HTMLInputElement).value })"><output for="lp-opacity">{{ Math.round(look.opacity * 100) }}%</output></span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.appearance { display: flex; align-items: center; margin-left: 8px; }
.trigger {
  display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--r-btn);
  color: var(--text-2); background: transparent; border: 1px solid transparent; cursor: pointer; transition: color .15s, background-color .15s, border-color .15s;
}
.trigger:hover, .trigger[aria-expanded="true"] { color: var(--text); background: var(--hover); border-color: var(--line-strong); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

.panel {
  position: fixed; top: calc(var(--vp-nav-height) + 8px); right: 16px; z-index: 80;
  width: 380px; max-width: calc(100vw - 32px); max-height: calc(100vh - var(--vp-nav-height) - 24px); overflow: auto;
  padding: 18px; white-space: normal; color: var(--text);
  background: var(--raised); border: 1px solid var(--line-strong); border-radius: var(--r-sheet); box-shadow: 0 24px 80px rgba(0,0,0,0.7);
}
.panel-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.panel h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; border: 0; padding: 0; line-height: 1.3; }
.sub { margin: 2px 0 0; font-size: 13px; color: var(--text-3); }
.divider { height: 1px; background: var(--line); margin: 8px 0; }

.opt { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; }
.opt.wide { display: grid; gap: 10px; }
.opt-title { font-size: 14px; font-weight: 550; }
.accent-name { margin-left: 6px; font-weight: 400; color: var(--text-3); font-size: 13px; }

.btn {
  display: inline-flex; align-items: center; height: 30px; padding: 0 10px; font-size: 13px; font-weight: 550;
  border-radius: var(--r-btn); border: 1px solid var(--btn-border); background: var(--btn-bg); cursor: pointer; color: var(--text);
}
.btn.quiet { border-color: transparent; background: transparent; color: var(--text-2); }
.btn.quiet:hover { color: var(--text); background: var(--hover); }

.seg { display: inline-flex; padding: 2px; margin: 0; border: 0; border-radius: var(--r-seg); background: rgba(255,255,255,0.07); gap: 2px; }
.seg label { position: relative; }
.seg input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.seg span { display: block; padding: 5px 10px; border-radius: var(--r-seg-in); font-size: 13px; font-weight: 550; color: var(--text-2); }
.seg input:checked + span { background: rgba(255,255,255,0.16); color: var(--text); }
.seg input:focus-visible + span { box-shadow: var(--focus); }
.seg:disabled { opacity: .45; }
.seg:disabled input { cursor: default; }

.range { display: flex; align-items: center; gap: 10px; width: 190px; }
.range input { flex: 1; min-width: 0; accent-color: var(--accent); cursor: pointer; }
.range input:disabled { opacity: .45; cursor: default; }
.range output { min-width: 40px; text-align: right; color: var(--text-2); font-size: 13px; }

.styles { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.style-tile { position: relative; display: grid; gap: 6px; cursor: pointer; }
.style-tile input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.style-frame { display: block; padding: 8px; border-radius: 10px; border: 1px solid var(--line); background: rgba(255,255,255,0.02); transition: border-color .15s; }
.style-tile:hover .style-frame { border-color: var(--line-strong); }
.style-tile input:checked ~ .style-frame { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.style-tile input:focus-visible ~ .style-frame { box-shadow: var(--focus); }
.mini-card { display: grid; gap: 6px; padding: 8px; background: var(--panel); border: 1px solid var(--panel-border); border-radius: var(--r-panel); }
.mini-line { display: block; height: 5px; width: 72%; border-radius: var(--r-bar); background: rgba(255,255,255,0.18); }
.mini-line.short { width: 44%; background: rgba(255,255,255,0.1); }
.mini-btns { display: flex; gap: 4px; }
.mini-btn { font-size: 10px; line-height: 1; padding: 4px 6px; border-radius: var(--r-btn); border: 1px solid var(--btn-border); background: var(--btn-bg); font-weight: var(--btn-weight); }
.mini-btn.primary { background: var(--primary-bg); border-color: var(--primary-border); color: var(--primary-fg); }
.style-name { font-size: 12px; font-weight: 550; text-align: center; color: var(--text-2); }
.style-tile input:checked ~ .style-name { color: var(--text); }

.swatches { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.swatch { position: relative; display: block; }
.swatch input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.swatch span:first-of-type { display: block; width: 26px; height: 26px; border-radius: 50%; background: var(--c); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2); }
.swatch input:checked + span { box-shadow: 0 0 0 2px var(--raised), 0 0 0 4px var(--c); }
.swatch input:focus-visible + span { box-shadow: var(--focus); }
input[type=color] { width: 38px; height: 28px; padding: 2px; border: 1px solid var(--line-strong); border-radius: var(--r-control); background: var(--field); cursor: pointer; }
.warn { margin: 0; font-size: 13px; color: var(--bad); }

.pop-enter-active, .pop-leave-active { transition: opacity .15s ease, transform .15s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-6px) scale(.98); }
@media (max-width: 640px) {
  .panel { left: 16px; right: 16px; width: auto; max-width: none; }
  .range { width: 160px; }
}
</style>
