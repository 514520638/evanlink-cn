import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Typography,
  Row,
  Col,
  Avatar,
  Button,
  Progress,
  Card,
  Modal,
  Form,
  Input,
  message,
  Space,
} from 'antd'
import {
  EyeOutlined,
  GithubOutlined,
  MailOutlined,
  GlobalOutlined,
  WechatOutlined,
  LockOutlined,
  PhoneOutlined,
  UserOutlined,
  ShareAltOutlined,
  LoginOutlined,
} from '@ant-design/icons'
import { API_ENDPOINTS } from '../../config/api'
import styles from './About.module.css'
import { useAppSelector } from '../../store/hooks'
import { useIdleImagePreload } from '../../hooks/useIdleImagePreload'
import { loginAdmin } from '../../utils/adminAuth'

const { Title, Paragraph } = Typography

interface SkillItem {
  name: string
  nameEn: string
  level: number
}

interface SkillCategory {
  classify: string
  classifyEn: string
  list: SkillItem[]
}

export const About: React.FC = () => {
  const { t, i18n } = useTranslation()
  const userInfo = useAppSelector((state) => state.userInfo.userInfo)
  const [wechatModalOpen, setWechatModalOpen] = useState(false)
  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState(false)
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [resumeForm] = Form.useForm()
  const [adminLoginForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [adminLoginLoading, setAdminLoginLoading] = useState(false)
  const [skillsData, setSkillsData] = useState<SkillCategory[]>([])

  const isZh = i18n.language === 'zh'
  useIdleImagePreload(userInfo?.wechat)

  // 请求skills数据
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.SKILLS)
        if (response.ok) {
          const data = await response.json()
          if (data && Array.isArray(data) && data.length > 0) {
            setSkillsData(data)
          }
        }
      } catch (error) {
        console.error('Failed to fetch skills:', error)
        // 使用本地数据作为fallback
      }
    }

    fetchSkills()
  }, [])

  const getResumeShareToken = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('resumeToken') || params.get('resume_token') || ''
  }

  const openResumeWithShareToken = async (token: string) => {
    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.RESUME_SHARE_TOKEN_CHECK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (data.success && data.resumeUrl) {
        window.open(data.resumeUrl, '_blank')
        return true
      }
      message.error(data.message || (isZh ? '分享链接已失效' : 'Share link expired'))
      return false
    } catch (error) {
      console.error('Share token verification failed:', error)
      message.error(isZh ? '分享链接校验失败' : 'Share link verification failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const openResumeWithAdminSession = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.RESUME_ADMIN_OPEN, {
        method: 'POST',
        credentials: 'include',
      })
      if (response.status === 401) {
        return false
      }

      const data = await response.json()
      if (data.success && data.resumeUrl) {
        window.open(data.resumeUrl, '_blank')
        return true
      }
      return false
    } catch (error) {
      console.error('Admin resume open failed:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleOpenResume = async () => {
    const openedByAdmin = await openResumeWithAdminSession()
    if (openedByAdmin) return

    const token = getResumeShareToken()
    if (token) {
      const opened = await openResumeWithShareToken(token)
      if (opened) return
    }
    setResumeModalOpen(true)
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

  const createShareLink = async () => {
    setShareLoading(true)
    try {
      const response = await fetch(API_ENDPOINTS.RESUME_SHARE_TOKEN, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await response.json()
      if (response.status === 401) {
        setAdminLoginModalOpen(true)
        message.warning(data.message || (isZh ? '请先登录后再授权分享' : 'Please login first'))
        return
      }
      if (!response.ok || !data.success || !data.token) {
        throw new Error(data.message || (isZh ? '授权分享失败' : 'Failed to authorize sharing'))
      }

      const url = new URL(window.location.href)
      url.pathname = '/about'
      url.search = ''
      url.hash = ''
      url.searchParams.set('resumeToken', data.token)
      const nextShareLink = url.toString()
      setShareLink(nextShareLink)

      try {
        await navigator.clipboard.writeText(nextShareLink)
        message.success(isZh ? '授权链接已复制，7天内有效' : 'Share link copied. Valid for 7 days')
      } catch {
        setShareLinkModalOpen(true)
        message.info(isZh ? '请手动复制授权链接' : 'Please copy the share link manually')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : isZh ? '授权分享失败' : 'Failed to authorize sharing')
    } finally {
      setShareLoading(false)
    }
  }

  const handleShareClick = async () => {
    await createShareLink()
  }

  const handleAdminLogin = async () => {
    try {
      const values = await adminLoginForm.validateFields()
      setAdminLoginLoading(true)
      await loginAdmin(values)
      setAdminLoginModalOpen(false)
      adminLoginForm.resetFields()
      message.success(isZh ? '登录成功' : 'Login successful')
      await createShareLink()
    } catch (error) {
      message.error(error instanceof Error ? error.message : isZh ? '登录失败' : 'Login failed')
    } finally {
      setAdminLoginLoading(false)
    }
  }

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

              <div className={styles.resumeActions}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  loading={loading}
                  onClick={handleOpenResume}
                >
                  {t('about.resume_view')}
                </Button>
                <Button icon={<ShareAltOutlined />} loading={shareLoading} onClick={handleShareClick}>
                  {isZh ? '授权分享' : 'Authorize Share'}
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className={styles.card}>
        <Title level={3}>{t('about.skills_title')}</Title>
        <div className={styles.skills}>
          {skillsData?.map((cat) => {
            return (
              <div key={cat.classifyEn} className={styles.skillGroup}>
                <Title level={5}>{cat.classify}</Title>
                <div className={styles.skillList}>
                  {cat.list.map((skill: SkillItem) => (
                    <div key={skill.name} className={styles.skillItem}>
                      <div className={styles.skillHeader}>
                        <span>{isZh ? skill.name : skill.nameEn}</span>
                        <span>{skill.level}%</span>
                      </div>
                      <Progress percent={skill.level} showInfo={false} strokeColor="#1890ff" />
                    </div>
                  ))}
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

      {/* 授权分享登录弹窗 */}
      <Modal
        title={isZh ? '登录后授权分享' : 'Login to Authorize Sharing'}
        open={adminLoginModalOpen}
        onCancel={() => {
          setAdminLoginModalOpen(false)
          adminLoginForm.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setAdminLoginModalOpen(false)
              adminLoginForm.resetFields()
            }}
          >
            {isZh ? '取消' : 'Cancel'}
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<LoginOutlined />}
            loading={adminLoginLoading}
            onClick={handleAdminLogin}
          >
            {isZh ? '登录并生成' : 'Login and Generate'}
          </Button>,
        ]}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <Form form={adminLoginForm} layout="vertical" onFinish={handleAdminLogin}>
            <Form.Item
              label={isZh ? '账号' : 'Username'}
              name="username"
              initialValue="14776866846"
              rules={[{ required: true, message: isZh ? '请输入账号' : 'Please enter username' }]}
            >
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item
              label={isZh ? '密码' : 'Password'}
              name="password"
              rules={[{ required: true, message: isZh ? '请输入密码' : 'Please enter password' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* 授权链接手动复制弹窗 */}
      <Modal
        title={isZh ? '授权分享链接' : 'Resume Share Link'}
        open={shareLinkModalOpen}
        onCancel={() => setShareLinkModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setShareLinkModalOpen(false)}>
            {isZh ? '关闭' : 'Close'}
          </Button>,
        ]}
        centered
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph>
            {isZh
              ? '该链接7天内有效，访问者可直接打开简历。'
              : 'This link is valid for 7 days and allows direct resume access.'}
          </Paragraph>
          <Input.TextArea className={styles.shareLink} value={shareLink} autoSize readOnly />
        </Space>
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
          <Button
            key="cancel"
            onClick={() => {
              setResumeModalOpen(false)
              resumeForm.resetFields()
            }}
          >
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
            {isZh
              ? '为确保安全访问，请输入您的姓名、手机号和准许码'
              : 'Please enter your name, phone number and access code to verify'}
          </p>
          <Form form={resumeForm} layout="vertical">
            <Form.Item
              name="name"
              rules={[{ required: true, message: isZh ? '请输入姓名' : 'Please enter your name' }]}
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
                {
                  pattern: /^1\d{10}$/,
                  message: isZh ? '请输入11位手机号' : 'Please enter 11-digit phone number',
                },
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
                { required: true, message: isZh ? '请输入准许码' : 'Please enter access code' },
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
