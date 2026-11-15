import { useSyncExternalStore } from 'react'
import type { SetStateAction } from 'react'
import type { ThemeMode } from '../types'

// Header、ConfigProvider 和路由组件共享唯一状态，避免 CSS 与组件库主题分离。
const listeners = new Set<() => void>()
const media = window.matchMedia('(prefers-color-scheme: dark)')
let manual = false
function readTheme(): ThemeMode {
  let saved: string | null = null
  try { saved = localStorage.getItem('theme') } catch { /* 禁用存储时仍可切换。 */ }
  manual = saved === 'light' || saved === 'dark'
  return manual ? saved as ThemeMode : media.matches ? 'dark' : 'light'
}
let current = readTheme()
function apply() {
  document.documentElement.dataset.theme = current
  document.documentElement.style.colorScheme = current
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current === 'dark' ? '#141414' : '#ffffff')
}
function publish(next: ThemeMode) {
  current = next; apply(); listeners.forEach(listener => listener())
}
function setTheme(value: SetStateAction<ThemeMode>) {
  const next = typeof value === 'function' ? value(current) : value
  if (next !== 'light' && next !== 'dark') return
  manual = true
  try { localStorage.setItem('theme', next) } catch { /* 当前页面保留内存状态。 */ }
  publish(next)
}
const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark')
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
const onStorage = (event: StorageEvent) => { if (event.key === 'theme' || event.key === null) publish(readTheme()) }
const onSystem = () => { if (!manual) publish(media.matches ? 'dark' : 'light') }
const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) publish(readTheme()); else apply() }
apply()
window.addEventListener('storage', onStorage)
window.addEventListener('pageshow', onPageShow)
media.addEventListener('change', onSystem)
if (import.meta.hot) import.meta.hot.dispose(() => {
  window.removeEventListener('storage', onStorage); window.removeEventListener('pageshow', onPageShow); media.removeEventListener('change', onSystem)
})
export const useTheme = () => ({ theme: useSyncExternalStore(subscribe, () => current, () => 'light' as ThemeMode), setTheme, toggleTheme })
