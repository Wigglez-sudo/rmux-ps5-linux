import DefaultTheme from 'vitepress/theme'
import { h, onMounted } from 'vue'
import Sky from './components/Sky.vue'
import NewsFloat from './components/NewsFloat.vue'
import Appearance from './components/Appearance.vue'
import Toasts from './components/Toasts.vue'
import { loadLook } from './look'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () => h(Sky),
      'nav-bar-content-after': () => h(Appearance),
      'layout-bottom': () => [h(NewsFloat), h(Toasts)],
    })
  },
  setup() {
    onMounted(loadLook)
  },
}
