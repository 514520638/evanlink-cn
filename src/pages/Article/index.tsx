import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Button, Card, Space, message } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getArticleBySlug, articles } from '../../data/articles';
import { formatDate, copyToClipboard } from '../../utils/helpers';
import styles from './Article.module.css';

const { Title, Text } = Typography;

export const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [copied, setCopied] = useState(false);

  const article = slug ? getArticleBySlug(slug) : undefined;
  
  const currentIndex = articles.findIndex(a => a.slug === slug);
  const prevArticle = currentIndex > 0 ? articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < articles.length - 1 ? articles[currentIndex + 1] : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const handleCopyCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      message.success('代码已复制');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!article) {
    return (
      <div className={styles.notFound}>
        <Title level={2}>{t('common.not_found')}</Title>
        <Link to="/blog">
          <Button type="primary">{t('common.back_home')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.article}>
      <div className={styles.header}>
        <Link to="/blog" className={styles.backLink}>
          <ArrowLeftOutlined /> {t('nav.blog')}
        </Link>
        
        <div className={styles.meta}>
          <Tag color="blue">{article.category}</Tag>
          <span className={styles.date}>
            {t('article.published')} {formatDate(article.publishDate)}
          </span>
          {article.updateDate && (
            <span className={styles.date}>
              {t('article.updated')} {formatDate(article.updateDate)}
            </span>
          )}
        </div>

        <Title level={1} className={styles.title}>
          {isZh ? article.title : article.titleEn}
        </Title>

        <div className={styles.stats}>
          <Space>
            <span><ClockCircleOutlined /> {article.readingTime} {t('blog.minutes')}</span>
            <span><EyeOutlined /> {article.views || 0} {t('blog.views')}</span>
          </Space>
        </div>

        <div className={styles.tags}>
          {article.tags.map(tag => (
            <Tag key={tag}>#{tag}</Tag>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <ReactMarkdown
          className={styles.markdown}
          components={{
            code({ node, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');
              
              return match ? (
                <div className="code-block">
                  <Button
                    className="code-copy-btn"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyCode(codeString)}
                  >
                    {copied ? '已复制' : '复制'}
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
              );
            },
          }}
        >
          {article.content}
        </ReactMarkdown>
      </div>

      <div className={styles.navigation}>
        <div className={styles.navItem}>
          {prevArticle ? (
            <Link to={`/blog/${prevArticle.slug}`}>
              <Card hoverable>
                <Text type="secondary">{t('article.prev')}</Text>
                <Title level={5}>{isZh ? prevArticle.title : prevArticle.titleEn}</Title>
              </Card>
            </Link>
          ) : <div />}
        </div>
        <div className={styles.navItem}>
          {nextArticle ? (
            <Link to={`/blog/${nextArticle.slug}`}>
              <Card hoverable>
                <Text type="secondary">{t('article.next')}</Text>
                <Title level={5}>{isZh ? nextArticle.title : nextArticle.titleEn}</Title>
              </Card>
            </Link>
          ) : <div />}
        </div>
      </div>

      <div className={styles.comments}>
        <Title level={3}>{t('article.comments')}</Title>
        <Card>
          <Text type="secondary">评论区正在开发中，敬请期待...</Text>
        </Card>
      </div>
    </div>
  );
};
