import React, { useEffect, useState } from 'react'
import { Button, Empty, Form, Image, Input, message, Modal, Popconfirm, Spin, Typography, Upload } from 'antd'
import type { UploadFile } from 'antd'
import {
  DeleteOutlined,
  InboxOutlined,
  LoginOutlined,
  PlusOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons'
import {
  deleteAlbumPhoto,
  fetchAlbumPhotos,
  loginForAlbumManage,
  uploadAlbumPhoto,
  verifyAlbumManageAuth,
} from '../../api/album'
import type { AlbumPhoto } from '../../types'
import styles from './Album.module.css'

const { Dragger } = Upload
const { Title, Paragraph } = Typography
const ACCEPTED_MEDIA = 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime'

interface UploadFormValues {
  title?: string
  description?: string
}

interface LoginFormValues {
  username: string
  password: string
}

export const Album: React.FC = () => {
  const [form] = Form.useForm<UploadFormValues>()
  const [loginForm] = Form.useForm<LoginFormValues>()
  const [photos, setPhotos] = useState<AlbumPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [authChecking, setAuthChecking] = useState(false)
  const [openUploadAfterLogin, setOpenUploadAfterLogin] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [isAuthed, setIsAuthed] = useState(false)

  const loadPhotos = async () => {
    setLoading(true)
    try {
      setPhotos(await fetchAlbumPhotos())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载相册失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPhotos()
  }, [])

  useEffect(() => {
    const verifyAuth = async () => {
      setIsAuthed(await verifyAlbumManageAuth())
    }

    verifyAuth()

    const handleStorage = () => {
      verifyAuth()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const requireAuth = async (openUploadAfterSuccess: boolean) => {
    setAuthChecking(true)
    try {
      const valid = await verifyAlbumManageAuth()
      setIsAuthed(valid)
      if (valid) {
        return true
      }

      message.warning('请先登录后再上传照片')
      setOpenUploadAfterLogin(openUploadAfterSuccess)
      setLoginOpen(true)
      return false
    } catch (error) {
      setIsAuthed(false)
      message.error(error instanceof Error ? error.message : '登录状态校验失败')
      setOpenUploadAfterLogin(openUploadAfterSuccess)
      setLoginOpen(true)
      return false
    } finally {
      setAuthChecking(false)
    }
  }

  const handleOpenUpload = async () => {
    const authed = await requireAuth(true)
    if (!authed) return

    setIsAuthed(true)
    setUploadOpen(true)
  }

  const handleCloseUpload = () => {
    setUploadOpen(false)
    setFileList([])
    form.resetFields()
  }

  const handleUpload = async () => {
    const files = fileList
      .map((item) => item.originFileObj)
      .filter((file): file is NonNullable<typeof file> => Boolean(file))
    if (!files.length) {
      message.warning('请选择照片或视频')
      return
    }

    try {
      const values = await form.validateFields()
      setUploading(true)
      const uploadedItems = await uploadAlbumPhoto({
        files,
        title: values.title,
        description: values.description,
      })
      setPhotos((prev) => [...uploadedItems, ...prev])
      setUploadOpen(false)
      setFileList([])
      form.resetFields()
      message.success(`已上传 ${uploadedItems.length} 个媒体文件`)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: AlbumPhoto) => {
    const authed = await requireAuth(false)
    if (!authed) return

    try {
      await deleteAlbumPhoto(photo.id)
      setPhotos((prev) => prev.filter((item) => item.id !== photo.id))
      message.success('照片已删除')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  const handleLogin = () => {
    setOpenUploadAfterLogin(false)
    setLoginOpen(true)
  }

  const handleLoginSubmit = async () => {
    try {
      const values = await loginForm.validateFields()
      setLoggingIn(true)
      await loginForAlbumManage(values)
      setIsAuthed(true)
      setLoginOpen(false)
      loginForm.resetFields()
      message.success('登录成功')
      if (openUploadAfterLogin) {
        setUploadOpen(true)
        setOpenUploadAfterLogin(false)
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLoginCancel = () => {
    setLoginOpen(false)
    setOpenUploadAfterLogin(false)
  }

  return (
    <div className={styles.album}>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>PRIVATE ALBUM</div>
          <Title level={1} className={styles.title}>
            个人相册
          </Title>
          <Paragraph className={styles.subtitle}>
            记录生活、旅途和项目之外的片段。访客可以浏览照片和视频，登录后可以批量上传和删除相册内容。
          </Paragraph>
        </div>
        <div className={styles.actions}>
          {isAuthed ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={authChecking}
              onClick={handleOpenUpload}
            >
              上传媒体
            </Button>
          ) : (
            <>
              <span className={styles.loginHint}>管理功能需登录</span>
              <Button icon={<LoginOutlined />} onClick={handleLogin}>
                登录管理
              </Button>
            </>
          )}
        </div>
      </section>

      <Spin spinning={loading}>
        {photos.length ? (
          <Image.PreviewGroup>
            <div className={styles.grid}>
              {photos.map((photo) => (
                <article className={styles.photoCard} key={photo.id}>
                  <div className={styles.imageWrap}>
                    {isAuthed && (
                      <Popconfirm
                        title={photo.mediaType === 'video' ? '删除视频' : '删除照片'}
                        description="删除后前台将不再展示这个媒体文件。"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => handleDelete(photo)}
                      >
                        <Button
                          danger
                          shape="circle"
                          icon={<DeleteOutlined />}
                          className={styles.deleteBtn}
                        />
                      </Popconfirm>
                    )}
                    {photo.mediaType === 'video' ? (
                      <div className={styles.videoFrame}>
                        <video
                          src={photo.url}
                          controls
                          preload="metadata"
                          className={styles.video}
                        />
                        <span className={styles.videoBadge}>
                          <PlayCircleOutlined /> 视频
                        </span>
                      </div>
                    ) : (
                      <Image src={photo.url} alt={photo.title || photo.originalName || '相册照片'} />
                    )}
                  </div>
                  <div className={styles.photoMeta}>
                    <h3 className={styles.photoTitle}>{photo.title || photo.originalName || '未命名照片'}</h3>
                    <p className={styles.photoDescription}>
                      {photo.description || new Date(photo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Image.PreviewGroup>
        ) : (
          <Empty description="相册还没有照片或视频" className={styles.empty} />
        )}
      </Spin>

      <Modal
        title="登录后管理相册"
        open={loginOpen}
        okText="登录"
        cancelText="取消"
        confirmLoading={loggingIn}
        onOk={handleLoginSubmit}
        onCancel={handleLoginCancel}
        destroyOnClose
      >
        <Form form={loginForm} layout="vertical" onFinish={handleLoginSubmit}>
          <Form.Item
            label="账号"
            name="username"
            initialValue="14776866846"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传照片或视频"
        open={uploadOpen}
        okText="上传"
        cancelText="取消"
        confirmLoading={uploading}
        onOk={handleUpload}
        onCancel={handleCloseUpload}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div className={styles.uploadArea}>
            <Dragger
              accept={ACCEPTED_MEDIA}
              multiple
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
              onRemove={(file) => setFileList((prev) => prev.filter((item) => item.uid !== file.uid))}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽照片、视频到这里</p>
              <p className="ant-upload-hint">支持 JPG、PNG、WebP、GIF 图片和 MP4、WebM、MOV 视频，可一次选择多个文件</p>
            </Dragger>
          </div>
          {fileList.length > 0 && (
            <div className={styles.uploadCount}>已选择 {fileList.length} 个文件</div>
          )}
          <Form.Item name="title" label="标题">
            <Input placeholder="给这批媒体起个名字，可留空" maxLength={80} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="记录地点、时间或一句备注" rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
