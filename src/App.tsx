import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { Provider } from 'react-redux'
import { store } from './store'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchUserInfo } from './store/slices/userInfoSlice'
import { AppRouter } from './router'
import { useTheme } from './hooks/useTheme'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useLanguage } from './hooks/useLanguage'
import './locales'
import './styles/global.css'

// 模块级别的 flag，确保整个应用生命周期内只请求一次
let hasFetched = false

// 初始化组件：在应用启动时获取用户信息
const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const userInfo = useAppSelector((state) => state.userInfo.userInfo)

  useEffect(() => {
    // 如果已经请求过或已有数据，直接返回
    if (hasFetched || userInfo) {
      if (userInfo) hasFetched = true
      return
    }
    hasFetched = true
    dispatch(fetchUserInfo())
  }, [dispatch, userInfo])

  return <>{children}</>
}

const AppContent: React.FC = () => {
  const { theme: currentTheme } = useTheme()
  const { language } = useLanguage()

  const antdLocale = language === 'zh' ? zhCN : enUS

  const darkThemeConfig = {
    algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
      colorBgContainer: currentTheme === 'dark' ? '#141414' : '#ffffff',
      colorBgElevated: currentTheme === 'dark' ? '#1f1f1f' : '#ffffff',
      colorText: currentTheme === 'dark' ? '#ffffff' : '#000000',
      colorTextSecondary: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
      colorBorder: currentTheme === 'dark' ? '#303030' : '#d9d9d9',
    },
  }

  return (
    <ConfigProvider theme={darkThemeConfig} locale={antdLocale}>
      <AppInitializer>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppInitializer>
    </ConfigProvider>
  )
}

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
