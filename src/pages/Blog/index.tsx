import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Row, Col, Select, Tag, Typography, Empty, Button } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { articles as staticArticles, categories, allTags, searchArticles } from '../../data/articles'
import { ArticleCard } from '../../components/ArticleCard'
import type { Article } from '../../types'
import styles from './Blog.module.css'

const { Title, Paragraph } = Typography

// localStorage 存储 key
const ARTICLES_STORAGE_KEY = 'blog_articles'

// 获取存储的文章
const getStoredArticles = (): Article[] => {
  const stored = localStorage.getItem(ARTICLES_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export const Blog: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const navigate = useNavigate()

  const [storedArticles, setStoredArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 监听本地存储变化
  useEffect(() => {
    const loadArticles = () => {
      setStoredArticles(getStoredArticles())
    }
    loadArticles()
    
    // 监听存储变化
    const handleStorageChange = () => {
      loadArticles()
    }
    window.addEventListener('storage', handleStorageChange)
    
    // 也监听自定义事件（用于同页面更新）
    window.addEventListener('articlesUpdated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('articlesUpdated', handleStorageChange)
    }
  }, [])

  // 合并静态和存储的文章
  const allArticles = useMemo(() => {
    const storedIds = storedArticles.map(a => a.id)
    const uniqueStaticArticles = staticArticles.filter(a => !storedIds.includes(a.id))
    return [...storedArticles, ...uniqueStaticArticles]
  }, [storedArticles])

  const filteredArticles = useMemo(() => {
    let result = allArticles

    // 搜索过滤
    if (searchQuery) {
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (article.titleEn?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (article.excerptEn?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      )
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      result = result.filter((article) => article.category === selectedCategory)
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      result = result.filter((article) =>
        selectedTags.some((tag) => article.tags.includes(tag))
      )
    }

    return result
  }, [allArticles, searchQuery, selectedCategory, selectedTags])

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className={styles.blog}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <Title level={1}>{t('blog.title')}</Title>
            <Paragraph>{t('blog.subtitle')}</Paragraph>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/editor')}
          >
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
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
        </div>

        <div className={styles.filterGroups}>
          <div className={styles.filterGroup}>
            <label>{t('blog.categories')}:</label>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              className={styles.select}
              options={categories.map((cat) => ({ value: cat, label: cat }))}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>{t('blog.tags')}:</label>
            <div className={styles.tags}>
              {allTags.map((tag) => (
                <Tag
                  key={tag}
                  className={`${styles.tag} ${
                    selectedTags.includes(tag) ? styles.tagActive : ''
                  }`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredArticles.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredArticles.map((article) => (
            <Col key={article.id} xs={24} sm={12} lg={8}>
              <ArticleCard article={article} />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description={t('blog.no_results')} className={styles.empty} />
      )}
    </div>
  )
}
