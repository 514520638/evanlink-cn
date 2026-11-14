# Agent 聊天界面

浮动聊天入口使用 Portal 挂载到 body，通过 VisualViewport 更新安全边距，避免页面变换/内容宽度影响固定定位。独立 /chat 的滚动锁在卸载时释放。

ChatLauncher.tsx 是首屏轻量入口，点击后 lazy 加载完整 AgentChat，initialOpen 控制首次打开。useFloatingLauncher 共享可视窗口定位，避免懒加载前后出现按钮位置差异。
