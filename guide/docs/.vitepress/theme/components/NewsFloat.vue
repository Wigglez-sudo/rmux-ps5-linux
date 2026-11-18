<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { news } from '../news'
import { toast } from '../toast'

// Floating news card, styled like the pdfgrabber download tray. Dismissing it
// collapses it to a small pill on the home page so the news is never lost.
const KEY = 'ps5guide.news.dismissed'
const item = news[0]
const { frontmatter } = useData()
const ready = ref(false)
const dismissed = ref(false)
const isHome = computed(() => frontmatter.value.layout === 'home')

onMounted(() => {
  try { dismissed.value = localStorage.getItem(KEY) === item?.id } catch {}
  ready.value = true
})

function dismiss() {
  dismissed.value = true
  try { localStorage.setItem(KEY, item.id) } catch {}
  if (!isHome.value) toast('News hidden. It stays on the home page.', { link: withBase('/'), linkText: 'Home' })
}
function reopen() {
  dismissed.value = false
  try { localStorage.removeItem(KEY) } catch {}
}
</script>

<template>
  <template v-if="ready && item">
    <Transition name="float" mode="out-in">
      <section v-if="!dismissed" key="card" class="news" aria-label="News">
        <header class="news-head">
          <span class="label">!!!NEWS!!!</span>
          <span class="date">{{ item.date }}</span>
          <button class="close" type="button" aria-label="Dismiss news" @click="dismiss">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
          </button>
        </header>
        <p class="text">{{ item.text }}</p>
        <footer class="news-foot">
          <a class="who" :href="item.authorLink" target="_blank" rel="noopener">{{ item.author }}</a>
          <span class="actions">
            <a v-if="item.extraLink" class="btn" :href="item.extraLink" target="_blank" rel="noopener">{{ item.extraText }}</a>
            <a v-if="item.link" class="btn primary" :href="item.link" target="_blank" rel="noopener">{{ item.linkText }}</a>
          </span>
        </footer>
      </section>
      <button v-else-if="isHome" key="pill" class="pill" type="button" @click="reopen">
        News
      </button>
    </Transition>
  </template>
</template>

<style scoped>
.news {
  position: fixed; right: 20px; bottom: max(20px, env(safe-area-inset-bottom)); z-index: 40;
  width: 380px; max-width: calc(100vw - 32px);
  background: var(--raised); border: 1px solid var(--line-strong); border-radius: var(--r-float);
  box-shadow: 0 16px 48px rgba(0,0,0,0.7); color: var(--text);
}
.news-head { display: flex; align-items: center; gap: 10px; padding: 12px 10px 10px 16px; border-bottom: 1px solid var(--line); }
.label { font-weight: 650; font-size: 14px; }
.date { flex: 1; font-size: 12px; color: var(--text-3); }
.close {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--r-btn);
  color: var(--text-2); background: transparent; border: 0; cursor: pointer;
}
.close:hover { color: var(--text); background: var(--hover); }
.text { margin: 0; padding: 12px 16px; font-size: 14px; line-height: 1.5; color: var(--text-2); }
.news-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px 12px 16px; border-top: 1px solid var(--line); }
.who { font-size: 13px; font-weight: 600; color: var(--text); text-decoration: none; }
.who:hover { color: var(--accent); }
.actions { display: flex; gap: 6px; }
.btn {
  display: inline-flex; align-items: center; height: 30px; padding: 0 12px; font-size: 13px; font-weight: var(--btn-weight);
  border-radius: var(--r-btn); border: 1px solid var(--btn-border); background: var(--btn-bg); color: var(--text);
  text-decoration: none; white-space: nowrap; transition: background-color .15s, border-color .15s;
}
.btn:hover { background: var(--btn-hover); }
.btn.primary { background: var(--primary-bg); border-color: var(--primary-border); color: var(--primary-fg); }
.btn.primary:hover { background: var(--primary-hover); }
.pill {
  position: fixed; right: 20px; bottom: max(20px, env(safe-area-inset-bottom)); z-index: 40;
  display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px;
  border-radius: var(--r-float); border: 1px solid var(--line-strong); color: var(--text); font-size: 13px; font-weight: 600;
  background: var(--frost); backdrop-filter: blur(24px) saturate(160%); -webkit-backdrop-filter: blur(24px) saturate(160%);
  box-shadow: 0 12px 40px rgba(0,0,0,0.6); cursor: pointer;
}
.pill:hover { border-color: var(--accent); }
.float-enter-active, .float-leave-active { transition: opacity .2s ease, transform .2s ease; }
.float-enter-from, .float-leave-to { opacity: 0; transform: translateY(8px) scale(.98); }
@media (max-width: 640px) {
  .news { left: 16px; right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); width: auto; max-width: none; }
  .pill { right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); }
}
</style>
