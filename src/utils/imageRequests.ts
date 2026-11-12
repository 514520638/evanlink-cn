// 普通网络共享三个网络槽，省流量或慢速网络使用两个；同一地址合并请求，短时缓存限制在 24MB。
type ImageValue = Blob | string
const pending = new Map<string, { controller: AbortController; promise: Promise<ImageValue>; users: number }>()
const cache = new Map<string, { value: ImageValue; bytes: number; expires: number }>()
let cacheBytes = 0
let active = 0
const jobs: (() => void)[] = []
function pump() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  const limit = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '') ? 2 : 3
  while (active < limit && jobs.length) jobs.shift()!() }
function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => { jobs.push(() => { active++; task().then(resolve, reject).finally(() => { active--; pump() }) }); pump() })
}
function check(signal: AbortSignal) { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError') }
function delay(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    check(signal)
    const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}
function nativeImage(src: string, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    check(signal); const image = new Image()
    const finish = (error?: Error) => { clearTimeout(timer); signal.removeEventListener('abort', abort); image.onload = null; image.onerror = null; if (error) { image.src = ''; reject(error) } else resolve(src) }
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'))
    const timer = setTimeout(() => finish(new Error('图片加载超时')), 30000)
    signal.addEventListener('abort', abort, { once: true }); image.onload = () => finish(); image.onerror = () => finish(new Error('图片暂时无法加载')); image.src = src
  })
}
async function download(src: string, signal: AbortSignal): Promise<ImageValue> {
  const external = new URL(src, location.href).origin !== location.origin
  let useNative = false
  for (let attempt = 0; attempt < 4; attempt++) {
    check(signal)
    const controller = new AbortController()
    const abort = () => controller.abort()
    signal.addEventListener('abort', abort, { once: true })
    const timer = setTimeout(abort, 45000)
    let backoff = Math.min(800 * 2 ** attempt, 8000) + Math.random() * 250
    try {
      if (useNative) return await nativeImage(src, signal)
      let response: Response
      try { response = await fetch(src, { signal: controller.signal, credentials: external ? 'omit' : 'same-origin' }) }
      catch (e) { if (external && !signal.aborted) { useNative = true; return await nativeImage(src, signal) } throw e }
      if (response.ok) {
        if (Number(response.headers.get('Content-Length')) > 20 * 1024 * 1024) throw new Error('图片超过 20MB')
        const blob = await response.blob()
        if (blob.size > 20 * 1024 * 1024) throw new Error('图片超过 20MB')
        return blob
      }
      if (![429, 502, 503, 504].includes(response.status)) {
        const data = await response.json().catch(() => ({}))
        throw Object.assign(new Error(data.message || '图片不存在或没有访问权限'), { permanent: true })
      }
      const retry = response.headers.get('Retry-After')
      if (retry) { const ms = /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now(); if (Number.isFinite(ms)) backoff = Math.max(backoff, Math.min(Math.max(ms, 0), 15000)) }
      await response.body?.cancel()
      if (attempt === 3) throw new Error('图片服务繁忙，请稍后重试')
    } catch (e) {
      check(signal)
      if (attempt === 3 || (e as { permanent?: boolean }).permanent) throw e
    } finally { clearTimeout(timer); signal.removeEventListener('abort', abort) }
    await delay(backoff, signal)
  }
  throw new Error('图片加载失败')
}
export function clearImageCache() {
  cache.clear(); cacheBytes = 0
  for (const entry of pending.values()) entry.controller.abort()
  pending.clear()
  window.dispatchEvent(new Event('image-cache-cleared'))
}
export function acquireImage(src: string) {
  const key = new URL(src, location.href).href
  const saved = cache.get(key)
  if (saved && saved.expires > Date.now()) { cache.delete(key); cache.set(key, saved); return { promise: Promise.resolve(saved.value), release() {} } }
  if (saved) { cacheBytes -= saved.bytes; cache.delete(key) }
  let entry = pending.get(key)
  if (!entry) {
    const controller = new AbortController()
    const created = { controller, users: 0, promise: Promise.resolve<ImageValue>('') }
    created.promise = schedule(() => download(key, controller.signal)).then(value => {
      check(controller.signal)
      const bytes = value instanceof Blob ? value.size : 0
      cache.set(key, { value, bytes, expires: Date.now() + 45000 }); cacheBytes += bytes
      while (cacheBytes > 24 * 1024 * 1024 || cache.size > 32) { const oldest = cache.keys().next().value as string; cacheBytes -= cache.get(oldest)!.bytes; cache.delete(oldest) }
      return value
    }).finally(() => { if (pending.get(key) === created) pending.delete(key) })
    entry = created; pending.set(key, entry)
  }
  entry.users++
  let released = false
  return { promise: entry.promise, release() { if (!released) { released = true; entry!.users--; if (!entry!.users && pending.get(key) === entry) { entry!.controller.abort(); pending.delete(key) } } } }
}
