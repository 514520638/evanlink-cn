import type { Project, Friend, AboutInfo } from '../types/index'

export const projects: Project[] = [
  {
    id: '1',
    name: 'EvanBlog',
    description:
      '基于 React + TypeScript 的现代化个人博客系统，支持 Markdown 文章、代码高亮、评论系统',
    descriptionEn:
      'A modern personal blog system built with React + TypeScript, supporting Markdown articles, syntax highlighting, and comments',
    image: 'https://via.placeholder.com/400x250/1890ff/ffffff?text=EvanBlog',
    technologies: ['React', 'TypeScript', 'Ant Design', 'Vite'],
    githubUrl: 'https://github.com/514520638/evanlink-cn',
    demoUrl: 'https://evanlink.cn',
    featured: true,
  },
  {
    id: '2',
    name: 'Go-Admin',
    description: '基于 Go + Gin + Vue3 的后台管理系统，包含完整的权限管理和数据可视化功能',
    descriptionEn:
      'A backend management system based on Go + Gin + Vue3, with complete permission management and data visualization',
    image: 'https://via.placeholder.com/400x250/52c41a/ffffff?text=Go-Admin',
    technologies: ['Go', 'Gin', 'Vue3', 'MySQL', 'Redis'],
    githubUrl: 'https://github.com/example/go-admin',
    demoUrl: 'https://demo.go-admin.com',
    featured: true,
  },
  {
    id: '3',
    name: 'Docker-Deploy-Tool',
    description: '一键部署工具，支持 Docker Compose 编排和自动 SSL 证书配置',
    descriptionEn:
      'One-click deployment tool supporting Docker Compose orchestration and automatic SSL certificate configuration',
    technologies: ['Shell', 'Docker', 'Nginx', 'LetsEncrypt'],
    githubUrl: 'https://github.com/example/docker-deploy',
    featured: false,
  },
]

export const friends: Friend[] = [
  {
    id: '1',
    name: '张三的博客',
    avatar: 'https://via.placeholder.com/100x100/ff6b6b/ffffff?text=Z',
    website: 'https://zhangsan.com',
    description: '全栈开发者的技术分享',
    descriptionEn: 'Full-stack developer sharing technical insights',
  },
  {
    id: '2',
    name: '李四的技术站',
    avatar: 'https://via.placeholder.com/100x100/4ecdc4/ffffff?text=L',
    website: 'https://lisi.tech',
    description: '专注于 DevOps 与云原生',
    descriptionEn: 'Focusing on DevOps and Cloud Native',
  },
  {
    id: '3',
    name: '王五的小站',
    avatar: 'https://via.placeholder.com/100x100/45b7d1/ffffff?text=W',
    website: 'https://wangwu.io',
    description: '独立开发者的日常',
    descriptionEn: 'Independent developer daily',
  },
  {
    id: '4',
    name: '赵六的笔记',
    avatar: 'https://via.placeholder.com/100x100/96ceb4/ffffff?text=Z',
    website: 'https://zhaoliu.me',
    description: '学习笔记与技术总结',
    descriptionEn: 'Learning notes and technical summaries',
  },
]

// export const aboutInfo: AboutInfo = {
//   name: 'Evan',
//   nameEn: 'Evan',
//   title: '全栈工程师',
//   titleEn: 'Full-Stack Engineer',
//   bio: '我是一名热爱技术的全栈工程师，目前专注于 Web 开发、云原生和性能优化领域。工作之余，我喜欢阅读技术文档、参与开源项目，也会写一些技术博客来记录和分享所学。希望能通过这个博客与更多志同道合的朋友交流学习。',
//   bioEn:
//     'I am a full-stack engineer passionate about technology, currently focusing on web development, cloud-native, and performance optimization. In my spare time, I enjoy reading technical documentation, contributing to open-source projects, and writing technical blogs to share my knowledge. I hope to connect and learn with like-minded friends through this blog.',
//   email: 'evan@example.com',
//   github: 'https://github.com/514520638',
//   gitee: 'https://gitee.com/gitee_evan/projects',
//   twitter: 'https://twitter.com/evan_dev',
//   resumeUrl: '/resume.pdf',
//   skills: [
//     {
//       classify: '前端',
//       classifyEn: 'frontend',
//       list: [
//         { name: 'Vue', nameEn: 'Vue', level: 90 },
//         { name: '小程序', nameEn: 'Mini-program', level: 85 },
//         { name: 'React', nameEn: 'React', level: 70 },
//       ],
//     },
//     {
//       classify: 'AI',
//       classifyEn: 'AI',
//       list: [
//         { name: 'Java', nameEn: 'Java', level: 60 },
//         { name: '大模型应用', nameEn: 'Large Model Applications', level: 85 },
//         { name: 'OpenClaw', nameEn: 'OpenClaw', level: 75 },
//       ],
//     },
//     {
//       classify: 'DevOps',
//       classifyEn: 'devops',
//       list: [
//         { name: 'Xone', nameEn: 'Xone', level: 90 },
//         { name: '腾讯云', nameEn: 'Tencent Cloud', level: 85 },
//         { name: 'CI/CD', nameEn: 'CI/CD', level: 80 },
//       ],
//     },
//     {
//       classify: 'tools',
//       classifyEn: 'tools',
//       list: [
//         { name: 'Git', nameEn: 'Git', level: 90 },
//         { name: 'GitLab插件', nameEn: 'GitLab Plugin', level: 90 },
//         { name: 'Tapd', nameEn: 'Tapd', level: 95 },
//       ],
//     },
//   ],
// }
