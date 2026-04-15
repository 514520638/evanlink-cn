import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Layout, Menu, Button, Space, Dropdown, Avatar, Drawer, Modal } from 'antd'
import {
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
    { key: '/projects', label: t('nav.projects') },
    { key: '/about', label: t('nav.about') },
    { key: '/friends', label: t('nav.friends') },
  ]

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
            <Avatar size={36} src={userInfo?.avatar} style={{ backgroundColor: '#1890ff' }}>
              {userInfo?.nameEn?.charAt(0)}
            </Avatar>
            <span className={styles.logoText}>
              {language === 'zh' ? userInfo?.name : userInfo?.nameEn}
            </span>
          </Link>

          <Menu
            mode="horizontal"
            selectedKeys={[currentKey]}
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
              src={userInfo?.wechat}
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
