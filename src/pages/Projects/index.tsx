import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Card, Typography, Tag, Button, Space } from 'antd';
import { GithubOutlined, GlobalOutlined } from '@ant-design/icons';
import { projects } from '../../data/projects';
import styles from './Projects.module.css';

const { Title, Paragraph } = Typography;

export const Projects: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <div className={styles.projects}>
      <div className={styles.header}>
        <Title level={1}>{t('projects.title')}</Title>
        <Paragraph>{t('projects.subtitle')}</Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {projects.map(project => (
          <Col key={project.id} xs={24} sm={12} lg={8}>
            <Card 
              className={styles.card}
              hoverable
              cover={
                project.image && (
                  <div className={styles.cover}>
                    <img src={project.image} alt={project.name} />
                  </div>
                )
              }
            >
              <Title level={4}>{project.name}</Title>
              <Paragraph className={styles.description}>
                {isZh ? project.description : project.descriptionEn}
              </Paragraph>
              
              <div className={styles.technologies}>
                {project.technologies.map(tech => (
                  <Tag key={tech} color="blue">{tech}</Tag>
                ))}
              </div>

              <div className={styles.actions}>
                <Space>
                  {project.githubUrl && (
                    <Button 
                      icon={<GithubOutlined />}
                      href={project.githubUrl}
                      target="_blank"
                    >
                      {t('projects.source_code')}
                    </Button>
                  )}
                  {project.demoUrl && (
                    <Button 
                      type="primary"
                      icon={<GlobalOutlined />}
                      href={project.demoUrl}
                      target="_blank"
                    >
                      {t('projects.live_demo')}
                    </Button>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
