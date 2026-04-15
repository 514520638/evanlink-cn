import React from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import { EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Article } from '../../types';
import { formatDate } from '../../utils/helpers';
import styles from './ArticleCard.module.css';

const { Title, Paragraph } = Typography;

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <Link to={`/blog/${article.slug}`} className={styles.link}>
      <Card 
        className={styles.card}
        hoverable
        cover={
          article.coverImage && (
            <div className={styles.cover}>
              <img src={article.coverImage} alt={article.title} />
            </div>
          )
        }
      >
        <div className={styles.content}>
          <div className={styles.meta}>
            <Tag color="blue">{article.category}</Tag>
            <span className={styles.date}>
              {formatDate(article.publishDate)}
            </span>
          </div>

          <Title level={4} className={styles.title}>
            {isZh ? article.title : article.titleEn}
          </Title>

          <Paragraph className={styles.excerpt} ellipsis={{ rows: 2 }}>
            {isZh ? article.excerpt : article.excerptEn}
          </Paragraph>

          <div className={styles.footer}>
            <Space size="small">
              <span className={styles.stat}>
                <ClockCircleOutlined /> {article.readingTime} min
              </span>
              <span className={styles.stat}>
                <EyeOutlined /> {article.views || 0}
              </span>
            </Space>

            <div className={styles.tags}>
              {article.tags.slice(0, 3).map(tag => (
                <Tag key={tag} className={styles.tag}>
                  #{tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
