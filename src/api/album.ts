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
  const formData = new FormData()
  payload.files.forEach((file) => formData.append('file', file))
  if (payload.title) formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)

  const response = await fetch(API_ENDPOINTS.ALBUM_PHOTOS, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '上传照片失败'))
  }

  return response.json() as Promise<AlbumPhoto[]>
}

export const deleteAlbumPhoto = async (id: number) => {
  const response = await fetch(`${API_ENDPOINTS.ALBUM_PHOTOS}/${id}`, {
    method: 'DELETE',
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
