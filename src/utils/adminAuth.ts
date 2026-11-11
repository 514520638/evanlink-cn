import { API_ENDPOINTS } from '../config/api'

export const fetchWithAdminCookie = (url: string, options?: RequestInit) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
  })
}

export const loginAdmin = async (payload: { username: string; password: string }) => {
  const response = await fetchWithAdminCookie(API_ENDPOINTS.ADMIN_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let data: { message?: string; success?: boolean } = {}
  try {
    data = await response.json()
  } catch {
    // Keep the status-based fallback below.
  }

  if (!response.ok) {
    throw new Error(data.message || '登录失败')
  }

  window.localStorage.removeItem('admin_token')
  return data
}

export const logoutAdmin = async () => {
  await fetchWithAdminCookie(API_ENDPOINTS.ADMIN_LOGOUT, {
    method: 'POST',
  })
  window.localStorage.removeItem('admin_token')
}

export const verifyAdminSession = async () => {
  const response = await fetchWithAdminCookie(API_ENDPOINTS.ADMIN_PROFILE)
  if (response.status === 401) {
    window.localStorage.removeItem('admin_token')
    return false
  }
  return response.ok
}
