import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography, Row, Col, Avatar, Button, Progress, Card, Modal, Form, Input, message } from 'antd'
import {
  EyeOutlined,
  GithubOutlined,
  MailOutlined,
  GlobalOutlined,
  WechatOutlined,
  LockOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { aboutInfo } from '../../data/projects'
import { API_ENDPOINTS } from '../../config/api'
import styles from './About.module.css'
import { useAppSelector } from '../../store/hooks'

const { Title, Paragraph } = Typography

export const About: React.FC = () => {
  const { t, i18n } = useTranslation()
  const userInfo = useAppSelector((state) => state.userInfo.userInfo)
  const [wechatModalOpen, setWechatModalOpen] = useState(false)
  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [resumeForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isZh = i18n.language === 'zh'

  const getSkillsByCategory = (category: string) => {
    return aboutInfo.skills.filter((skill: any) => skill.category === category)
  }

  const handleResumeVerify = async () => {
    try {
      const values = await resumeForm.validateFields()
      setLoading(true)
      
      // 发送请求到后台验证
      const response = await fetch(API_ENDPOINTS.RESUME_VERIFY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: values.phone,
          name_apply: values.name,
          password: values.code,
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.resumeUrl) {
        // 验证通过，打开返回的resumeUrl
        setLoading(false)
        setResumeModalOpen(false)
        resumeForm.resetFields()
        window.open(data.resumeUrl, '_blank')
      } else {
        // 验证失败
        message.error(data.message || (isZh ? '验证失败' : 'Verification failed'))
        setLoading(false)
      }
    } catch (error) {
      console.error('Request failed:', error)
      message.error(isZh ? '请求失败，请稍后重试' : 'Request failed, please try again')
      setLoading(false)
    }
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
        <Avatar src={userInfo?.avatar} size={160} className={styles.avatar} />
        <Title level={1}>{t('about.title')}</Title>
        <Paragraph className={styles.subtitle}>{t('about.subtitle')}</Paragraph>
      </div>

      <Row gutter={[40, 40]}>
        <Col xs={24} lg={12}>
          <Card className={styles.card}>
            <Title level={3}>{t('about.bio_title')}</Title>
            <Paragraph className={styles.bio}>{isZh ? userInfo?.bio : userInfo?.bioEn}</Paragraph>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className={styles.card}>
            <Title level={3}>{t('about.contact_title')}</Title>
            <div className={styles.contact}>
              {userInfo?.wechat && (
                <a
                  onClick={() => setWechatModalOpen(true)}
                  className={styles.contactItem}
                  style={{ cursor: 'pointer' }}
                >
                  <WechatOutlined /> {isZh ? '微信' : 'WeChat'}
                </a>
              )}
              <a href={`mailto:${userInfo?.email}`} className={styles.contactItem}>
                <MailOutlined /> {userInfo?.email}
              </a>
              <a
                href={userInfo?.github}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactItem}
              >
                <GithubOutlined /> GitHub
              </a>
              {userInfo?.gitee && (
                <a
                  href={userInfo?.gitee}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.contactItem}
                >
                  <GlobalOutlined /> Gitee
                </a>
              )}

              {userInfo?.resumeUrl && (
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => setResumeModalOpen(true)}
                >
                  {t('about.resume_view')}
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

      {/* 微信二维码弹窗 */}
      <Modal
        title={isZh ? '添加微信' : 'Add WeChat'}
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {userInfo?.wechat ? (
            <img
              src={userInfo.wechat}
              alt="WeChat QR Code"
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ padding: '40px', color: '#999' }}>
              {isZh ? '暂无二维码' : 'No QR code available'}
            </div>
          )}
          {userInfo?.wechatId && (
            <p style={{ marginTop: '16px', fontSize: '16px' }}>
              {isZh ? '微信号：' : 'WeChat ID: '}
              <strong>{userInfo.wechatId}</strong>
            </p>
          )}
        </div>
      </Modal>

      {/* 简历验证弹窗 */}
      <Modal
        title={isZh ? '查看简历' : 'View Resume'}
        open={resumeModalOpen}
        onCancel={() => {
          setResumeModalOpen(false)
          resumeForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setResumeModalOpen(false)
            resumeForm.resetFields()
          }}>
            {isZh ? '取消' : 'Cancel'}
          </Button>,
          <Button key="submit" type="primary" loading={loading} onClick={handleResumeVerify}>
            {isZh ? '确认' : 'Confirm'}
          </Button>,
        ]}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: 20, color: 'rgba(0,0,0,0.65)' }}>
            {isZh ? '为确保安全访问，请输入您的姓名、手机号和准许码' : 'Please enter your name, phone number and access code to verify'}
          </p>
          <Form form={resumeForm} layout="vertical">
            <Form.Item
              name="name"
              rules={[
                { required: true, message: isZh ? '请输入姓名' : 'Please enter your name' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder={isZh ? '请输入姓名' : 'Enter your name'}
              />
            </Form.Item>
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: isZh ? '请输入手机号' : 'Please enter phone number' },
                { pattern: /^1\d{10}$/, message: isZh ? '请输入11位手机号' : 'Please enter 11-digit phone number' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder={isZh ? '请输入手机号' : 'Enter phone number'}
                maxLength={11}
              />
            </Form.Item>
            <Form.Item
              name="code"
              rules={[
                { required: true, message: isZh ? '请输入准许码' : 'Please enter access code' }
              ]}
            >
              <Input
                prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder={isZh ? '请输入准许码' : 'Enter access code'}
                type="password"
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  )
}
