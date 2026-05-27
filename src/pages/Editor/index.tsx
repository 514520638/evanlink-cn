import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input, Button, Select, Tag, message, Card, Typography, Space, Modal } from 'antd'
import { SaveOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Article } from '../../types'
import styles from './Editor.module.css'

const { Title } = Typography
const { TextArea } = Input

// localStorage 存储 key
const ARTICLES_STORAGE_KEY = 'blog_articles'

// 获取存储的文章
const getStoredArticles = (): Article[] => {
  const stored = localStorage.getItem(ARTICLES_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

// 保存文章到 localStorage
const saveArticles = (articles: Article[]) => {
  localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles))
}

// 生成唯一 ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 生成 slug
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const Editor: React.FC = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const isZh = i18n.language === 'zh'

  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('前端')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const categories = ['前端', '后端', '运维', '生活随笔']

  // 加载文章数据
  useEffect(() => {
    if (slug) {
      const articles = getStoredArticles()
      const article = articles.find((a) => a.slug === slug)
      if (article) {
        setTitle(article.title)
        setTitleEn(article.titleEn || '')
        setContent(article.content)
        setCategory(article.category || '前端')
        setTags(article.tags || [])
        setIsEditing(true)
      }
    }
  }, [slug])

  // 添加标签
  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // 预览 Markdown
  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
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

  // 计算阅读时间
  const calculateReadingTime = (text: string) => {
    const words = text.replace(/[#*`\[\]\-]/g, '').length
    return Math.ceil(words / 500)
  }

  // 保存文章
  const handleSave = () => {
    if (!title.trim()) {
      message.error(isZh ? '请输入标题' : 'Please enter a title')
      return
    }
    if (!content.trim()) {
      message.error(isZh ? '请输入内容' : 'Please enter content')
      return
    }

    const articles = getStoredArticles()
    const now = new Date().toISOString().split('T')[0] ?? ''
    const articleSlug = slug || generateSlug(title)

    const article: Article = {
      id: isEditing ? articles.find((a) => a.slug === slug)?.id || generateId() : generateId(),
      title,
      titleEn: titleEn || title,
      slug: articleSlug,
      excerpt: content.slice(0, 150).replace(/[#*`\[\]\-]/g, '') + '...',
      excerptEn: titleEn ? content.slice(0, 150).replace(/[#*`\[\]\-]/g, '') + '...' : '',
      content,
      category,
      tags,
      author: 'Evan',
      publishDate: isEditing ? (articles.find((a) => a.slug === slug)?.publishDate || now) : now,
      updateDate: now,
      readingTime: calculateReadingTime(content),
      views: isEditing ? (articles.find((a) => a.slug === slug)?.views || 0) : 0,
      featured: false,
    }

    if (isEditing) {
      const index = articles.findIndex((a) => a.slug === slug)
      if (index !== -1) {
        articles[index] = article
      }
    } else {
      articles.unshift(article)
    }

    saveArticles(articles)
    message.success(isZh ? '保存成功' : 'Saved successfully')
    navigate('/blog')
  }

  // 删除文章
  const handleDelete = () => {
    Modal.confirm({
      title: isZh ? '确认删除' : 'Confirm delete',
      content: isZh ? '确定要删除这篇文章吗？' : 'Are you sure you want to delete this article?',
      onOk: () => {
        const articles = getStoredArticles().filter((a) => a.slug !== slug)
        saveArticles(articles)
        message.success(isZh ? '删除成功' : 'Deleted successfully')
        navigate('/blog')
      },
    })
  }

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/blog')}>
            {isZh ? '返回' : 'Back'}
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            {isEditing ? (isZh ? '编辑文章' : 'Edit Article') : (isZh ? '写文章' : 'Write Article')}
          </Title>
        </div>
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? (isZh ? '编辑' : 'Edit') : (isZh ? '预览' : 'Preview')}
          </Button>
          {isEditing && (
            <Button danger onClick={handleDelete}>
              {isZh ? '删除' : 'Delete'}
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            {isZh ? '保存' : 'Save'}
          </Button>
        </Space>
      </div>

      <div className={styles.form}>
        <div className={styles.row}>
          <Input
            placeholder={isZh ? '文章标题（中文）' : 'Article title (Chinese)'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
          />
          <Input
            placeholder={isZh ? '文章标题（英文）' : 'Article title (English)'}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className={styles.titleInput}
          />
        </div>

        <div className={styles.row}>
          <Select
            value={category}
            onChange={setCategory}
            options={categories.map((cat) => ({ value: cat, label: cat }))}
            className={styles.categorySelect}
          />
          <div className={styles.tagsContainer}>
            {tags.map((tag) => (
              <Tag key={tag} closable onClose={() => handleRemoveTag(tag)}>
                {tag}
              </Tag>
            ))}
            <Input
              placeholder={isZh ? '添加标签' : 'Add tag'}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={handleAddTag}
              className={styles.tagInput}
            />
          </div>
        </div>

        <div className={styles.contentArea}>
          {previewMode ? (
            <Card className={styles.preview}>
              <div className={styles.previewContent}>{renderMarkdown(content)}</div>
            </Card>
          ) : (
            <TextArea
              placeholder={isZh ? '在这里使用 Markdown 编写文章...' : 'Write your article here using Markdown...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.contentInput}
            />
          )}
        </div>
      </div>
    </div>
  )
}
