import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Col, Empty, Input, message, Pagination, Row, Select, Spin, Tag, Typography } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ArticleCard } from '../../components/ArticleCard'
import { fetchArticleFilters, fetchArticles } from '../../api/articles'
import type { Article, ArticleCategory, ArticleTagOption } from '../../types'
import { getAdminToken } from '../../utils/adminAuth'
import styles from './Blog.module.css'

const { Title, Paragraph } = Typography
const DEFAULT_PAGE_SIZE = 10

export const Blog: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

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
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await fetchArticles({
          keyword: searchQuery.trim() || undefined,
          categoryId: selectedCategoryId,
          tagIds: selectedTagIds,
          page,
          pageSize,
        })
        setArticles(data.items)
        setTotal(data.total)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '加载文章失败')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchQuery, selectedCategoryId, selectedTagIds, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedCategoryId, selectedTagIds])

  const handleTagClick = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const categoryOptions = [
    { value: 0, label: '全部' },
    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
  ]

  const handleWriteArticle = () => {
    if (getAdminToken()) {
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
              {tags.map((tag) => (
                <Tag
                  key={tag.id}
                  color={selectedTagIds.includes(tag.id) ? tag.color || 'blue' : undefined}
                  className={`${styles.tag} ${
                    selectedTagIds.includes(tag.id) ? styles.tagActive : ''
                  }`}
                  onClick={() => handleTagClick(tag.id)}
                >
                  {tag.name}
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
              {articles.map((article) => (
                <Col key={article.id ?? article.slug} xs={24} sm={12} lg={8}>
                  <ArticleCard article={article} />
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
