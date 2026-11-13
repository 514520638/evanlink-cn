import { useEffect, useRef, useState } from 'react'
import { Button, message } from 'antd'
import { HeartFilled, HeartOutlined } from '@ant-design/icons'
interface Like { count: number; liked: boolean }
let visitorReady: Promise<void> | null = null
async function read(id: number): Promise<Like> {
  const response = await fetch(`/api/album/photos/${id}/like`, { credentials: 'include', cache: 'no-store' })
  if (!response.ok) throw new Error('点赞状态暂不可用')
  return response.json()
}
function likeState(id: number) {
  if (!visitorReady) {
    const first = read(id); visitorReady = first.then(() => undefined).catch(() => { visitorReady = null }); return first
  }
  return visitorReady.then(() => read(id))
}
export function AlbumLike({ photoId }: { photoId: number }) {
  const [state, setState] = useState<Like>({ count: 0, liked: false })
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const locked = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    let cancelled = false; let started = false
    const load = () => { if (started) return; started = true; void likeState(photoId).then(value => { if (!cancelled) { setState(value); setReady(true) } }).catch(() => { if (!cancelled) setReady(false) }) }
    if (!('IntersectionObserver' in window)) { load(); return () => { cancelled = true; clearTimeout(timer.current) } }
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { load(); observer.disconnect() } }, { rootMargin: '100px' })
    if (ref.current) observer.observe(ref.current)
    return () => { cancelled = true; observer.disconnect(); clearTimeout(timer.current) }
  }, [photoId])
  const like = () => {
    if (locked.current || state.liked || !ready) return
    locked.current = true; setBusy(true)
    timer.current = setTimeout(() => {
      fetch(`/api/album/photos/${photoId}/like`, { method: 'POST', credentials: 'include', headers: { 'X-Album-Request': '1' } })
        .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.message || '点赞失败'); setState(data) })
        .catch(e => message.warning(e instanceof Error ? e.message : '点赞失败'))
        .finally(() => { locked.current = false; setBusy(false) })
    }, 350)
  }
  return <span ref={ref}><Button type="text" size="small" aria-label={state.liked ? '已点赞' : '点赞照片'} aria-pressed={state.liked} disabled={!ready || state.liked} loading={busy} icon={state.liked ? <HeartFilled /> : <HeartOutlined />} style={{ color: state.liked ? '#1677ff' : undefined }} onClick={like}>{state.count}</Button></span>
}
