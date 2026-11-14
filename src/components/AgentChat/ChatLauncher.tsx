import { Component, lazy, Suspense, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from 'antd'
import { CommentOutlined } from '@ant-design/icons'
import { useFloatingLauncher } from '../../hooks/useFloatingLauncher'
import { useLanguage } from '../../hooks/useLanguage'
import styles from './AgentChat.module.css'

const Chat = lazy(() => import('./index'))
class LoadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? createPortal(<a className={styles.launcher} href="/chat">打开聊天页面</a>, document.body) : this.props.children }
}
export default function ChatLauncher() {
  const [active, setActive] = useState(false)
  const ref = useFloatingLauncher(!active)
  const { language } = useLanguage()
  const button = createPortal(<Button ref={ref} className={styles.launcher} type="primary" size="large" loading={active} icon={<CommentOutlined />} onClick={() => setActive(true)} aria-label="打开 AI 聊天">{language === 'zh' ? '和我聊聊' : 'Chat with me'}</Button>, document.body)
  return active ? <LoadBoundary><Suspense fallback={button}><Chat initialOpen /></Suspense></LoadBoundary> : button
}
