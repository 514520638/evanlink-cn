// API配置
const API_BASE_URL = '/api'

// API端点
export const API_ENDPOINTS = {
  // 用户信息
  USER_INFO: `${API_BASE_URL}/user_info`,
  
  // 简历验证
  RESUME_VERIFY: `${API_BASE_URL}/resume/verify`,
  
  // 技能数据
  SKILLS: `${API_BASE_URL}/skills`,

  // 文章数据
  ARTICLES: `${API_BASE_URL}/articles`,
  ARTICLE_DETAIL: (slug: string) => `${API_BASE_URL}/articles/${slug}`,
  ARTICLE_VIEW: (slug: string) => `${API_BASE_URL}/articles/${slug}/view`,
  ARTICLE_FILTERS: `${API_BASE_URL}/articles/filters`,

  // 相册
  ALBUM_PHOTOS: `${API_BASE_URL}/album/photos`,

  // 管理后台
  ADMIN_LOGIN: `${API_BASE_URL}/admin/login`,
  ADMIN_PROFILE: `${API_BASE_URL}/admin/profile`,
} as const

// 导出基础URL
export { API_BASE_URL }
