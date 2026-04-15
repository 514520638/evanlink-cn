import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Row, Col, Empty, Select, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { articles, categories, allTags, searchArticles as search } from '../../data/articles';
import { ArticleCard } from '../../components/ArticleCard';
import styles from './Blog.module.css';

export const Blog: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    let result = articles;

    if (searchQuery) {
      result = search(searchQuery);
    }

    if (selectedCategory !== '全部') {
      result = result.filter(article => article.category === selectedCategory);
    }

    if (selectedTag) {
      result = result.filter(article => article.tags.includes(selectedTag));
    }

    return result;
  }, [searchQuery, selectedCategory, selectedTag]);

  return (
    <div className={styles.blog}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('blog.title')}</h1>
        <p className={styles.subtitle}>{t('blog.subtitle')}</p>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('blog.search')}
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          allowClear
        />

        <div className={styles.filterGroups}>
          <div className={styles.filterGroup}>
            <label>{t('blog.categories')}</label>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map(cat => ({ value: cat, label: cat }))}
              className={styles.select}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>{t('blog.tags')}</label>
            <div className={styles.tags}>
              {allTags.map(tag => (
                <Tag
                  key={tag}
                  className={`${styles.tag} ${selectedTag === tag ? styles.tagActive : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  #{tag}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>

      {filteredArticles.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredArticles.map(article => (
            <Col key={article.id} xs={24} sm={12} lg={8}>
              <ArticleCard article={article} />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description={t('blog.no_results')} className={styles.empty} />
      )}
    </div>
  );
};
