import { API_ENDPOINTS } from '../config/api'
import type { AlbumPhoto } from '../types'
import { loginAdmin, verifyAdminSession } from '../utils/adminAuth'

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const body = await response.json()
    return body.message || fallback
  } catch {
    return fallback
  }
}

export const fetchAlbumPhotos = async () => {
  const response = await fetch(API_ENDPOINTS.ALBUM_PHOTOS)
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '加载相册失败'))
  }
  return response.json() as Promise<AlbumPhoto[]>
}

export const uploadAlbumPhoto = async (payload: {
  files: Blob[]
  title?: string
  description?: string
}) => {
  const uploaded: AlbumPhoto[] = []
  // 逐张发送原始二进制，后端无需 multipart 临时文件，也不会并行占用大量内存。
  for (const file of payload.files) {
    if (file.size > 20 * 1024 * 1024) throw new Error('单张照片最多 20MB')
    const params = new URLSearchParams({ name: file instanceof File ? file.name : 'photo.jpg' })
    if (payload.title) params.set('title', payload.title)
    if (payload.description) params.set('description', payload.description)
    const response = await fetch(`${API_ENDPOINTS.ALBUM_PHOTOS}?${params}`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Netdisk-Request': '1' }, body: file,
    })
    if (!response.ok) throw new Error(`已成功上传 ${uploaded.length} 张；${await readErrorMessage(response, '网盘上传失败')}`)
    uploaded.push(await response.json() as AlbumPhoto)
  }
  return uploaded
}

export const deleteAlbumPhoto = async (id: number) => {
  const response = await fetch(`${API_ENDPOINTS.ALBUM_PHOTOS}/${id}`, {
    method: 'DELETE',
    headers: { 'X-Netdisk-Request': '1' },
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '删除照片失败'))
  }
}

export const loginForAlbumManage = async (payload: { username: string; password: string }) => {
  return loginAdmin(payload)
}

export const verifyAlbumManageAuth = async () => {
  return verifyAdminSession()
}
