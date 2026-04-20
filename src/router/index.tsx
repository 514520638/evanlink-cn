import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Home } from '../pages/Home'
import { Blog } from '../pages/Blog'
import { Article } from '../pages/Article'
import { About } from '../pages/About'

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<Article />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  )
}
