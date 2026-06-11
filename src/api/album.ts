import { API_ENDPOINTS } from '../config/api'
import type { AlbumPhoto } from '../types'
import { clearAdminToken, getAdminAuthHeaders, getAdminToken, setAdminToken } from '../utils/adminAuth'

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
  file: File
  title?: string
  description?: string
}) => {
  const formData = new FormData()
  formData.append('file', payload.file)
  if (payload.title) formData.append('title', payload.title)
  if (payload.description) formData.append('description', payload.description)

  const response = await fetch(API_ENDPOINTS.ALBUM_PHOTOS, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '上传照片失败'))
  }

  return response.json() as Promise<AlbumPhoto>
}

export const deleteAlbumPhoto = async (id: number) => {
  const response = await fetch(`${API_ENDPOINTS.ALBUM_PHOTOS}/${id}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '删除照片失败'))
  }
}

export const loginForAlbumManage = async (payload: { username: string; password: string }) => {
  const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, '登录失败'))
  }

  const data = (await response.json()) as { token: string }
  setAdminToken(data.token)
  return data.token
}

export const verifyAlbumManageAuth = async () => {
  if (!getAdminToken()) {
    return false
  }

  const response = await fetch(API_ENDPOINTS.ADMIN_PROFILE, {
    headers: getAdminAuthHeaders(),
  })

  if (response.status === 401) {
    clearAdminToken()
    return false
  }

  return response.ok
}
