import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Home } from '../pages/Home'
import { Blog } from '../pages/Blog'
import { ArticlePage } from '../pages/Article'
import { About } from '../pages/About'
import { Editor } from '../pages/Editor'
import { AdminProfile } from '../pages/AdminProfile'
import { Album } from '../pages/Album'

export const AppRouter: React.FC = () => {
  return (
    <Routes>
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
    </Routes>
  )
}
