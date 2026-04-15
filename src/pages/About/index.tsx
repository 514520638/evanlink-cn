import React from 'react'
import { useTranslation } from 'react-i18next'
import { Typography, Row, Col, Avatar, Button, Progress, Card } from 'antd'
import {
  DownloadOutlined,
  GithubOutlined,
  TwitterOutlined,
  MailOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { aboutInfo } from '../../data/projects'
import styles from './About.module.css'

const { Title, Paragraph } = Typography

export const About: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'

  const getSkillsByCategory = (category: string) => {
    return aboutInfo.skills.filter((skill: any) => skill.category === category)
  }

  const categories = [
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend' },
    { key: 'devops', label: 'DevOps' },
    { key: 'tools', label: 'Tools' },
  ]

  return (
    <div className={styles.about}>
      <div className={styles.header}>
        <Avatar src={aboutInfo.avatar} size={160} className={styles.avatar} />
        <Title level={1}>{t('about.title')}</Title>
        <Paragraph className={styles.subtitle}>{t('about.subtitle')}</Paragraph>
      </div>

      <Row gutter={[40, 40]}>
        <Col xs={24} lg={12}>
          <Card className={styles.card}>
            <Title level={3}>{t('about.bio_title')}</Title>
            <Paragraph className={styles.bio}>{isZh ? aboutInfo.bio : aboutInfo.bioEn}</Paragraph>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className={styles.card}>
            <Title level={3}>{t('about.contact_title')}</Title>
            <div className={styles.contact}>
              <a href={`mailto:${aboutInfo.email}`} className={styles.contactItem}>
                <MailOutlined /> {aboutInfo.email}
              </a>
              <a
                href={aboutInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactItem}
              >
                <GithubOutlined /> GitHub
              </a>
              {aboutInfo.gitee && (
                <a
                  href={aboutInfo.gitee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <GlobalOutlined /> Gitee
                </a>
              )}
              {aboutInfo.twitter && (
                <a
                  href={aboutInfo.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <TwitterOutlined /> Twitter
                </a>
              )}
              {aboutInfo.resumeUrl && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  href={aboutInfo.resumeUrl}
                  target="_blank"
                >
                  {t('about.resume_download')}
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card className={styles.card}>
        <Title level={3}>{t('about.skills_title')}</Title>
        <div className={styles.skills}>
          {categories.map((cat) => {
            const catSkills = getSkillsByCategory(cat.key)
            if (catSkills.length === 0) return null

            return (
              <div key={cat.key} className={styles.skillGroup}>
                <Title level={5}>{cat.label}</Title>
                <div className={styles.skillList}>
                  {catSkills.map(
                    (skill: { name: string; nameEn: string; level: number; category: string }) => (
                      <div key={skill.name} className={styles.skillItem}>
                        <div className={styles.skillHeader}>
                          <span>{isZh ? skill.name : skill.nameEn}</span>
                          <span>{skill.level}%</span>
                        </div>
                        <Progress percent={skill.level} showInfo={false} strokeColor="#1890ff" />
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
