import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
const AgentChat = lazy(() => import('../components/AgentChat'))
import { Layout } from '../components/Layout'
const Home = lazy(() => import('../pages/Home').then(module => ({ default: module.Home })))
const Blog = lazy(() => import('../pages/Blog').then(module => ({ default: module.Blog })))
const ArticlePage = lazy(() => import('../pages/Article').then(module => ({ default: module.ArticlePage })))
const About = lazy(() => import('../pages/About').then(module => ({ default: module.About })))
const Editor = lazy(() => import('../pages/Editor').then(module => ({ default: module.Editor })))
const AdminProfile = lazy(() => import('../pages/AdminProfile').then(module => ({ default: module.AdminProfile })))
const Album = lazy(() => import('../pages/Album').then(module => ({ default: module.Album })))

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<div role="status" style={{ padding: 32 }}>页面加载中…</div>}><Routes>
      <Route path="/chat" element={<AgentChat standalone />} />
      <Route path="/agent" element={<Navigate replace to="/chat" />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<ArticlePage />} />
        <Route path="editor" element={<Editor />} />
        <Route path="editor/:slug" element={<Editor />} />
        <Route path="about" element={<About />} />
        <Route path="admin" element={<AdminProfile />} />
        <Route path="album" element={<Album />} />
      </Route>
    </Routes></Suspense>
  )
}
