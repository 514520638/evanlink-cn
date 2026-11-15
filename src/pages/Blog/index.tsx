import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Col, Empty, Input, message, Pagination, Popconfirm, Row, Select, Space, Spin, Tag, Typography } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ArticleCard } from '../../components/ArticleCard'
import { fetchArticleFilters, fetchArticles, setArticleVisibility } from '../../api/articles'
import type { Article, ArticleCategory, ArticleTagOption } from '../../types'
import { verifyAdminSession } from '../../utils/adminAuth'
import { useBlogAuth } from '../../hooks/useBlogAuth'
import styles from './Blog.module.css'

const { Title, Paragraph } = Typography
const DEFAULT_PAGE_SIZE = 10

export const Blog: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const navigate = useNavigate()
  const { owner, checking } = useBlogAuth()
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'ARCHIVED' | 'DRAFT'>('ALL')
  const [version, setVersion] = useState(0)
  const [changing, setChanging] = useState<string | null>(null)
  const changeVisibility = async (article: Article) => {
    if (!article.id) return
    setChanging(String(article.id))
    try { await setArticleVisibility(article.id, article.status !== 'PUBLISHED'); setVersion(n => n + 1); message.success(article.status === 'PUBLISHED' ? '已隐藏，访客无法查看' : '文章已公开') }
    catch (error) { message.error(error instanceof Error ? error.message : '修改失败') }
    finally { setChanging(null) }
  }

  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [tags, setTags] = useState<ArticleTagOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchArticleFilters()
      .then((data) => {
        setCategories(data.categories)
        setTags(data.tags)
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '加载筛选项失败')
      })
  }, [version, owner])

  useEffect(() => {
    if (checking) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await fetchArticles({
          keyword: searchQuery.trim() || undefined,
          categoryId: selectedCategoryId,
          tagIds: selectedTagIds,
          page,
          pageSize,
          status: owner ? statusFilter : 'PUBLISHED',
        })
        if (cancelled) return
        setArticles(data.items)
        setTotal(data.total)
      } catch (error) {
        if (!cancelled) message.error(error instanceof Error ? error.message : '加载文章失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [searchQuery, selectedCategoryId, selectedTagIds, page, pageSize, owner, checking, statusFilter, version])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategoryId, selectedTagIds, statusFilter, owner])

  const handleTagClick = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const categoryOptions = [
    { value: 0, label: isZh ? '全部' : 'All' },
    ...categories.map((cat) => ({ value: cat.id, label: isZh ? cat.name : cat.nameEn || cat.name })),
  ]

  const handleWriteArticle = async () => {
    if (await verifyAdminSession()) {
      navigate('/editor')
      return
    }

    message.warning('请先登录后再写文章')
    navigate('/admin?redirect=/editor')
  }

  return (
    <div className={styles.blog}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <Title level={1}>{t('blog.title')}</Title>
            <Paragraph>{t('blog.subtitle')}</Paragraph>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleWriteArticle}>
            {t('nav.editor')}
          </Button>
        </div>
      </div>

      {owner && <Space style={{ marginBottom: 20 }}><span>文章状态</span><Select aria-label="文章状态" style={{ width: 150 }} value={statusFilter} onChange={setStatusFilter} options={[{value:'ALL',label:'全部文章'},{value:'PUBLISHED',label:'公开'},{value:'ARCHIVED',label:'隐藏'},{value:'DRAFT',label:'草稿'}]} /></Space>}
      <div className={styles.filters}>
        <div className={styles.searchInput}>
          <Input
            placeholder={t('blog.search')}
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            allowClear
          />
        </div>

        <div className={styles.filterGroups}>
          <div className={styles.filterGroup}>
            <label>{t('blog.categories')}:</label>
            <Select
              value={selectedCategoryId ?? 0}
              onChange={(value) => setSelectedCategoryId(value === 0 ? undefined : value)}
              className={styles.select}
              options={categoryOptions}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>{t('blog.tags')}:</label>
            <div className={styles.tags}>
              {/* 还没有文章的标签不进筛选栏，避免出现点开为空的入口；编辑器下拉仍保留全部标签。 */}
              {tags.filter((tag) => owner || (tag.articleCount ?? 0) > 0).map((tag) => (
                <Tag
                  key={tag.id}
                  color={selectedTagIds.includes(tag.id) ? tag.color || 'blue' : undefined}
                  className={`${styles.tag} ${
                    selectedTagIds.includes(tag.id) ? styles.tagActive : ''
                  }`}
                  onClick={() => handleTagClick(tag.id)}
                >
                  {isZh ? tag.name : tag.nameEn || tag.name}
                  {typeof tag.articleCount === 'number' ? ` ${tag.articleCount}` : ''}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Spin spinning={loading}>
        {articles.length > 0 ? (
          <>
            <Row gutter={[24, 24]}>
              {articles.filter(article => owner || article.status === 'PUBLISHED' || !article.status).map((article) => (
                <Col key={article.id ?? article.slug} xs={24} sm={12} lg={8}>
                  <ArticleCard article={article} tagOptions={tags} />
                  {owner && <Space style={{ marginTop: 8, justifyContent: 'space-between', width: '100%' }}><Tag color={article.status === 'PUBLISHED' ? 'blue' : undefined}>{article.status === 'PUBLISHED' ? '公开' : article.status === 'DRAFT' ? '草稿' : '隐藏'}</Tag><Popconfirm title={article.status === 'PUBLISHED' ? '隐藏这篇文章？' : '公开这篇文章？'} description={article.status === 'PUBLISHED' ? '访客列表和文章链接都将无法查看，内容保留。' : '所有访客均可查看文章内容。'} onConfirm={() => changeVisibility(article)}><Button size="small" loading={changing === String(article.id)} disabled={changing !== null}>{article.status === 'PUBLISHED' ? '隐藏' : '公开'}</Button></Popconfirm><Button size="small" type="text" onClick={() => navigate(`/editor/${article.slug}`)}>编辑</Button></Space>}
                </Col>
              ))}
            </Row>
            <Pagination
              className={styles.pagination}
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={[DEFAULT_PAGE_SIZE, 20, 50]}
              onChange={(nextPage, nextPageSize) => {
                setPage(nextPage)
                setPageSize(nextPageSize)
              }}
            />
          </>
        ) : (
          <Empty description={t('blog.no_results')} className={styles.empty} />
        )}
      </Spin>
    </div>
  )
}
