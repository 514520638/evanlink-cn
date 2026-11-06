import { useState } from 'react'
import { Image } from 'antd'

/** 浏览器缩图，服务器接收压缩后的单张图片。 */
export async function prepareImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error('请选择 20MB 以内的 JPEG、PNG 或 WebP 图片')
  }
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')!
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('图片压缩失败')), 'image/jpeg', .85))
    if (blob.size > 2 * 1024 * 1024) throw new Error('压缩后仍超过 2MB，请选择更小的图片')
    return blob
  } finally { bitmap.close() }
}

export function ChatImage({ src, alt, conversation }: { src?: string; alt?: string; conversation: string }) {
  const [failed, setFailed] = useState(false)
  const prefix = `/agent-api/conversations/${conversation}/images/`
  if (!src?.startsWith(prefix) || !/^[a-f0-9]{32}$/.test(src.slice(prefix.length))) return <span>{alt || '图片'}</span>
  if (failed) return <span>图片已过期，请重新上传。</span>
  return <Image src={src} alt={alt || '聊天图片'} width="100%" style={{ maxWidth: 360, maxHeight: 360, objectFit: 'contain', borderRadius: 12 }} onError={() => setFailed(true)} />
}

export function UserContent({ text, conversation }: { text: string; conversation: string }) {
  const match = text.match(/\n\n!\[上传的图片\]\((\/agent-api\/conversations\/[^)]+)\)$/)
  return <><span style={{ whiteSpace: 'pre-wrap' }}>{match ? text.slice(0, match.index) : text}</span>
    {match && <ChatImage src={match[1]} alt="上传的图片" conversation={conversation} />}</>
}
