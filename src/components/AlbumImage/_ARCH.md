# 相册图片展示

- index.tsx：普通图片使用 Ant Design Image；HEIC/HEIF 进入视口后有序获取、生成临时 JPEG Object URL，卸载时取消任务并回收 URL。
- heic.worker.ts：使用 heic-to/next 在 Worker 中解码，调用方完成或超时后销毁 Worker；不上传转换结果、不写服务器磁盘。

依赖后端 media API；优先接受百度兼容预览图，缺少预览则客户端解码原图。原图标识和删除逻辑保持不变。
第三方依赖 heic-to（LGPL-3.0）：https://github.com/hoppergee/heic-to 。其可替换的独立 Worker 构建产物、源码和许可随项目分发。

布局：AlbumImage.module.css 为所有格式提供统一的满容器包装层，fit=cover 用于缩略图、fit=contain 用于完整预览。eager 用于已打开的预览；图片失败时原位重试，不改变卡片尺寸。支持键盘打开大图与减少动态效果偏好。

请求统一由 utils/imageRequests.ts 控制：并发 2、重复合并、45 秒/24MB 内存缓存、429 自动退避。所有格式都按视口懒加载，HEIC 解码仍串行；compact 模式用于 48px 缩略图的简洁占位与重试。
