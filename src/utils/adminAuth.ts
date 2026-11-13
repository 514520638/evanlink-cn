import { clearImageCache } from './imageRequests'
import { API_ENDPOINTS } from '../config/api'

export const AUTH_EVENT = 'blog-auth-changed'
export function announceAuthChange() {
  clearImageCache()
  window.localStorage.removeItem('admin_token')
  window.localStorage.setItem('auth_change', `${Date.now()}-${Math.random()}`)
  window.dispatchEvent(new Event(AUTH_EVENT))
}
export const fetchWithAdminCookie = (url: string, options?: RequestInit) => fetch(url, { ...options, credentials: 'include' })
export const loginAdmin = async (payload: { username: string; password: string }) => {
  const response = await fetchWithAdminCookie(API_ENDPOINTS.ADMIN_LOGIN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || '登录失败')
  announceAuthChange()
  return data
}
export const logoutAdmin = async () => {
  // 两端同时退出；Java 是认证权威，即使 Agent 暂不可达也必须撤销博客登录。
  const [blog] = await Promise.allSettled([
    fetchWithAdminCookie(API_ENDPOINTS.ADMIN_LOGOUT, { method: 'POST' }),
    fetchWithAdminCookie('/agent-api/auth/logout', { method: 'POST', headers: { 'X-Agent-Request': '1' } }),
  ])
  if (blog.status === 'rejected' || !blog.value.ok) throw new Error('退出失败，请重试')
  announceAuthChange()
}
let checking: Promise<boolean> | null = null
export const verifyAdminSession = async (): Promise<boolean> => {
  if (!checking) checking = fetchWithAdminCookie('/api/admin/session', { cache: 'no-store' }).then(response => {
    if (response.status === 401) return false
    if (!response.ok) throw new Error('登录状态暂时无法确认')
    return true
  }).finally(() => { checking = null })
  return checking
}
