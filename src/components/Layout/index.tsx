import React, { useState, Suspense } from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header/index.tsx';
import { Footer } from '../Footer/index.tsx';
import styles from './Layout.module.css';
import ChatLauncher from '../AgentChat/ChatLauncher';

const { Content } = AntLayout;

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <AntLayout className={styles.layout}>
      <Header collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />
      <Content className={styles.content}>
        <div className={styles.container}>
          <Suspense fallback={<div role="status" style={{ minHeight: 180, padding: 24 }}>页面加载中…</div>}><Outlet /></Suspense>
        </div>
      </Content>
      <Footer />
      <ChatLauncher />
    </AntLayout>
  );
};
