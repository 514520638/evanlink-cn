import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, Row, Col, Typography } from 'antd'
import { ArrowRightOutlined, GithubOutlined } from '@ant-design/icons'
import { ArticleCard } from '../../components/ArticleCard'
import styles from './Home.module.css'
import { useAppSelector } from '../../store/hooks'
import { fetchArticles } from '../../api/articles'
import type { Article } from '../../types'

const { Title, Paragraph } = Typography

export const Home: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const userInfo = useAppSelector((state) => state.userInfo.userInfo)

  useEffect(() => {
    let mounted = true

    fetchArticles({ page: 1, pageSize: 3 })
      .then((data) => {
        if (mounted) {
          setFeaturedArticles(data.items)
        }
      })
      .catch(() => {
        if (mounted) {
          setFeaturedArticles([])
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Title level={1} className={styles.heroTitle}>
            {t('hero.title')}
            {isZh ? userInfo?.name : userInfo?.nameEn}
          </Title>
          <Paragraph className={styles.heroSubtitle}>{t('hero.subtitle')}</Paragraph>
          <div className={styles.heroButtons}>
            <Link to="/blog">
              <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                {t('hero.cta_blog')}
              </Button>
            </Link>
            <a href="https://github.com/514520638" target="_blank" rel="noopener noreferrer">
              <Button size="large" icon={<GithubOutlined />}>
                {t('hero.cta_code')}
              </Button>
            </a>
          </div>
        </div>
        <div className={styles.heroDecoration}>
          <div className={styles.codePreview}>
            <pre>
              <code>{`const developer = {
  name: "Evan",
  skills: ["React", "Go", "Docker"],
  passion: "Building great products",
  coffee: true
};`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Title level={2}>{t('blog.title')}</Title>
            <Paragraph>{t('blog.subtitle')}</Paragraph>
          </div>
          <Row gutter={[24, 24]}>
            {featuredArticles.map((article) => (
              <Col key={article.id ?? article.slug} xs={24} sm={12} lg={8}>
                <ArticleCard article={article} />
              </Col>
            ))}
          </Row>
          <div className={styles.moreLink}>
            <Link to="/blog">
              <Button type="link" size="large">
                {t('blog.load_more')} <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
