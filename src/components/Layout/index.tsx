import React, { useState } from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header/index.tsx';
import { Footer } from '../Footer/index.tsx';
import styles from './Layout.module.css';

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
          <Outlet />
        </div>
      </Content>
      <Footer />
    </AntLayout>
  );
};
