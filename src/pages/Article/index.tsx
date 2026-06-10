import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, message, Spin, Tag, Typography } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchArticleBySlug, increaseArticleView } from '../../api/articles'
import type { Article as ArticleType } from '../../types'
import { getAdminToken } from '../../utils/adminAuth'
import styles from './Article.module.css'

const { Title } = Typography

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [article, setArticle] = useState<ArticleType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    fetchArticleBySlug(slug)
      .then((data) => {
        if (mounted) {
          setArticle(data)
        }
        return increaseArticleView(slug)
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '加载文章失败')
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [slug])

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

  const handleEdit = () => {
    if (!article) return
    const editorPath = `/editor/${article.slug}`
    if (getAdminToken()) {
      navigate(editorPath)
      return
    }

    message.warning(isZh ? '请先登录后再编辑文章' : 'Please log in before editing')
    navigate(`/admin?redirect=${encodeURIComponent(editorPath)}`)
  }

  if (loading) {
    return (
      <div className={styles.article}>
        <Spin />
      </div>
    )
  }

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

  const title = isZh ? article.title : article.titleEn || article.title

  return (
    <div className={styles.article}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <Link to="/blog" className={styles.backLink}>
            <ArrowLeftOutlined /> {isZh ? '返回列表' : 'Back to list'}
          </Link>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
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
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const codeString = String(children).replace(/\n$/, '')

              return match ? (
                <div className="code-block">
                  <Button
                    className="code-copy-btn"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyCode(codeString)}
                  >
                    {copied ? (isZh ? '已复制' : 'Copied') : isZh ? '复制' : 'Copy'}
                  </Button>
                  <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
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
          {article.content || ''}
        </ReactMarkdown>
      </div>
    </div>
  )
}
