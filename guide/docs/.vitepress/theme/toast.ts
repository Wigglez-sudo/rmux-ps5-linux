import { reactive } from 'vue'

export type Toast = { id: number, message: string, bad?: boolean, link?: string, linkText?: string }

export const toasts = reactive<Toast[]>([])
let next = 0

export function toast(message: string, opts: Omit<Toast, 'id' | 'message'> = {}) {
  const id = ++next
  toasts.push({ id, message, ...opts })
  setTimeout(() => dismissToast(id), opts.bad ? 7000 : 4000)
}

export function dismissToast(id: number) {
  const i = toasts.findIndex(t => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}
