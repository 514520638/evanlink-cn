import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Typography, Tag } from 'antd'
import { CalendarOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { Article } from '../../types'
import styles from './ArticleCard.module.css'

const { Title, Paragraph } = Typography

interface ArticleCardProps {
  article: Article
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const isZh = true // 可以根据上下文调整

  const title = isZh ? article.title : article.titleEn
  const excerpt = isZh ? article.excerpt : article.excerptEn

  return (
    <Link to={`/blog/${article.slug}`} className={styles.link}>
      <Card className={styles.card} hoverable>
        <div className={styles.content}>
          <div className={styles.meta}>
            <span className={styles.date}>
              <CalendarOutlined /> {article.publishDate}
            </span>
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
                <ClockCircleOutlined /> {article.readingTime} min
              </span>
              <span className={styles.stat}>
                <EyeOutlined /> {article.views}
              </span>
            </div>
            <div className={styles.tags}>
              {article.tags.slice(0, 2).map((tag) => (
                <Tag key={tag} className={styles.tag}>
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
