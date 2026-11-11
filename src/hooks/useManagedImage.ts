import { useEffect, useState } from 'react'
import { acquireImage } from '../utils/imageRequests'

// 头像/二维码也走共享队列，隐藏的弹窗不提前请求图片。
export function useManagedImage(src?: string | null, enabled = true) {
  const [value, setValue] = useState<string>()
  const [version, setVersion] = useState(0)
  useEffect(() => { const clear = () => setVersion(n => n + 1); window.addEventListener('image-cache-cleared', clear); return () => window.removeEventListener('image-cache-cleared', clear) }, [])
  useEffect(() => {
    setValue(undefined)
    if (!src || !enabled) return
    if (/^(data:|blob:)/.test(src)) { setValue(src); return }
    const lease = acquireImage(src); let disposed = false; let objectUrl = ''
    lease.promise.then(result => { if (!disposed) { if (result instanceof Blob) { objectUrl = URL.createObjectURL(result); setValue(objectUrl) } else setValue(result) } }).catch(() => { /* 保留头像默认占位，不产生未处理 Promise。 */ })
    return () => { disposed = true; lease.release(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [src, enabled, version])
  return value
}
