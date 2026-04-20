import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout, Modal } from 'antd'
import { GithubOutlined, MailOutlined, WechatOutlined, PhoneOutlined } from '@ant-design/icons'
import styles from './Footer.module.css'
import { useAppSelector } from '../../store/hooks'

const { Footer: AntFooter } = Layout

export const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language === 'zh'
  const userInfo = useAppSelector((state) => state.userInfo.userInfo)
  const [wechatModalOpen, setWechatModalOpen] = useState(false)

  const currentYear = new Date().getFullYear()

  return (
    <AntFooter className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.info}>
            <div className={styles.brand}>
              <span className={styles.logo}>{userInfo?.name}'s Blog</span>
              <p className={styles.slogan}>{t('about.subtitle')}</p>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{userInfo?.visitorNumber}</span>
                <span className={styles.statLabel}>{t('footer.visitor_count')}</span>
              </div>
            </div>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>导航</h4>
              <a href="/">首页</a>
              <a href="/blog">博客</a>
              <a href="/about">关于</a>
            </div>

            <div className={styles.linkGroup}>
              <h4 className={styles.linkTitle}>联系方式</h4>
              {userInfo?.phoneNumber && (
                <a href={`tel:${userInfo.phoneNumber}`}>
                  <PhoneOutlined /> {isZh ? '手机' : 'Phone'}
                </a>
              )}
              {userInfo?.wechat && (
                <a onClick={() => setWechatModalOpen(true)} style={{ cursor: 'pointer' }}>
                  <WechatOutlined /> {isZh ? '微信' : 'WeChat'}
                </a>
              )}
              <a href={`mailto:${userInfo?.email}`}>
                <MailOutlined /> Email
              </a>
              {userInfo?.github && (
                <a href={userInfo?.github} target="_blank" rel="noopener noreferrer">
                  <GithubOutlined /> GitHub
                </a>
              )}
              {userInfo?.gitee && (
                <a href={userInfo?.gitee} target="_blank" rel="noopener noreferrer">
                  <svg
                    viewBox="0 0 1024 1024"
                    width="1em"
                    height="1em"
                    fill="currentColor"
                    style={{ verticalAlign: '-0.125em', marginRight: 4 }}
                  >
                    <path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512zm259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853H360.191a25.293 25.293 0 0 1-25.293-25.293V416.2a75.853 75.853 0 0 1 75.853-75.853h360.917a25.293 25.293 0 0 0 25.293-25.267l.026-63.206a25.293 25.293 0 0 0-25.293-25.293H410.731a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z" />
                  </svg>
                  Gitee
                </a>
              )}
            </div>
          </div>
        </div>

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

        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <div className={styles.copyright}>
              <span>
                © {currentYear} Evan. {t('footer.copyright')}
              </span>
            </div>

            <div className={styles.powered}>
              <span>{t('footer.powered_by')} React + Ant Design</span>
            </div>
          </div>

          <div className={styles.beian}>
            <svg className={styles.beianIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
            <span className={styles.beianText}>蜀ICP备2024053023号-1</span>
          </div>
        </div>
      </div>
    </AntFooter>
  )
}
