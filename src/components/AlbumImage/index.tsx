import { useEffect, useRef, useState } from 'react'
import { Button, Image, Spin, Typography } from 'antd'
import type { ImageProps } from 'antd'
import styles from './AlbumImage.module.css'

let queue: Promise<unknown> = Promise.resolve()
function decodeInWorker(blob: Blob, signal: AbortSignal): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return }
    const worker = new Worker(new URL('./heic.worker.ts', import.meta.url), { type: 'module' })
    const finish = (error?: Error, result?: Blob) => {
      clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate()
      if (error) reject(error); else if (result) resolve(result)
    }
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'))
    const timer = window.setTimeout(() => finish(new Error('照片解析超时，请稍后重试')), 60000)
    signal.addEventListener('abort', abort, { once: true })
    worker.onmessage = event => event.data.jpeg instanceof Blob ? finish(undefined, event.data.jpeg) : finish(new Error(event.data.error || '照片解析失败'))
    worker.onerror = () => finish(new Error('照片解析失败，请重试或转换为 JPG'))
    worker.postMessage(blob)
  })
}
async function fetchPreview(src: string, signal: AbortSignal): Promise<Blob> {
  const response = await fetch(src, { credentials: 'same-origin', signal, cache: 'no-store' })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || '网盘照片加载失败，请稍后重试')
  }
  const blob = await response.blob()
  if (blob.size > 20 * 1024 * 1024) throw new Error('照片超过 20MB，无法预览')
  // 百度可能已经提供 JPEG 预览，不需要再下载解码器。
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(blob.type)) return blob
  return decodeInWorker(blob, signal)
}

/** HEIC/HEIF 按需读取、客户端转换；常规图片保持原来的显示和大图预览。 */
export function AlbumImage({ contentType, fit = 'cover', eager: forceEager = false, ...props }: ImageProps & { contentType?: string; fit?: 'cover' | 'contain'; eager?: boolean }) {
  const heif = /^image\/(heic|heif)(-sequence)?$/i.test(contentType || '') || /\.(heic|heif)(?:[?#]|$)/i.test(props.src || '')
  const eager = forceEager || (typeof props.preview === 'object' && props.preview.visible === true)
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { setError('') }, [props.src, attempt])
  useEffect(() => {
    if (!heif || !host.current) return
    if (eager) { setActive(true); return }
    if (!('IntersectionObserver' in window)) { setActive(true); return }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setActive(true); observer.disconnect() } }, { rootMargin: '200px' })
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [heif, eager])
  useEffect(() => {
    if (!heif || !active || !props.src) return
    const abort = new AbortController(); let objectUrl = ''; let disposed = false
    setUrl(''); setError('')
    // 同一页面一次只下载/转换一张 HEIC，避免大量照片同时占用客户端与服务器资源。
    const task = queue.catch(() => undefined).then(async () => {
      if (abort.signal.aborted) return
      try {
        const blob = await fetchPreview(props.src!, abort.signal)
        if (disposed) return
        objectUrl = URL.createObjectURL(blob); setUrl(objectUrl)
      } catch (e) { if (!disposed) setError(e instanceof Error ? e.message : '照片解析失败') }
    })
    queue = task
    return () => { disposed = true; abort.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [heif, active, props.src, attempt])
  const ready = !heif || Boolean(url)
  const state = <div className={styles.state} role="status" aria-live="polite">
    {error ? <><Typography.Text>{error}</Typography.Text><Button size="small" onClick={() => setAttempt(value => value + 1)}>重新加载</Button></> : <><Spin size="small" /><Typography.Text>{heif ? '正在准备照片…' : '正在加载照片…'}</Typography.Text></>}
  </div>
  return <div ref={host} className={`album-image-frame ${styles.frame} ${fit === 'contain' ? styles.contain : ''}`}
    tabIndex={props.preview !== false && ready && !error ? 0 : undefined}
    role={props.preview !== false && ready && !error ? 'button' : undefined}
    aria-label={props.preview !== false ? `查看大图：${props.alt || '相册照片'}` : undefined}
    onKeyDown={event => {
      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ') && props.preview !== false) {
        event.preventDefault(); host.current?.querySelector<HTMLImageElement>('.ant-image-img')?.click()
      }
    }}>
    {!ready || error ? state : <Image {...props} key={attempt} src={heif ? url : props.src} placeholder={state}
      onError={event => { props.onError?.(event); setError('照片暂时无法加载，请重试') }} />}
  </div>
}
