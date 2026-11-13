import { useEffect, useState } from 'react'
import { AUTH_EVENT, verifyAdminSession } from '../utils/adminAuth'
export function useBlogAuth() {
  const [owner, setOwner] = useState(false)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    let alive = true
    const refresh = () => { void verifyAdminSession().then(value => { if (alive) setOwner(value) }).catch(() => { if (alive) setOwner(false) }).finally(() => { if (alive) setChecking(false) }) }
    const storage = (event: StorageEvent) => { if (event.key === 'auth_change') refresh() }
    refresh(); const timer = setInterval(refresh, 60000)
    window.addEventListener(AUTH_EVENT, refresh); window.addEventListener('focus', refresh); window.addEventListener('storage', storage)
    return () => { alive = false; clearInterval(timer); window.removeEventListener(AUTH_EVENT, refresh); window.removeEventListener('focus', refresh); window.removeEventListener('storage', storage) }
  }, [])
  return { owner, checking }
}
