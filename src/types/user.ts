// 用户信息类型定义
export interface UserInfo {
  id?: string
  name?: string
  nameEn?: string
  email?: string
  avatar?: string
  bio?: string
  bioEn?: string
  github?: string
  gitee?: string
  wechatId?: string
  wechatQrCode?: string
  phone?: string
  visitorNumber?: number
  [key: string]: any
}

export interface UserInfoState {
  userInfo: UserInfo | null
  loading: boolean
  error: string | null
  setUserInfo: (info: UserInfo | null) => void
  fetchUserInfo: () => Promise<void>
}
