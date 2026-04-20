import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Row, Col, Select, Tag, Typography, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { articles, categories, allTags, searchArticles } from '../../data/articles'
import { ArticleCard } from '../../components/ArticleCard'
import styles from './Blog.module.css'

const { Title, Paragraph } = Typography

export const Blog: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const filteredArticles = useMemo(() => {
    let result = articles

    // 搜索过滤
    if (searchQuery) {
      result = searchArticles(searchQuery)
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      result = result.filter((article) =>
        isZh ? article.category === selectedCategory : article.category === selectedCategory
      )
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      result = result.filter((article) =>
        selectedTags.some((tag) => article.tags.includes(tag))
      )
    }

    return result
  }, [searchQuery, selectedCategory, selectedTags, isZh])

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className={styles.blog}>
      <div className={styles.header}>
        <Title level={1}>{t('blog.title')}</Title>
        <Paragraph>{t('blog.subtitle')}</Paragraph>
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
