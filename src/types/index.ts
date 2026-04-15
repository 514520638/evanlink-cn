// 主题模式
export type ThemeMode = 'light' | 'dark';

// 语言类型
export type Language = 'zh' | 'en';

// 文章类型
export interface Article {
  id?: string;
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  content: string;
  category?: string;
  tags: string[];
  author?: string;
  publishDate?: string;
  updateDate?: string;
  readingTime?: number;
  views?: number;
  featured?: boolean;
  coverImage?: string;
}

// 项目类型
export interface Project {
  id?: string;
  name: string;
  description: string;
  descriptionEn?: string;
  image?: string;
  technologies: string[];
  link?: string;
  github?: string;
  githubUrl?: string;
  demoUrl?: string;
  icon?: string;
  featured?: boolean;
}

// 友链类型
export interface Friend {
  id?: string;
  name: string;
  url?: string;
  website?: string;
  description?: string;
  descriptionEn?: string;
  avatar?: string;
}

// 技能类型
export interface Skill {
  name: string;
  nameEn?: string;
  level: number;
  category: string;
}

// 关于信息类型
export interface AboutInfo {
  name: string;
  nameEn?: string;
  title?: string;
  titleEn?: string;
  bio: string;
  bioEn?: string;
  avatar?: string;
  email?: string;
  github?: string;
  gitee?: string;
  twitter?: string;
  resumeUrl?: string;
  skills?: Skill[];
  socials?: {
    github?: string;
    twitter?: string;
    email?: string;
  };
}
