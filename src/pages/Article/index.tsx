import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Typography, Tag, Button, message } from 'antd'
import { CopyOutlined, CalendarOutlined, EyeOutlined, ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticleBySlug, articles } from '../../data/articles'
import styles from './Article.module.css'

const { Title, Paragraph, Text } = Typography

export const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const [copied, setCopied] = useState(false)

  const article = slug ? getArticleBySlug(slug) : undefined

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

  const title = isZh ? article.title : article.titleEn

  // 获取上一篇和下一篇文章
  const currentIndex = articles.findIndex((a) => a.id === article.id)
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null

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
        <Link to="/blog" className={styles.backLink}>
          <ArrowLeftOutlined /> {isZh ? '返回列表' : 'Back to list'}
        </Link>
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
          {article.tags.map((tag) => (
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
            <Text>{isZh ? prevArticle.title : prevArticle.titleEn}</Text>
          </Link>
        ) : (
          <span />
        )}
        {nextArticle ? (
          <Link to={`/blog/${nextArticle.slug}`} className={styles.navLink}>
            <Text type="secondary">{t('article.next')}: </Text>
            <Text>{isZh ? nextArticle.title : nextArticle.titleEn}</Text>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
