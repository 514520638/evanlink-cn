import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Typography, Tag, Button, message } from 'antd'
import { CopyOutlined, CalendarOutlined, EyeOutlined, ClockCircleOutlined, ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticleBySlug, articles as staticArticles } from '../../data/articles'
import type { Article as ArticleType } from '../../types'
import styles from './Article.module.css'

const { Title, Text } = Typography

// localStorage 存储 key
const ARTICLES_STORAGE_KEY = 'blog_articles'

// 获取存储的文章
const getStoredArticles = (): ArticleType[] => {
  const stored = localStorage.getItem(ARTICLES_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

// 根据 slug 获取文章
const findArticleBySlug = (slug: string): ArticleType | undefined => {
  // 先从存储的文章中查找
  const stored = getStoredArticles()
  const storedArticle = stored.find((a) => a.slug === slug)
  if (storedArticle) return storedArticle

  // 再从静态文章中查找
  return getArticleBySlug(slug)
}

// 获取所有文章
const getAllArticles = (): ArticleType[] => {
  const stored = getStoredArticles()
  const storedIds = stored.map(a => a.id)
  const uniqueStatic = staticArticles.filter(a => !storedIds.includes(a.id))
  return [...stored, ...uniqueStatic]
}

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const article = slug ? findArticleBySlug(slug) : undefined

  // 更新浏览量
  useEffect(() => {
    if (article && slug) {
      const stored = getStoredArticles()
      const index = stored.findIndex((a) => a.slug === slug)
      if (index !== -1) {
        stored[index].views = (stored[index].views || 0) + 1
        localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(stored))
      }
    }
  }, [])

  if (!article) {
    return (
      <div className={styles.notFound}>
        <Title level={2}>404 - {t('common.not_found')}</Title>
        <Link to="/blog">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            {t('common.back_home')}
          </Button>
        </Link>
      </div>
    )
  }

  const title = isZh ? article.title : (article.titleEn || article.title)

  // 获取上一篇和下一篇文章
  const allArticles = getAllArticles()
  const currentIndex = allArticles.findIndex((a) => a.slug === article.slug)
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      message.success(isZh ? '已复制' : 'Copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      message.error(isZh ? '复制失败' : 'Copy failed')
    }
  }

  return (
    <div className={styles.article}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <Link to="/blog" className={styles.backLink}>
            <ArrowLeftOutlined /> {isZh ? '返回列表' : 'Back to list'}
          </Link>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/editor/${article.slug}`)}
          >
            {isZh ? '编辑' : 'Edit'}
          </Button>
        </div>
        <Title level={1} className={styles.title}>
          {title}
        </Title>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <CalendarOutlined /> {article.publishDate}
          </span>
          <span className={styles.metaItem}>
            <ClockCircleOutlined /> {article.readingTime} {t('blog.minutes')}
          </span>
          <span className={styles.metaItem}>
            <EyeOutlined /> {article.views} {t('blog.views')}
          </span>
        </div>
        <div className={styles.tags}>
          {article.tags.map((tag: string) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <ReactMarkdown
          className={`markdown-content ${styles.markdown}`}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const codeString = String(children).replace(/\n$/, '')

              return match ? (
                <div className="code-block">
                  <Button
                    className="code-copy-btn"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyCode(codeString)}
                  >
                    {copied ? (isZh ? '已复制' : 'Copied') : (isZh ? '复制' : 'Copy')}
                  </Button>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      <div className={styles.navigation}>
        {prevArticle ? (
          <Link to={`/blog/${prevArticle.slug}`} className={styles.navLink}>
            <Text type="secondary">{t('article.prev')}: </Text>
            <Text>{isZh ? prevArticle.title : (prevArticle.titleEn || prevArticle.title)}</Text>
          </Link>
        ) : (
          <span />
        )}
        {nextArticle ? (
          <Link to={`/blog/${nextArticle.slug}`} className={styles.navLink}>
            <Text type="secondary">{t('article.next')}: </Text>
            <Text>{isZh ? nextArticle.title : (nextArticle.titleEn || nextArticle.title)}</Text>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
