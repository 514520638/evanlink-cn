import { useState, useEffect } from 'react';

export const useSiteStats = () => {
  const [visitorCount, setVisitorCount] = useState(() => {
    const saved = localStorage.getItem('visitor_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const startDate = new Date('2024-01-01'); // 设置网站开始运行日期

  useEffect(() => {
    // 简单访客统计（基于本地存储，真实环境建议使用后端或第三方服务）
    const hasVisited = localStorage.getItem('has_visited');
    if (!hasVisited) {
      const newCount = visitorCount + 1;
      setVisitorCount(newCount);
      localStorage.setItem('visitor_count', newCount.toString());
      localStorage.setItem('has_visited', 'true');
    }
  }, []);

  const getRunningDays = () => {
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return {
    visitorCount,
    runningDays: getRunningDays(),
    startDate,
  };
};
