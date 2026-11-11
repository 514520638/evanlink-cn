import { useEffect, useRef, useState } from 'react'
import { Button, Image, Spin, Typography } from 'antd'
import type { ImageProps } from 'antd'
import styles from './AlbumImage.module.css'
import { ReloadOutlined } from '@ant-design/icons'
import { acquireImage } from '../../utils/imageRequests'

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
/** HEIC/HEIF 按需读取、客户端转换；常规图片保持原来的显示和大图预览。 */
export function AlbumImage({ contentType, fit = 'cover', eager: forceEager = false, compact = false, ...props }: ImageProps & { contentType?: string; fit?: 'cover' | 'contain'; eager?: boolean; compact?: boolean }) {
  const heif = /^image\/(heic|heif)(-sequence)?$/i.test(contentType || '') || /\.(heic|heif)(?:[?#]|$)/i.test(props.src || '')
  const eager = forceEager || (typeof props.preview === 'object' && props.preview.visible === true)
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { setError('') }, [props.src, attempt])
  useEffect(() => {
    if (!host.current) return
    if (eager) { setActive(true); return }
    if (!('IntersectionObserver' in window)) { setActive(true); return }
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setActive(true); observer.disconnect() } }, { rootMargin: '200px' })
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [eager, props.src])
  useEffect(() => {
    const clear = () => setAttempt(value => value + 1)
    window.addEventListener('image-cache-cleared', clear)
    return () => window.removeEventListener('image-cache-cleared', clear)
  }, [])
  useEffect(() => {
    if (!active || !props.src) return
    const abort = new AbortController(); let objectUrl = ''; let disposed = false
    setUrl(''); setError('')
    const lease = acquireImage(props.src)
    lease.promise.then(async result => {
      if (disposed) return
      let value = result
      if (value instanceof Blob && (/^image\/(heic|heif)/.test(value.type) || (heif && !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(value.type)))) {
        const blob = value
        const task = queue.catch(() => undefined).then(() => decodeInWorker(blob, abort.signal))
        queue = task; value = await task
      }
      if (disposed) return
      if (value instanceof Blob) { objectUrl = URL.createObjectURL(value); setUrl(objectUrl) } else setUrl(value)
    }).catch(e => { if (!disposed) setError(e instanceof Error ? e.message : '照片加载失败') })
    return () => { disposed = true; abort.abort(); lease.release(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [heif, active, props.src, attempt])
  const ready = Boolean(url)
  const state = <div className={styles.state} role="status" aria-live="polite">
    {error ? <>{!compact && <Typography.Text>{error}</Typography.Text>}<Button size="small" type={compact ? 'text' : 'default'} icon={compact ? <ReloadOutlined /> : undefined} title={error} aria-label="重新加载图片" onClick={event => { event.stopPropagation(); setAttempt(value => value + 1) }}>{compact ? null : '重新加载'}</Button></> : <><Spin size="small" />{!compact && <Typography.Text>正在准备照片…</Typography.Text>}</>}
  </div>
  return <div ref={host} className={`album-image-frame ${styles.frame} ${fit === 'contain' ? styles.contain : ''} ${compact ? styles.compact : ''}`}
    tabIndex={props.preview !== false && ready && !error ? 0 : undefined}
    role={props.preview !== false && ready && !error ? 'button' : undefined}
    aria-label={props.preview !== false ? `查看大图：${props.alt || '相册照片'}` : undefined}
    onKeyDown={event => {
      if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ') && props.preview !== false) {
        event.preventDefault(); host.current?.querySelector<HTMLImageElement>('.ant-image-img')?.click()
      }
    }}>
    {!ready || error ? state : <Image {...props} key={attempt} src={url} placeholder={state}
      onError={event => { props.onError?.(event); setError('照片暂时无法加载，请重试') }} />}
  </div>
}
