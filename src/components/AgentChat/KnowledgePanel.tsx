import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Drawer, Empty, Form, Input, Popconfirm, Select, Space, Spin, Tag, Typography } from 'antd'
import { agentApi, AgentApiError, type ProfileEntry, type ProfileInput } from '../../api/agent'

/** 本人资料编辑入口：复用 Agent Cookie，每次请求由后端重新验证权限。 */
export default function KnowledgePanel({ onClose, onExpired }: { onClose: () => void; onExpired: () => void }) {
  const [items, setItems] = useState<ProfileEntry[]>([])
  const [offset, setOffset] = useState(0)
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<ProfileEntry | 'new' | null>(null)
  const [dirty, setDirty] = useState(false)
  const [form] = Form.useForm<ProfileInput>()
  const fail = useCallback((e: unknown) => {
    if (e instanceof AgentApiError && (e.status === 401 || e.status === 403)) { onExpired(); return }
    setError(e instanceof Error ? e.message : '操作失败，请重试。')
  }, [onExpired])
  const load = useCallback(async () => {
    setBusy(true); setError('')
    try { const data = await agentApi.profiles(offset); setItems(data.items); setMore(data.has_more) }
    catch (e) { fail(e) } finally { setBusy(false) }
  }, [offset, fail])
  useEffect(() => { void load() }, [load])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const leave = () => { if (!dirty || window.confirm('有未保存的修改，确定放弃吗？')) { if (editing) { setEditing(null); setDirty(false) } else onClose() } }
  const edit = (entry: ProfileEntry | 'new') => {
    setEditing(entry); setDirty(false); setError(''); setNotice('')
    form.setFieldsValue(entry === 'new' ? { content: '', category: '基本资料', visibility: 'public', status: 'published' } : entry)
  }
  const save = async (value: ProfileInput) => {
    setBusy(true); setError('')
    try {
      await agentApi.saveProfile(value, editing && editing !== 'new' ? editing.id : undefined)
      setEditing(null); setDirty(false); setNotice('资料已保存。公开且已发布的内容可供访客查询。')
      await load()
    } catch (e) { fail(e) } finally { setBusy(false) }
  }
  const remove = async (id: string) => {
    setBusy(true); setError('')
    try { await agentApi.deleteProfile(id); setNotice('资料已删除。'); await load() }
    catch (e) { fail(e) } finally { setBusy(false) }
  }
  return <Drawer open title={editing ? editing === 'new' ? '新增资料' : '编辑资料' : '知识库管理'} width="min(680px, 100vw)" onClose={leave} closable={!busy} maskClosable={!busy} keyboard={!busy}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Paragraph type="secondary">整理我的经历、项目和兴趣。只有「公开 · 已发布」的资料会用于访客回答。修改后，下次查询自动更新向量。</Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} action={<Button onClick={() => void load()} disabled={busy}>重试加载</Button>} />}
      {notice && <Alert type="success" showIcon message={notice} />}
      {editing ? <Form form={form} layout="vertical" onFinish={save} onValuesChange={() => setDirty(true)} disabled={busy}>
        <Form.Item name="category" label="分类" rules={[{ required: true, whitespace: true, message: '请填写分类' }]}><Input maxLength={100} placeholder="例如：工作经历、项目、教育经历" /></Form.Item>
        <Form.Item name="content" label="资料原文" rules={[{ required: true, whitespace: true, message: '请填写资料内容' }]}><Input.TextArea autoSize={{ minRows: 8, maxRows: 18 }} maxLength={20000} showCount placeholder="写下准确、完整的事实。一条资料聚焦一个主题。" /></Form.Item>
        <Form.Item name="visibility" label="公开范围"><Select options={[{ value: 'public', label: '公开' }, { value: 'private', label: '仅本人' }]} /></Form.Item>
        <Form.Item name="status" label="发布状态"><Select options={[{ value: 'published', label: '已发布' }, { value: 'draft', label: '草稿' }, { value: 'archived', label: '已归档' }]} /></Form.Item>
        <Space><Button type="primary" htmlType="submit" loading={busy}>确认保存</Button><Button onClick={leave} disabled={busy}>返回列表</Button></Space>
      </Form> : <>
        <Space wrap><Button type="primary" onClick={() => edit('new')} disabled={busy}>新增资料</Button><Button onClick={() => void load()} disabled={busy}>刷新</Button></Space>
        <Spin spinning={busy}>
          {!items.length ? <Empty description="暂无资料，可以新增你的第一条介绍" /> : items.map(entry => <section key={entry.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--border-color, #d9d9d9)' }}>
            <Space wrap><Typography.Text strong>{entry.category}</Typography.Text><Tag>{entry.visibility === 'public' ? '公开' : '仅本人'}</Tag><Tag>{({ published: '已发布', draft: '草稿', archived: '已归档' })[entry.status]}</Tag></Space>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: 12 }} ellipsis={{ rows: 5, expandable: true, symbol: '展开原文' }}>{entry.content}</Typography.Paragraph>
            <Typography.Paragraph type="secondary">更新于 {new Date(entry.updated_at).toLocaleString()} · {({ manual: '手动录入', conversation: '对话录入', import: '导入' })[entry.source]}</Typography.Paragraph>
            <Space wrap><Button onClick={() => edit(entry)} disabled={busy}>编辑 / 归档</Button><Popconfirm title="永久删除这条资料？" description="删除后无法恢复；如需保留，请编辑并设为归档。" okText="删除" cancelText="取消" onConfirm={() => remove(entry.id)}><Button danger disabled={busy}>删除</Button></Popconfirm></Space>
          </section>)}
        </Spin>
        <Space><Button disabled={busy || offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>上一页</Button><Typography.Text>第 {offset / 20 + 1} 页</Typography.Text><Button disabled={busy || !more} onClick={() => setOffset(offset + 20)}>下一页</Button></Space>
      </>}
    </Space>
  </Drawer>
}
