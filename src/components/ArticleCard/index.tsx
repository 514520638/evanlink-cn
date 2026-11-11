import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Typography, Tag } from 'antd'
import { CalendarOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { Article, ArticleTagOption } from '../../types'
import { useLanguage } from '../../hooks/useLanguage'
import styles from './ArticleCard.module.css'

const { Title, Paragraph } = Typography

interface ArticleCardProps {
  article: Article
  tagOptions?: ArticleTagOption[]
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, tagOptions = [] }) => {
  const { language } = useLanguage()
  const isZh = language === 'zh'

  const title = (isZh ? article.title : article.titleEn) || article.title
  const excerpt = (isZh ? article.excerpt : article.excerptEn) || article.excerpt

  return (
    <Link to={`/blog/${article.slug}`} className={styles.link}>
      <Card className={styles.card} hoverable>
        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.date}>
              <CalendarOutlined /> {article.publishDate}
            </span>
            {article.category && <span className={styles.category}>{isZh ? article.category : article.categoryEn || article.category}</span>}
          </div>
          <Title level={4} className={styles.title}>
            {title}
          </Title>
          <Paragraph className={styles.excerpt} ellipsis={{ rows: 2 }}>
            {excerpt}
          </Paragraph>
          <div className={styles.footer}>
            <div className={styles.stats}>
              <span className={styles.stat}>
                <ClockCircleOutlined /> <span>{article.readingTime ?? '—'} {isZh ? '分钟阅读' : 'min read'}</span>
              </span>
              <span className={styles.stat}>
                <EyeOutlined /> <span>{article.views ?? 0} {isZh ? '次阅读' : 'views'}</span>
              </span>
            </div>
            <div className={styles.tags}>
              {(article.tags || []).slice(0, 2).map((tag) => (
                <Tag key={tag} className={styles.tag} title={isZh ? tag : tagOptions.find(item => item.name === tag)?.nameEn || tag}>
                  {isZh ? tag : tagOptions.find(item => item.name === tag)?.nameEn || tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
