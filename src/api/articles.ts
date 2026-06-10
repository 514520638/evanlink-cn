import { API_ENDPOINTS } from '../config/api'
import type {
  Article,
  ArticleFilters,
  ArticleQueryParams,
  ArticleSavePayload,
  PageResponse,
} from '../types'

const requestJson = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed: ${response.status}`
    try {
      const body = await response.json()
      message = body.message || message
    } catch {
      // Keep the status-based message if the response is not JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const fetchArticles = (params: ArticleQueryParams = {}) => {
  const query = new URLSearchParams()
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.categoryId) query.set('categoryId', String(params.categoryId))
  if (params.tagIds?.length) query.set('tagIds', params.tagIds.join(','))
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))

  const suffix = query.toString()
  return requestJson<PageResponse<Article>>(`${API_ENDPOINTS.ARTICLES}${suffix ? `?${suffix}` : ''}`)
}

export const fetchArticleBySlug = (slug: string) => {
  return requestJson<Article>(API_ENDPOINTS.ARTICLE_DETAIL(slug))
}

export const createArticle = (payload: ArticleSavePayload) => {
  return requestJson<Article>(API_ENDPOINTS.ARTICLES, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const updateArticle = (id: string | number, payload: ArticleSavePayload) => {
  return requestJson<Article>(`${API_ENDPOINTS.ARTICLES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const deleteArticle = (id: string | number) => {
  return requestJson<void>(`${API_ENDPOINTS.ARTICLES}/${id}`, {
    method: 'DELETE',
  })
}

export const increaseArticleView = (slug: string) => {
  return requestJson<void>(API_ENDPOINTS.ARTICLE_VIEW(slug), {
    method: 'POST',
  })
}

export const fetchArticleFilters = () => {
  return requestJson<ArticleFilters>(API_ENDPOINTS.ARTICLE_FILTERS)
}
