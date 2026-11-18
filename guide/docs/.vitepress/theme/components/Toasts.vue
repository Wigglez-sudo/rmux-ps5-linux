<script setup lang="ts">
import { toasts, dismissToast } from '../toast'
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="{ bad: t.bad }">
        <span>{{ t.message }}</span>
        <a v-if="t.link" :href="t.link" @click="dismissToast(t.id)">{{ t.linkText }}</a>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts { position: fixed; top: calc(var(--vp-nav-height) + 12px); right: 16px; z-index: 90; display: grid; gap: 8px; width: min(360px, calc(100vw - 32px)); pointer-events: none; }
.toast {
  pointer-events: auto; background: var(--raised); border: 1px solid var(--line-strong); border-radius: var(--r-panel);
  padding: 12px 14px; box-shadow: 0 12px 32px rgba(0,0,0,0.6); display: flex; gap: 12px; align-items: baseline; justify-content: space-between;
  font-size: 14px; color: var(--text);
}
.toast.bad { border-color: rgba(255,105,97,0.5); }
.toast a { color: var(--accent); font-weight: 550; white-space: nowrap; text-decoration: none; }
.toast a:hover { text-decoration: underline; }
.toast-enter-active { transition: opacity .18s ease-out, transform .18s ease-out; }
.toast-leave-active { transition: opacity .15s; }
.toast-enter-from { opacity: 0; transform: translateY(-6px); }
.toast-leave-to { opacity: 0; }
</style>
