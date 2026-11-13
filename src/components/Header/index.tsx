import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Menu, Button, Space, Dropdown, Avatar, Drawer, Modal, Form, Input, message } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  BulbOutlined,
  WechatOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { useTheme } from '../../hooks/useTheme'
import { useLanguage } from '../../hooks/useLanguage'
import styles from './Header.module.css'
import { useAppSelector } from '../../store/hooks'
import { useBlogAuth } from '../../hooks/useBlogAuth'
import { loginAdmin, logoutAdmin } from '../../utils/adminAuth'
import { GuestQuestions } from '../GuestQuestions'
import { useManagedImage } from '../../hooks/useManagedImage'

const { Header: AntHeader } = Layout
interface HeaderProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleCollapse }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { language, toggleLanguage } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [wechatModalOpen, setWechatModalOpen] = useState(false)
  const userInfo = useAppSelector((state) => state.userInfo.userInfo)
  const avatarSrc = useManagedImage(userInfo?.avatar)
  const wechatSrc = useManagedImage(userInfo?.wechat, wechatModalOpen)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const menuItems = [
    { key: '/', label: t('nav.home') },
    { key: '/blog', label: t('nav.blog') },
    { key: '/album', label: t('nav.album') },
    { key: '/about', label: t('nav.about') },
  ]

  const { owner, checking } = useBlogAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [accountBusy, setAccountBusy] = useState(false)
  const [accountForm] = Form.useForm<{ username: string; password: string }>()
  useEffect(() => { if (!owner) setQuestionsOpen(false) }, [owner])
  const accountMenu = { items: [{ key: 'questions', label: '访客提问', icon: <MessageOutlined /> }, { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true }], onClick: ({ key }: { key: string }) => {
    if (key === 'questions') setQuestionsOpen(true)
    if (key === 'logout') { setAccountBusy(true); void logoutAdmin().catch(e => message.error(e.message)).finally(() => setAccountBusy(false)) }
  } }

  const currentKey =
    menuItems.find(
      (item) =>
        location.pathname === item.key ||
        (item.key !== '/' && location.pathname.startsWith(item.key))
    )?.key || '/'

  const languageMenu = {
    items: [
      { key: 'zh', label: '中文' },
      { key: 'en', label: 'English' },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key !== language) {
        toggleLanguage()
      }
    },
  }

  // 移动端菜单项
  const mobileMenuItems = menuItems.map((item) => ({
    key: item.key,
    label: item.label,
    onClick: () => {
      navigate(item.key)
      setMobileMenuOpen(false)
    },
  }))

  // 处理移动端菜单按钮点击
  const handleMobileMenuClick = () => {
    if (isMobile) {
      setMobileMenuOpen(true)
    } else {
      onToggleCollapse()
    }
  }

  return (
    <AntHeader className={styles.header}>
      <div className={styles.container}>
        <div className={styles.leftSection}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={handleMobileMenuClick}
            className={styles.collapseBtn}
          />

          <Link to="/" className={styles.logo}>
            <Avatar size={36} src={avatarSrc} style={{ backgroundColor: '#1890ff' }}>
              {userInfo?.nameEn?.charAt(0)}
            </Avatar>
            <span className={styles.logoText}>
              {language === 'zh' ? userInfo?.name : userInfo?.nameEn}
            </span>
          </Link>

          <Menu
            mode="horizontal"
            selectedKeys={[currentKey]}
            disabledOverflow
            items={menuItems.map((item) => ({
              key: item.key,
              label: <Link to={item.key}>{item.label}</Link>,
            }))}
            className={styles.menu}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </div>

        <div className={styles.rightSection}>
          <Space size="middle">
            {owner ? <Dropdown menu={accountMenu} trigger={['click']}><Button className={styles.accountButton} type="primary" ghost icon={<UserOutlined />} loading={accountBusy} aria-label="管理员账号菜单"><span className={styles.accountLabel}>管理员</span></Button></Dropdown> : <Button className={styles.accountButton} icon={<UserOutlined />} disabled={checking} onClick={() => setAccountOpen(true)} aria-label="管理员登录"><span className={styles.accountLabel}>登录</span></Button>}
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={toggleTheme}
              title={theme === 'light' ? t('theme.dark') : t('theme.light')}
            />

            <Dropdown menu={languageMenu} placement="bottomRight">
              <Button type="text" icon={<GlobalOutlined />}>
                {language === 'zh' ? '中文' : 'EN'}
              </Button>
            </Dropdown>

            <Button
              type="text"
              icon={<WechatOutlined />}
              onClick={() => setWechatModalOpen(true)}
              className={styles.socialLink}
              title="微信"
            />

            <Button
              type="text"
              icon={<MailOutlined />}
              onClick={() => {
                if (userInfo?.email) {
                  window.location.href = `mailto:${userInfo.email}`
                }
              }}
              className={styles.socialLink}
              title="邮箱"
            />
          </Space>
        </div>
      </div>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="导航菜单"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        className={styles.mobileDrawer}
      >
        <Menu
          mode="vertical"
          selectedKeys={[currentKey]}
          items={mobileMenuItems}
          theme={theme === 'dark' ? 'dark' : 'light'}
        />
      </Drawer>

      <Modal title="管理员登录" open={accountOpen} confirmLoading={accountBusy} okText="登录" cancelText="取消" onCancel={() => { setAccountOpen(false); accountForm.resetFields() }} onOk={() => void accountForm.validateFields().then(async values => {
        setAccountBusy(true)
        try { await loginAdmin(values); setAccountOpen(false); accountForm.resetFields(); message.success('登录成功') }
        catch(e) { message.error(e instanceof Error ? e.message : '登录失败') }
        finally { setAccountBusy(false) }
      }).catch(() => undefined)}>
        <Form form={accountForm} layout="vertical"><Form.Item label="账号" name="username" rules={[{ required: true }]}><Input autoComplete="username" /></Form.Item><Form.Item label="密码" name="password" rules={[{ required: true }]}><Input.Password autoComplete="current-password" /></Form.Item></Form>
      </Modal>
      {owner && <GuestQuestions open={questionsOpen} onClose={() => setQuestionsOpen(false)} />}
      {/* 微信二维码弹窗 */}
      <Modal
        title={language === 'zh' ? '添加微信' : 'Add WeChat'}
        open={wechatModalOpen}
        onCancel={() => setWechatModalOpen(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {userInfo?.wechat ? (
            <img
              src={wechatSrc}
              alt="WeChat QR Code"
              style={{ maxWidth: '200px', borderRadius: '8px' }}
            />
          ) : (
            <div style={{ padding: '40px', color: '#999' }}>
              {language === 'zh' ? '暂无二维码' : 'No QR code available'}
            </div>
          )}
          {userInfo?.wechatId && (
            <p style={{ marginTop: '16px', fontSize: '16px' }}>
              {language === 'zh' ? '微信号：' : 'WeChat ID: '}
              <strong>{userInfo.wechatId}</strong>
            </p>
          )}
        </div>
      </Modal>
    </AntHeader>
  )
}
