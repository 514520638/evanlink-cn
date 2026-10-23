import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Collapse, Drawer, Input, Popconfirm, Select, Spin, Tag } from 'antd'
import { CommentOutlined, LoginOutlined, LogoutOutlined, PlusOutlined, ReloadOutlined, SendOutlined, StopOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { agentApi, AgentApiError, type AgentEvent, type AgentRole, type ApprovalDecision, type PendingApproval } from '../../api/agent'
import { useLanguage } from '../../hooks/useLanguage'
import styles from './AgentChat.module.css'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
type Draft = { content: string; visibility: string; status: string; reject: boolean; extras: Record<string, string> }
const STORAGE = 'evan-agent-conversation'
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const savedId = () => { try { return sessionStorage.getItem(STORAGE) } catch { return null } }
const rememberId = (value: string) => { try { sessionStorage.setItem(STORAGE, value) } catch { /* 无存储权限仍可聊天 */ } }
const combined = (draft: Draft) => [draft.content, ...Object.entries(draft.extras).filter(([, value]) => value.trim()).map(([label, value]) => `${label}：${value.trim()}`)].join('\n')

/** 全站聊天抽屉：状态属于组件，凭据仅由服务端 HttpOnly Cookie 管理。 */
export default function AgentChat() {
  const { language } = useLanguage()
  const tr = (zh: string, en: string) => language === 'zh' ? zh : en
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [role, setRole] = useState<AgentRole>('guest')
  const [conversationId, setConversationId] = useState('')
  const [conversations, setConversations] = useState<{ conversation_id: string; message_count: number }[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<PendingApproval | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const alive = useRef(true)
  const scroll = useRef<HTMLDivElement>(null)
  const follow = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; abort.current?.abort() }
  }, [])
  useEffect(() => {
    if (open && follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight
  }, [messages, pending, open])

  function setReview(value: PendingApproval | null) {
    setPending(value)
    setConfirmed(false)
    setDrafts(value?.action_requests.map(action => ({
      content: action.args.content,
      visibility: action.args.visibility ?? (action.name === 'update_personal_memory' ? 'keep' : 'public'),
      status: action.args.status ?? (action.name === 'update_personal_memory' ? 'keep' : 'published'),
      reject: false, extras: {},
    })) ?? [])
  }
  function fail(reason: unknown) {
    if (!alive.current) return
    if (reason instanceof AgentApiError && (reason.status === 401 || reason.status === 403)) {
      setReady(false); setMessages([]); setReview(null); setConversations([]); setConversationId(''); setRole('guest')
    }
    setError(reason instanceof Error ? reason.message : tr('请求失败，请重试。', 'Request failed. Please retry.'))
  }
  async function loadConversation(value: string) {
    const result = await agentApi.conversation(value)
    if (!alive.current) return
    setConversationId(value); rememberId(value)
    const restored = result.messages.map(message => ({ ...message, id: id() }))
    if (result.pending?.user_message) restored.push({ id: `pending-${result.pending.approval_id}`, role: 'user', content: result.pending.user_message })
    setMessages(restored)
    setReview(result.pending)
    follow.current = true
  }
  async function listAndLoad(preferred?: string | null) {
    let list = (await agentApi.conversations()).items
    let selected = list.some(item => item.conversation_id === preferred) ? preferred! : list[0]?.conversation_id
    if (!selected) {
      selected = (await agentApi.createConversation()).conversation_id
      list = (await agentApi.conversations()).items
    }
    if (!alive.current) return
    setConversations(list)
    await loadConversation(selected)
    if (alive.current) setReady(true)
  }
  async function operation(work: () => Promise<void>) {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); setNotice('')
    try { await work() } catch (reason) { fail(reason) }
    finally { busyRef.current = false; if (alive.current) setBusy(false) }
  }
  const initialize = () => operation(async () => {
    setReady(false); setMessages([]); setReview(null); setConversationId('')
    let identity
    try { identity = await agentApi.me() }
    catch (reason) {
      if (reason instanceof AgentApiError && reason.status === 401) identity = await agentApi.guest()
      else throw reason
    }
    if (!alive.current) return
    setRole(identity.role)
    await listAndLoad(savedId())
  })
  const launch = () => { setOpen(true); if (!ready) void initialize() }

  async function runStream(run: (onEvent: (event: AgentEvent) => void, signal: AbortSignal) => Promise<void>) {
    const controller = new AbortController()
    abort.current = controller
    let assistantId = ''
    const onEvent = (event: AgentEvent) => {
      if (!alive.current) return
      if (event.type === 'message_start') {
        const nextId = id()
        assistantId = nextId
        setMessages(previous => [...previous, { id: nextId, role: 'assistant', content: '' }])
      } else if (event.type === 'delta') {
        const target = assistantId
        setMessages(previous => previous.map(message => message.id === target ? { ...message, content: message.content + event.text } : message))
      } else if (event.type === 'done') {
        const target = assistantId
        setMessages(previous => target ? previous.map(message => message.id === target ? { ...message, content: event.answer } : message)
          : [...previous, { id: id(), role: 'assistant', content: event.answer }])
        setReview(null)
      } else if (event.type === 'approval_required') {
        setReview(event)
      } else if (event.type === 'error') {
        throw new AgentApiError(event.code === 'unauthorized' ? 401 : event.code === 'conflict' ? 409 : 503, event.message)
      }
    }
    try {
      await run(onEvent, controller.signal)
      await loadConversation(conversationId)
      const list = await agentApi.conversations()
      if (alive.current) setConversations(list.items)
    } catch (reason) {
      if (controller.signal.aborted) {
        if (alive.current) setNotice(tr('已停止接收。已确认的写入可能已完成，请刷新聊天核对。', 'Stopped receiving. Approved writes may have completed; refresh to check.'))
      } else throw reason
    } finally { abort.current = null }
  }
  function send(value = text) {
    if (!value.trim() || !ready || busyRef.current || pending) return
    void operation(async () => {
      setText(''); follow.current = true
      setMessages(previous => [...previous, { id: id(), role: 'user', content: value.trim() }])
      await runStream((onEvent, signal) => agentApi.send(conversationId, value.trim(), onEvent, signal))
    })
  }
  function changeDraft(index: number, patch: Partial<Draft>) {
    setConfirmed(false)
    setDrafts(previous => previous.map((item, i) => i === index ? { ...item, ...patch } : item))
  }
  const approve = () => {
    if (!pending || !confirmed) return
    void operation(async () => {
      const decisions: ApprovalDecision[] = drafts.map(draft => ({
        type: draft.reject ? 'reject' : 'edit',
        ...(draft.reject ? {} : { changes: {
          content: combined(draft),
          ...(draft.visibility === 'keep' ? {} : { visibility: draft.visibility as 'public' | 'private' }),
          ...(draft.status === 'keep' ? {} : { status: draft.status as 'draft' | 'published' | 'archived' }),
        } }),
      }))
      await runStream((onEvent, signal) => agentApi.review(conversationId, pending.approval_id, decisions, onEvent, signal))
    })
  }

  return <>
    <Button className={styles.launcher} type="primary" size="large" icon={<CommentOutlined />} onClick={launch} aria-label={tr('打开 AI 聊天', 'Open AI chat')}>
      {tr('和我聊聊', 'Chat with me')}
    </Button>
    <Drawer open={open} onClose={() => { setOpen(false); setLoginOpen(false); setPassword('') }} width="min(520px, 100vw)" title={<div className={styles.heading}>
      <span>{role === 'owner' ? tr('小磊 · 私人助手', 'Xiaolei · Assistant') : tr('Evan · AI 数字分身', 'Evan · AI representative')}</span>
      <Tag color={role === 'owner' ? 'green' : 'blue'}>{role === 'owner' ? tr('本人', 'Owner') : tr('访客', 'Guest')}</Tag>
    </div>} styles={{ body: { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
      <div className={styles.toolbar}>
        <Select aria-label={tr('选择聊天', 'Select conversation')} className={styles.chatSelect} value={conversationId || undefined} disabled={!ready || busy}
          placeholder={tr('选择聊天', 'Choose conversation')} onChange={value => void operation(() => loadConversation(value))}
          options={conversations.map((item, index) => ({ value: item.conversation_id, label: `${tr('聊天', 'Chat')} ${index + 1} · ${item.message_count} ${tr('条消息', 'messages')}` }))} />
        <Button icon={<PlusOutlined />} disabled={!ready || busy} title={tr('新聊天', 'New chat')} aria-label={tr('新聊天', 'New chat')}
          onClick={() => void operation(async () => { const next = await agentApi.createConversation(); await listAndLoad(next.conversation_id) })} />
        <Button icon={<ReloadOutlined />} disabled={busy} title={tr('刷新聊天', 'Refresh')} aria-label={tr('刷新聊天', 'Refresh')}
          onClick={() => ready ? void operation(() => listAndLoad(conversationId)) : void initialize()} />
        {role === 'owner' ? <Button icon={<LogoutOutlined />} disabled={busy} onClick={() => void operation(async () => {
          await agentApi.logout(); setMessages([]); setReview(null); setReady(false); setRole('guest'); setConversationId(''); setConversations([])
          await agentApi.guest(); await listAndLoad()
        })}>{tr('退出', 'Log out')}</Button> : <Button icon={<LoginOutlined />} disabled={busy} onClick={() => setLoginOpen(!loginOpen)}>{tr('本人登录', 'Owner login')}</Button>}
      </div>
      {loginOpen && <form className={styles.login} onSubmit={event => { event.preventDefault(); void operation(async () => {
        try {
          const result = await agentApi.login(password)
          setReady(false); setRole(result.role); setMessages([]); setReview(null); setConversations([]); setConversationId(''); setLoginOpen(false)
          await listAndLoad()
        } finally { setPassword('') }
      }) }}>
        <label htmlFor="agent-password">{tr('Agent 本人密码', 'Agent owner password')}</label>
        <div className={styles.row}><Input.Password id="agent-password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
          <Button htmlType="submit" type="primary" disabled={!password || busy}>{tr('登录', 'Log in')}</Button></div>
        <p className={styles.muted}>{tr('使用 Agent 设置的本人密码，不是博客后台密码。', 'Use your Agent password, not the blog admin password.')}</p>
      </form>}
      <div className={styles.alerts}>
        {error && <Alert type="error" showIcon message={error} action={<Button size="small" disabled={busy} onClick={() => void initialize()}>{tr('重新连接', 'Reconnect')}</Button>} />}
        {notice && <Alert type="info" showIcon message={notice} />}
      </div>
      <div className={styles.timeline} ref={scroll} onScroll={event => { const target = event.currentTarget; follow.current = target.scrollHeight - target.scrollTop - target.clientHeight < 90 }}>
        {!ready && busy && <div className={styles.empty}><Spin /><p>{tr('正在连接…', 'Connecting…')}</p></div>}
        {ready && messages.length === 0 && !pending && <div className={styles.empty}>
          <CommentOutlined className={styles.emptyIcon} />
          <h2>{role === 'owner' ? tr('小磊在这里', 'Xiaolei is here') : tr('从一个问题开始', 'Start with a question')}</h2>
          <p>{role === 'owner' ? tr('聊聊近况，或告诉我你想记住的事情。保存前会请你确认。', 'Tell me what you want to remember. You will review it before saving.') : tr('我是作者的 AI 数字分身，可以根据已公开的资料介绍经历、项目和兴趣。', 'I am the author’s AI representative. Ask about publicly shared experience, projects and interests.')}</p>
          <div className={styles.suggestions}>{(role === 'owner' ? ['小磊，记住，我在北京工作', '查看我的个人资料'] : ['你叫什么名字？', '介绍一下你的项目经历', '我想看看你的简历']).map(question => <Button key={question} onClick={() => send(question)} disabled={busy}>{question}</Button>)}</div>
        </div>}
        <div role="log" aria-label={tr('聊天记录', 'Conversation')} aria-live="off">
          {messages.map(message => <article key={message.id} className={`${styles.message} ${message.role === 'user' ? styles.user : styles.assistant}`}>
            <div className={styles.speaker}>{message.role === 'user' ? tr('你', 'You') : role === 'owner' ? '小磊' : 'Evan · AI'}</div>
            <div className={styles.markdown}>{message.content ? <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{ a: props => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a> }}>{message.content}</ReactMarkdown> : <span className={styles.muted}>{tr('正在组织回答…', 'Preparing a reply…')}</span>}</div>
          </article>)}
        </div>
        {busy && <p className={styles.muted} role="status">{tr('正在处理…', 'Working…')}</p>}
        {pending && role === 'owner' && <section className={styles.review} aria-label={tr('长期记忆审批', 'Memory review')}>
          <h2>{tr('确认这次记忆', 'Review this memory')}</h2>
          <p className={styles.muted}>{tr('资料尚未写入。补充内容并核对公开范围后，再确认保存。', 'Nothing has been saved yet. Review the content and visibility before confirming.')}</p>
          {pending.action_requests.map((action, index) => {
            const draft = drafts[index]
            if (!draft) return null
            return <fieldset key={`${pending.approval_id}-${index}`} className={styles.reviewItem} disabled={busy}>
              <legend>{action.name === 'save_personal_memory' ? tr('新增资料', 'New memory') : tr('更新资料', 'Update memory')} {pending.action_requests.length > 1 ? index + 1 : ''}</legend>
              {action.args.entry_id && <p className={styles.recordId}>ID: {action.args.entry_id}</p>}
              <label htmlFor={`memory-content-${index}`}>{tr('拟保存内容', 'Proposed content')}</label>
              <Input.TextArea id={`memory-content-${index}`} autoSize={{ minRows: 3, maxRows: 9 }} maxLength={16000} value={draft.content} disabled={busy || draft.reject} onChange={event => changeDraft(index, { content: event.target.value })} />
              <Collapse ghost className={styles.extraFields} items={[{ key: 'extras', label: tr('补充信息（可选）', 'Additional details (optional)'), children: <div className={styles.fieldGrid}>
                {['公司', '职位', '行业', '薪酬', '待遇', '其他补充'].map((label, fieldIndex) => <label key={label}>{tr(label, ['Company', 'Role', 'Industry', 'Salary', 'Benefits', 'Other details'][fieldIndex])}
                  <Input value={draft.extras[label] ?? ''} maxLength={500} disabled={busy || draft.reject} onChange={event => changeDraft(index, { extras: { ...draft.extras, [label]: event.target.value } })} /></label>)}
              </div> }]} />
              <div className={styles.fieldGrid}>
                <label>{tr('公开范围', 'Visibility')}<Select aria-label={tr('公开范围', 'Visibility')} value={draft.visibility} disabled={busy || draft.reject} onChange={value => changeDraft(index, { visibility: value })}
                  options={[...(action.name === 'update_personal_memory' ? [{ value: 'keep', label: tr('保留原设置', 'Keep current') }] : []), { value: 'public', label: tr('公开', 'Public') }, { value: 'private', label: tr('仅本人', 'Private') }]} /></label>
                <label>{tr('发布状态', 'Publication')}<Select aria-label={tr('发布状态', 'Publication')} value={draft.status} disabled={busy || draft.reject} onChange={value => changeDraft(index, { status: value })}
                  options={[...(action.name === 'update_personal_memory' ? [{ value: 'keep', label: tr('保留原设置', 'Keep current') }] : []), { value: 'published', label: tr('已发布 · 可检索', 'Published') }, { value: 'draft', label: tr('草稿', 'Draft') }, { value: 'archived', label: tr('归档', 'Archived') }]} /></label>
              </div>
              {Object.values(draft.extras).some(value => value.trim()) && <details className={styles.preview}><summary>{tr('查看完整保存内容', 'Preview complete content')}</summary><pre>{combined(draft)}</pre></details>}
              {draft.visibility === 'public' && draft.status === 'published' && !draft.reject && <p className={styles.publicNotice}>{tr('整条资料将对访客可查询，包括你补充的薪酬或待遇。', 'Visitors can query the entire record, including any salary or benefits you add.')}</p>}
              <Checkbox checked={draft.reject} disabled={busy} onChange={event => changeDraft(index, { reject: event.target.checked })}>{tr('拒绝这条写入', 'Reject this item')}</Checkbox>
            </fieldset>
          })}
          <Checkbox checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)}>{tr('我已核对内容、公开范围和发布状态', 'I have reviewed the content, visibility and publication status')}</Checkbox>
          <div className={styles.reviewActions}>
            <Button disabled={busy} onClick={() => void operation(async () => { await agentApi.cancelReview(conversationId, pending.approval_id); await loadConversation(conversationId); setNotice(tr('已取消本次待审批写入。', 'Pending changes cancelled.')) })}>{tr('取消本次写入', 'Cancel changes')}</Button>
            <Button type="primary" loading={busy} disabled={!confirmed || drafts.some(draft => !draft.reject && (!draft.content.trim() || combined(draft).length > 20000))} onClick={approve}>{tr('确认处理', 'Confirm decisions')}</Button>
          </div>
        </section>}
      </div>
      <div className={styles.composer}>
        <Input.TextArea aria-label={tr('输入消息', 'Message')} placeholder={pending ? tr('请先处理待确认事项', 'Please review the pending changes') : tr('问问我的经历、项目，或聊点别的…', 'Ask about my experience, projects, or anything else…')}
          autoSize={{ minRows: 2, maxRows: 5 }} maxLength={12000} value={text} disabled={!ready || busy || !!pending} onChange={event => setText(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); send() } }} />
        <div className={styles.composerFooter}>
          <span className={styles.muted}>{tr('Enter 发送 · Shift+Enter 换行', 'Enter to send · Shift+Enter for a new line')}</span>
          {busy && abort.current ? <Button icon={<StopOutlined />} onClick={() => abort.current?.abort()}>{tr('停止接收', 'Stop')}</Button>
            : <Button type="primary" icon={<SendOutlined />} disabled={!ready || busy || !!pending || !text.trim()} onClick={() => send()}>{tr('发送', 'Send')}</Button>}
        </div>
        {ready && <Popconfirm title={tr('清空当前聊天及待确认事项？', 'Clear this conversation and pending changes?')} onConfirm={() => operation(async () => { await agentApi.clear(conversationId); await listAndLoad(conversationId) })} disabled={busy}>
          <Button size="small" type="text" disabled={busy}>{tr('清空当前聊天', 'Clear conversation')}</Button>
        </Popconfirm>}
      </div>
    </Drawer>
  </>
}
