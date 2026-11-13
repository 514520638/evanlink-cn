import { useEffect, useState } from 'react'
import { Alert, Button, Drawer, Empty, List, Space, Spin, Typography } from 'antd'
interface Question { id: number; question: string; created_at: string }
export function GuestQuestions({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<Question[]>([])
  const [offset, setOffset] = useState(0)
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open) return
    const controller = new AbortController(); setBusy(true); setError('')
    fetch(`/agent-api/guest-questions?offset=${offset}&limit=30`, { credentials: 'include', headers: { 'X-Agent-Request': '1' }, signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.detail || '读取失败'); setItems(data.items); setMore(data.has_more) })
      .catch(e => { if (!controller.signal.aborted) { setItems([]); setError(e instanceof Error ? e.message : '读取失败') } })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [open, offset])
  return <Drawer title="访客提问" open={open} onClose={onClose} width="min(580px, 100vw)" destroyOnClose>
    <Typography.Paragraph type="secondary">按最新时间排列，仅管理员可见。记录保留半年，最多 20,000 条。</Typography.Paragraph>
    {error && <Alert type="error" message={error} showIcon />}
    <Spin spinning={busy}><List dataSource={items} locale={{ emptyText: <Empty description="暂无访客提问" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }} renderItem={item => <List.Item><div style={{ minWidth: 0 }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</Typography.Text><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.8, marginTop: 8 }}>{item.question}</p></div></List.Item>} /></Spin>
    <Space style={{ marginTop: 20 }}><Button disabled={busy || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 30))}>上一页</Button><span>第 {offset / 30 + 1} 页</span><Button disabled={busy || !more} onClick={() => setOffset(value => value + 30)}>下一页</Button></Space>
  </Drawer>
}
