import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input, message, Modal, Select, Space, Spin, Typography } from 'antd'
import { ArrowLeftOutlined, EyeOutlined, SaveOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  createArticle,
  deleteArticle,
  fetchArticleBySlug,
  fetchArticleFilters,
  updateArticle,
} from '../../api/articles'
import type { Article, ArticleCategory, ArticleSavePayload, ArticleTagOption } from '../../types'
import { getAdminToken } from '../../utils/adminAuth'
import styles from './Editor.module.css'

const { Title } = Typography
const { TextArea } = Input

export const Editor: React.FC = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const isZh = i18n.language === 'zh'

  const [articleId, setArticleId] = useState<string | undefined>()
  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [slugValue, setSlugValue] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [tagIds, setTagIds] = useState<number[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [tags, setTags] = useState<ArticleTagOption[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const isEditing = Boolean(slug)

  useEffect(() => {
    if (!getAdminToken()) {
      const targetPath = slug ? `/editor/${slug}` : '/editor'
      message.warning(isZh ? '请先登录后再管理文章' : 'Please log in before managing articles')
      navigate(`/admin?redirect=${encodeURIComponent(targetPath)}`, { replace: true })
      return
    }

    let mounted = true
    setLoading(true)

    Promise.all([
      fetchArticleFilters(),
      slug ? fetchArticleBySlug(slug) : Promise.resolve(null),
    ])
      .then(([filters, article]) => {
        if (!mounted) return
        setCategories(filters.categories)
        setTags(filters.tags)
        if (article) {
          fillArticle(article)
        } else if (filters.categories[0]) {
          setCategoryId(filters.categories[0].id)
        }
      })
      .catch((error) => {
        message.error(error instanceof Error ? error.message : '加载编辑数据失败')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [isZh, navigate, slug])

  const fillArticle = (article: Article) => {
    setArticleId(article.id)
    setTitle(article.title)
    setTitleEn(article.titleEn || '')
    setSlugValue(article.slug)
    setExcerpt(article.excerpt || '')
    setContent(article.content || '')
    setCategoryId(article.categoryId)
    setTagIds(article.tagIds || [])
  }

  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')
            return match ? (
              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
                {codeString}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
    )
  }

  const buildPayload = (): ArticleSavePayload => ({
    title: title.trim(),
    titleEn: titleEn.trim() || undefined,
    slug: slugValue.trim() || undefined,
    excerpt: excerpt.trim() || undefined,
    content,
    categoryId,
    tagIds,
    author: 'Evan',
    status: 'PUBLISHED',
    featured: false,
  })

  const handleSave = async () => {
    if (!title.trim()) {
      message.error(isZh ? '请输入标题' : 'Please enter a title')
      return
    }
    if (!content.trim()) {
      message.error(isZh ? '请输入内容' : 'Please enter content')
      return
    }

    setSaving(true)
    try {
      const saved = articleId
        ? await updateArticle(articleId, buildPayload())
        : await createArticle(buildPayload())
      message.success(isZh ? '保存成功' : 'Saved successfully')
      navigate(`/blog/${saved.slug}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        message.error(isZh ? '登录已失效，请重新登录' : 'Login expired, please log in again')
        navigate(`/admin?redirect=${encodeURIComponent(slug ? `/editor/${slug}` : '/editor')}`)
        return
      }
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!articleId) return
    Modal.confirm({
      title: isZh ? '确认删除' : 'Confirm delete',
      content: isZh ? '确定要删除这篇文章吗？' : 'Are you sure you want to delete this article?',
      onOk: async () => {
        try {
          await deleteArticle(articleId)
          message.success(isZh ? '删除成功' : 'Deleted successfully')
          navigate('/blog')
        } catch (error) {
          if (error instanceof Error && error.message.includes('401')) {
            message.error(isZh ? '登录已失效，请重新登录' : 'Login expired, please log in again')
            navigate(`/admin?redirect=${encodeURIComponent(slug ? `/editor/${slug}` : '/editor')}`)
            return
          }
          message.error(error instanceof Error ? error.message : '删除失败')
        }
      },
    })
  }

  if (loading) {
    return (
      <div className={styles.editor}>
        <Spin />
      </div>
    )
  }

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/blog')}>
            {isZh ? '返回' : 'Back'}
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {isEditing ? (isZh ? '编辑文章' : 'Edit Article') : isZh ? '写文章' : 'Write Article'}
          </Title>
        </div>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? (isZh ? '编辑' : 'Edit') : isZh ? '预览' : 'Preview'}
          </Button>
          {isEditing && (
            <Button danger onClick={handleDelete}>
              {isZh ? '删除' : 'Delete'}
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            {isZh ? '保存' : 'Save'}
          </Button>
        </Space>
      </div>

      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            placeholder={isZh ? '文章标题（中文）' : 'Article title (Chinese)'}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={styles.titleInput}
          />
          <Input
            placeholder={isZh ? '文章标题（英文）' : 'Article title (English)'}
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            className={styles.titleInput}
          />
        </div>

        <div className={styles.row}>
          <Input
            placeholder={isZh ? '文章链接 slug，可留空自动生成' : 'Article slug, optional'}
            value={slugValue}
            onChange={(event) => setSlugValue(event.target.value)}
            className={styles.titleInput}
          />
          <Select
            value={categoryId}
            onChange={setCategoryId}
            placeholder={isZh ? '选择分类' : 'Select category'}
            options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
            className={styles.categorySelect}
          />
        </div>

        <Select
          mode="multiple"
          value={tagIds}
          onChange={setTagIds}
          placeholder={isZh ? '选择标签' : 'Select tags'}
          options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
        />

        <TextArea
          placeholder={isZh ? '文章摘要，可留空自动生成' : 'Excerpt, optional'}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 4 }}
        />

        <div className={styles.contentArea}>
          {previewMode ? (
            <Card className={styles.preview}>
              <div className={styles.previewContent}>{renderMarkdown(content)}</div>
            </Card>
          ) : (
            <TextArea
              placeholder={isZh ? '在这里使用 Markdown 编写文章...' : 'Write your article here using Markdown...'}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className={styles.contentInput}
            />
          )}
        </div>
      </div>
    </div>
  )
}
