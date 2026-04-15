import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Card, Typography, Avatar, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { friends } from '../../data/projects';
import styles from './Friends.module.css';

const { Title, Paragraph } = Typography;

export const Friends: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <div className={styles.friends}>
      <div className={styles.header}>
        <Title level={1}>{t('friends.title')}</Title>
        <Paragraph>{t('friends.subtitle')}</Paragraph>
      </div>

      <Card className={styles.applyCard}>
        <PlusOutlined className={styles.icon} />
        <Paragraph>{t('friends.apply_desc')}</Paragraph>
        <Button type="primary" icon={<PlusOutlined />}>
          {t('friends.apply')}
        </Button>
      </Card>

      <Row gutter={[24, 24]}>
        {friends.map(friend => (
          <Col key={friend.id} xs={24} sm={12} lg={6}>
            <a 
              href={friend.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link}
            >
              <Card 
                className={styles.card}
                hoverable
              >
                <div className={styles.content}>
                  <Avatar 
                    src={friend.avatar} 
                    size={64}
                    className={styles.avatar}
                  >
                    {friend.name[0]}
                  </Avatar>
                  <Title level={5}>{friend.name}</Title>
                  <Paragraph className={styles.description}>
                    {isZh ? friend.description : friend.descriptionEn}
                  </Paragraph>
                </div>
              </Card>
            </a>
          </Col>
        ))}
      </Row>
    </div>
  );
};
