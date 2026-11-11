import { useEffect, useState } from 'react'
import { Alert, Button, Empty, Modal, Popconfirm, Space, Table, message } from 'antd'
import { clearImageCache } from '../../utils/imageRequests'
import { AlbumImage } from '../AlbumImage'
import styles from './NetdiskAlbum.module.css'
import { CloudOutlined, FolderOutlined, ReloadOutlined, ArrowLeftOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'

interface Status { configured: boolean; connected: boolean; root: string }
interface File { id: string; name: string; path: string; folder: boolean; size: number }
interface Listing { items: File[]; path: string; page: number; hasMore: boolean }
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api/album/baidu${path}`, {
    method, credentials: 'include', headers: { 'X-Netdisk-Request': '1', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || '网盘请求失败，请稍后重试')
  return data
}
export function NetdiskAlbum({ open, onClose, onPublished }: { open: boolean; onClose: () => void; onPublished: () => void }) {
  const [status, setStatus] = useState<Status>()
  const [listing, setListing] = useState<Listing>()
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<File>()
  async function run(action: () => Promise<void>) {
    setBusy(true); setError('')
    try { await action() } catch (e) { setError(e instanceof Error ? e.message : '请求失败') } finally { setBusy(false) }
  }
  async function browse(path: string, page = 1) {
    const data = await request<Listing>(`/files?path=${encodeURIComponent(path)}&page=${page}`)
    setListing(data); setSelected([])
  }
  async function refresh() {
    const data = await request<Status>('/status'); setStatus(data)
    if (data.configured && data.connected) await browse(data.root)
    else { setListing(undefined); setSelected([]) }
  }
  useEffect(() => { if (open) void run(refresh); else { setPreview(undefined); setSelected([]) } }, [open])
  const previewable = listing?.items.filter(file => !file.folder && file.size <= 20 * 1024 * 1024) || []
  const previewIndex = previewable.findIndex(file => file.id === preview?.id)
  useEffect(() => {
    if (!preview) return
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches('input,textarea,select')) return
      if (event.key === 'ArrowLeft' && previewIndex > 0) { event.preventDefault(); setPreview(previewable[previewIndex - 1]) }
      if (event.key === 'ArrowRight' && previewIndex < previewable.length - 1) { event.preventDefault(); setPreview(previewable[previewIndex + 1]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview, previewIndex, listing])
  const togglePhoto = () => {
    if (!preview) return
    setSelected(current => current.includes(preview.id) ? current.filter(id => id !== preview.id) : [...current, preview.id])
  }
  return <>
    <Modal rootClassName={styles.dialogRoot} className={styles.dialog} title={<div className={styles.heading}><CloudOutlined />百度网盘相册</div>}
      open={open} onCancel={onClose} keyboard={!preview} maskClosable={!busy && !preview} width={880} centered destroyOnClose
      footer={listing && status ? <div className={styles.footer}>
        <Space size={6}><Button aria-label="上一页" icon={<LeftOutlined />} disabled={busy || listing.page <= 1} onClick={() => void run(() => browse(listing.path, listing.page - 1))} /><span className={styles.selection}>第 {listing.page} 页</span><Button aria-label="下一页" icon={<RightOutlined />} disabled={busy || !listing.hasMore} onClick={() => void run(() => browse(listing.path, listing.page + 1))} /></Space>
        <Space wrap><span className={styles.selection}>已选 {selected.length} / 20 张</span>{selected.length > 0 && <Button type="text" disabled={busy} onClick={() => setSelected([])}>清空</Button>}
          <Popconfirm title={`将 ${selected.length} 张照片公开到博客？`} description="访客将能够查看这些照片。" disabled={!selected.length || selected.length > 20} onConfirm={() => run(async () => { await request('/publish', 'POST', { ids: selected }); setSelected([]); message.success('已发布到博客相册'); onPublished() })}>
            <Button type="primary" loading={busy} disabled={!selected.length || selected.length > 20}>发布到相册</Button>
          </Popconfirm>
        </Space>
      </div> : null}>
      <p className={styles.description}>选择网盘里的照片，发布到你的博客。未发布的照片仅自己可见；从博客删除照片时，也会删除网盘原图。</p>
      {error && <Alert type="error" showIcon message={error} />}
      {status && !status.configured && <Alert type="info" showIcon message="网盘尚未连接" description="请完成后端应用配置，再连接百度网盘。" />}
      <div className={styles.toolbar}>
        <span className={`${styles.connection} ${status?.connected ? styles.connected : ''}`}><span className={styles.dot} />{status?.connected ? '已连接百度网盘' : '尚未连接'}</span>
        <Space wrap size={4}>
          <Button type={status?.connected ? 'text' : 'primary'} disabled={!status?.configured} loading={busy} onClick={() => void run(async () => { const data = await request<{ url: string }>('/authorize', 'POST'); window.location.assign(data.url) })}>{status?.connected ? '重新授权' : '连接百度网盘'}</Button>
          <Button type="text" icon={<ReloadOutlined />} disabled={busy} onClick={() => void run(refresh)}>刷新</Button>
          {status?.connected && <Popconfirm title="断开百度网盘？" description="已发布的网盘照片将暂时无法加载，网盘原图不受影响。" onConfirm={() => run(async () => { await request('/connection', 'DELETE'); clearImageCache(); setPreview(undefined); await refresh() })}><Button type="text" danger disabled={busy}>断开</Button></Popconfirm>}
        </Space>
      </div>
      {listing && status && <>
        <div className={styles.pathbar}>
          <Button type="text" size="small" aria-label="返回上一级目录" icon={<ArrowLeftOutlined />} disabled={busy || listing.path === status.root} onClick={() => void run(() => browse(listing.path.slice(0, listing.path.lastIndexOf('/')) || '/'))} />
          <FolderOutlined /><span className={styles.path} title={listing.path}>{listing.path}</span>
        </div>
        <Table<File> className={styles.table} size="small" loading={busy} dataSource={listing.items} rowKey="id" pagination={false} tableLayout="fixed" scroll={{ y: 320 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="此页没有可展示的照片" /> }}
          rowSelection={{ columnWidth: 42, selectedRowKeys: selected, onChange: keys => { if (keys.length > 20) message.info('每次最多选择 20 张照片'); setSelected(keys.slice(0, 20).map(String)) }, getCheckboxProps: file => ({ disabled: busy || file.folder || file.size > 20 * 1024 * 1024 || (selected.length >= 20 && !selected.includes(file.id)) }) }}
          columns={[
            { title: '照片 / 文件夹', dataIndex: 'name', ellipsis: true, render: (_, file) => file.folder ? <button className={styles.folder} disabled={busy} onClick={() => void run(() => browse(file.path))}><span className={styles.filename}><FolderOutlined /><span title={file.name}>{file.name}</span></span></button> : <div className={styles.filename}><div role="button" tabIndex={0} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setPreview(file) } }} className={styles.thumbnail} aria-label={`预览照片：${file.name}`} onClick={() => { if (!busy && file.size <= 20 * 1024 * 1024) setPreview(file) }}><AlbumImage compact preview={false} contentType={/\.(heic|heif)$/i.test(file.name) ? 'image/heic' : undefined} src={`/api/album/baidu/media/${encodeURIComponent(file.id)}?variant=thumb`} alt={file.name} /></div><span title={file.name}>{file.name}</span></div> },
            { title: '大小', width: 96, responsive: ['sm'], render: (_, file) => file.folder ? '—' : `${(file.size / 1024 / 1024).toFixed(1)} MB` },
            { title: '操作', width: 76, render: (_, file) => !file.folder && <Button type="link" size="small" disabled={busy || file.size > 20 * 1024 * 1024} onClick={() => setPreview(file)}>预览</Button> },
          ]} />
      </>}
    </Modal>
    <Modal rootClassName={styles.dialogRoot} className={styles.previewDialog} title={<div className={styles.previewTitle} title={preview?.name}>{preview?.name || '照片预览'}</div>}
      open={open && Boolean(preview)} onCancel={() => setPreview(undefined)} centered width={1000} zIndex={1100} destroyOnClose
      footer={<div className={styles.previewFooter}>
        <Space><Button icon={<LeftOutlined />} disabled={previewIndex <= 0} onClick={() => setPreview(previewable[previewIndex - 1])}>上一张</Button><span className={styles.previewMeta}>{previewIndex + 1} / {previewable.length}</span><Button icon={<RightOutlined />} disabled={previewIndex >= previewable.length - 1} onClick={() => setPreview(previewable[previewIndex + 1])}>下一张</Button></Space>
        <Space><span className={styles.previewMeta}>{preview ? `${(preview.size / 1024 / 1024).toFixed(1)} MB` : ''}</span><Button type={preview && selected.includes(preview.id) ? 'default' : 'primary'} disabled={!preview || (!selected.includes(preview.id) && selected.length >= 20)} onClick={togglePhoto}>{preview && selected.includes(preview.id) ? '取消选择' : '选择这张'}</Button></Space>
      </div>}>
      <div className={styles.previewStage}>
        {preview && <AlbumImage key={preview.id} eager fit="contain" preview={false} contentType={/\.(heic|heif)$/i.test(preview.name) ? 'image/heic' : undefined} src={`/api/album/baidu/media/${encodeURIComponent(preview.id)}`} alt={preview.name} />}
      </div>
    </Modal>
  </>
}
