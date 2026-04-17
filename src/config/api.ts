// API配置
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8080/api`

// API端点
export const API_ENDPOINTS = {
  // 用户信息
  USER_INFO: `${API_BASE_URL}/user_info`,
  
  // 简历验证
  RESUME_VERIFY: `${API_BASE_URL}/resume/verify`,
  
  // 技能数据
  SKILLS: `${API_BASE_URL}/skills`,
} as const

// 导出基础URL
export { API_BASE_URL }
