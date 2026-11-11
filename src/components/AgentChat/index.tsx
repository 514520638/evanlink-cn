import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Collapse, Drawer, Input, Popconfirm, Select, Spin, Tag } from 'antd'
import { PictureOutlined, EditOutlined, DeleteOutlined, ControlOutlined, GlobalOutlined, ArrowLeftOutlined, CommentOutlined, LoginOutlined, LogoutOutlined, PlusOutlined, ReloadOutlined, SendOutlined, StopOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { agentApi, AgentApiError, type AgentEvent, type AgentRole, type PendingApproval } from '../../api/agent'
import { useLanguage } from '../../hooks/useLanguage'
import styles from './AgentChat.module.css'
import { combined, draftsFromPending, toDecisions, type Draft } from './approval'
import { revealStream } from './revealStream'
import { prepareImage, ChatImage, UserContent } from './images'
import KnowledgePanel from './KnowledgePanel'

type Message = { id: string; role: 'user' | 'assistant'; content: string; deltaEnds?: number[] }
const STORAGE = 'evan-agent-conversation'
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const savedId = () => { try { return sessionStorage.getItem(STORAGE) } catch { return null } }
const rememberId = (value: string) => { try { sessionStorage.setItem(STORAGE, value) } catch { /* 无存储权限仍可聊天 */ } }

/** 用折起的蓝色信笺标记数字分身；小尺寸用于回复签名。 */
function SignalMark() {
  return <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <path d="M7 32 72 13 53 68 33 50 23 60 21 42Z" fill="#187AE2" />
    <path d="M7 32 72 13 21 42Z" fill="#80C7FF" />
    <path d="m21 42 51-29-39 37-10 10Z" fill="#09549F" />
    <path d="m33 50 39-37-19 55Z" fill="#3196F3" />
  </svg>
}

/** 全站聊天抽屉：状态属于组件，凭据仅由服务端 HttpOnly Cookie 管理。 */
export default function AgentChat({ standalone = false }: { standalone?: boolean }) {
  const { language } = useLanguage()
  const tr = (zh: string, en: string) => language === 'zh' ? zh : en
  const [open, setOpen] = useState(standalone)
  const [knowledgeOpen, setKnowledgeOpen] = useState(false)
  const knowledgeExpired = useCallback(() => {
    setKnowledgeOpen(false); setRole('guest'); setReady(false)
    setMessages([]); setPending(null); setDrafts([])
    setError('本人登录已失效，请重新登录后管理资料。')
  }, [])
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'searching' | 'writing' | 'analyzing' | 'generating'>('idle')
  const [writingId, setWritingId] = useState('')
  const busyRef = useRef(false)
  const [role, setRole] = useState<AgentRole>('guest')
  const [conversationId, setConversationId] = useState('')
  const [conversations, setConversations] = useState<{ conversation_id: string; message_count: number; title?: string | null }[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [attachment, setAttachment] = useState<{ blob: Blob; url: string } | null>(null)
  const [preparingImage, setPreparingImage] = useState(false)
  const imageEpoch = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => () => { if (attachment) URL.revokeObjectURL(attachment.url) }, [attachment])
  useEffect(() => { imageEpoch.current++; setAttachment(null) }, [conversationId, role])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState<PendingApproval | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [draftDirty, setDraftDirty] = useState(false)
  const [serverRunning, setServerRunning] = useState(false)
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
  }, [messages, pending, open, phase])

  useEffect(() => {
    if (!draftDirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [draftDirty])
  useEffect(() => {
    if (!open || !serverRunning || busy || !conversationId) return
    let active = true
    let count = 0
    const timer = window.setInterval(() => {
      if (++count > 30) { window.clearInterval(timer); return }
      void agentApi.conversation(conversationId).then(result => {
        if (!active) return
        if (!result.running) { window.clearInterval(timer); void loadConversation(conversationId).catch(fail) }
      }).catch(reason => { if (active) { window.clearInterval(timer); fail(reason) } })
    }, 1500)
    return () => { active = false; window.clearInterval(timer) }
  }, [open, serverRunning, busy, conversationId])

  function setReview(value: PendingApproval | null) {
    setPending(value)
    setConfirmed(false)
    setDrafts(draftsFromPending(value))
    setDraftDirty(false)
  }
  function fail(reason: unknown) {
    if (!alive.current) return
    if (reason instanceof AgentApiError && (reason.status === 401 || reason.status === 403)) {
      setServerRunning(false); setReady(false); setMessages([]); setReview(null); setConversations([]); setConversationId(''); setRole('guest')
    }
    setError(reason instanceof Error ? reason.message : tr('请求失败，请重试。', 'Request failed. Please retry.'))
  }
  async function loadConversation(value: string) {
    const result = await agentApi.conversation(value)
    if (!alive.current) return
    setConversationId(value); rememberId(value)
    const restored = result.messages.filter(message => message.content || message.role === 'user').map(message => ({ ...message, id: id() }))
    if (result.pending?.user_message) restored.push({ id: `pending-${result.pending.approval_id}`, role: 'user', content: result.pending.user_message })
    setMessages(restored)
    setReview(result.pending)
    setServerRunning(result.running)
    if (result.operation?.writes.length) {
      setNotice(tr('最近一次执行的数据库回执：', 'Latest database receipt: ') + result.operation.writes.map(item => `${item.id} · ${item.visibility}/${item.publication_status}`).join('；'))
    } else if (result.running) {
      setNotice(tr('服务端仍在处理上一轮，正在核对状态，请勿重复提交。', 'The previous request is still running. Checking its status; do not resubmit.'))
    } else if (result.operation?.status === 'interrupted') {
      setNotice(tr('上一轮已中断，未收到写入回执；如涉及写入，请核对个人资料后再重试。', 'The previous request was interrupted. Check your records before retrying a write.'))
    }
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
    setPhase('waiting'); setWritingId('')
    let assistantId = ''
    const onEvent = (event: AgentEvent) => {
      if (!alive.current) return
      if (event.type === 'image_status') {
        setPhase(event.action === 'generate_image' ? 'generating' : 'analyzing')
      } else if (event.type === 'search_status') {
        setPhase('searching')
      } else if (event.type === 'message_start') {
        setNotice('')
        const nextId = id()
        assistantId = nextId
        setWritingId(nextId)
        setMessages(previous => [...previous, { id: nextId, role: 'assistant', content: '' }])
      } else if (event.type === 'delta') {
        setPhase('writing')
        const target = assistantId
        setMessages(previous => previous.map(message => message.id === target ? { ...message, content: message.content + event.text, deltaEnds: [...(message.deltaEnds || []), message.content.length + event.text.length] } : message))
      } else if (event.type === 'done') {
        setPhase('idle')
        setNotice('')
        const target = assistantId
        setMessages(previous => target ? previous.map(message => message.id === target ? { ...message, content: event.answer, deltaEnds: undefined } : message)
          : [...previous, { id: id(), role: 'assistant', content: event.answer }])
        setReview(null)
      } else if (event.type === 'approval_required') {
        setPhase('idle'); setReview(event)
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
      // 请求响应丢失不等于写入失败。只读刷新服务端状态，不自动重发消息或审批。
      if (!alive.current) return
      if (reason instanceof AgentApiError && reason.status === 401) throw reason
      try { await loadConversation(conversationId) }
      catch (recoveryError) {
        if (recoveryError instanceof AgentApiError && (recoveryError.status === 401 || recoveryError.status === 403)) throw recoveryError
        setNotice(tr('暂时无法核对服务端状态，请联网后刷新，勿重复提交写入。', 'Cannot check server state. Reconnect and refresh before submitting again.'))
      }
      if (!controller.signal.aborted) throw reason
    } finally {
      abort.current = null
      if (alive.current) { setPhase('idle'); setWritingId('') }
    }
  }
  function send(value = text) {
    if ((!value.trim() && !attachment) || !ready || busyRef.current || serverRunning || pending || preparingImage) return
    void operation(async () => {
      const picture = attachment ? await agentApi.uploadImage(conversationId, attachment.blob) : null
      const question = value.trim() || '请描述并分析这张图片。'
      const shown = question + (picture ? '\n\n![上传的图片](' + picture.url + ')' : '')
      setText(''); setAttachment(null); follow.current = true
      setMessages(previous => [...previous, { id: id(), role: 'user', content: shown }])
      await runStream((onEvent, signal) => agentApi.send(conversationId, question, onEvent, signal, picture?.id))
    })
  }
  function changeDraft(index: number, patch: Partial<Draft>) {
    setConfirmed(false)
    setDraftDirty(true)
    setDrafts(previous => previous.map((item, i) => i === index ? { ...item, ...patch } : item))
  }
  const approve = () => {
    if (!pending || !confirmed) return
    void operation(async () => {
      const decisions = toDecisions(drafts)
      await runStream((onEvent, signal) => agentApi.review(conversationId, pending.approval_id, decisions, onEvent, signal))
    })
  }

  const launcherRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (standalone) return
    const viewport = window.visualViewport
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const button = launcherRef.current
        if (!button) return
        button.style.setProperty('--launcher-right', Math.max(0, document.documentElement.clientWidth - ((viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth))) + 'px')
        button.style.setProperty('--launcher-bottom', Math.max(0, window.innerHeight - ((viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight))) + 'px')
      })
    }
    update()
    viewport?.addEventListener('resize', update)
    viewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    window.addEventListener('pageshow', update)
    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener('resize', update)
      viewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('pageshow', update)
    }
  }, [standalone])
  const pageRef = useRef<HTMLElement>(null)
  const firstInitialize = useRef(initialize)
  useEffect(() => {
    if (!standalone) return
    void firstInitialize.current()
    const previousTitle = document.title
    document.title = 'Evan · Agent'
    const viewport = window.visualViewport
    document.documentElement.classList.add(styles.viewportLock)
    const resize = () => {
      const page = pageRef.current
      if (!page) return
      page.style.setProperty('--chat-height', (viewport?.height ?? window.innerHeight) + 'px')
      page.style.setProperty('--chat-top', (viewport?.offsetTop ?? 0) + 'px')
      if (follow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight
    }
    resize()
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', resize)
    window.addEventListener('resize', resize)
    return () => {
      viewport?.removeEventListener('resize', resize)
      viewport?.removeEventListener('scroll', resize)
      window.removeEventListener('resize', resize)
      document.documentElement.classList.remove(styles.viewportLock)
      document.title = previousTitle
    }
  }, [standalone])

  const closeManager = () => { setControlsOpen(false); setRenaming(false); setNameDraft(''); setLoginOpen(false); setPassword('') }
  const currentName = conversations.find(item => item.conversation_id === conversationId)?.title || tr('当前会话', 'Current chat')
  const manager = <Drawer open={controlsOpen} onClose={closeManager} title={tr('我的会话', 'Conversations')} placement="left" width="min(350px, 92vw)">
    <div className={styles.manager}>
      <Button type="primary" block icon={<PlusOutlined />} disabled={!ready || busy} onClick={() => void operation(async () => {
        const next = await agentApi.createConversation(); await listAndLoad(next.conversation_id); closeManager()
      })}>{tr('开始新会话', 'New conversation')}</Button>
      {error && <Alert type="error" showIcon message={error} />}
      <div className={styles.chatList}>
        {conversations.map((item, index) => <button type="button" key={item.conversation_id} disabled={busy}
          aria-current={item.conversation_id === conversationId ? 'true' : undefined}
          onClick={() => void operation(async () => { await loadConversation(item.conversation_id); closeManager() })}>
          <CommentOutlined /><span>{item.title || `${tr('聊天', 'Chat')} ${index + 1}`}</span><small>{item.message_count}</small>
        </button>)}
      </div>
      {ready && <section className={styles.manageActions}>
        <strong>{currentName}</strong>
        {renaming ? <form onSubmit={event => { event.preventDefault(); if (!nameDraft.trim()) return
          void operation(async () => {
            const title = nameDraft.trim()
            await agentApi.renameConversation(conversationId, title)
            setConversations(list => list.map(item => item.conversation_id === conversationId ? { ...item, title } : item))
            setRenaming(false)
          })
        }}><Input autoFocus aria-label={tr('会话名称','Conversation name')} maxLength={60} value={nameDraft} onChange={e => setNameDraft(e.target.value)} />
          <Button htmlType="submit" disabled={busy || !nameDraft.trim()}>{tr('保存','Save')}</Button><Button type="text" onClick={() => setRenaming(false)}>{tr('取消','Cancel')}</Button></form> :
          <Button type="text" icon={<EditOutlined />} disabled={busy} onClick={() => { setNameDraft(conversations.find(item => item.conversation_id === conversationId)?.title || ''); setRenaming(true) }}>{tr('重命名', 'Rename')}</Button>}
        <Popconfirm title={tr('清空这段聊天及待确认事项？','Clear this chat and pending approvals?')} okText={tr('清空','Clear')} cancelText={tr('取消','Cancel')} onConfirm={() => operation(async () => { await agentApi.clear(conversationId); await listAndLoad(conversationId); closeManager() })}>
          <Button type="text" danger icon={<DeleteOutlined />} disabled={busy || serverRunning}>{tr('清空内容','Clear messages')}</Button>
        </Popconfirm>
        <Popconfirm title={tr('永久删除这段会话？', 'Delete this conversation permanently?')}
          description={tr('聊天记录和待审批内容将被删除。个人知识库会保留。', 'Messages and pending approvals will be deleted. Your knowledge records are retained.')}
          okText={tr('删除会话', 'Delete conversation')} cancelText={tr('取消', 'Cancel')} okButtonProps={{ danger: true }}
          onConfirm={() => operation(async () => {
            await agentApi.deleteConversation(conversationId)
            setMessages([]); setReview(null); setConversationId(''); rememberId('')
            setRenaming(false); await listAndLoad()
          })}>
          <Button type="text" danger icon={<DeleteOutlined />} disabled={busy || serverRunning}>{tr('删除会话', 'Delete conversation')}</Button>
        </Popconfirm>
      </section>}
      <section className={styles.accountSection}><h3>{tr('账号与资料', 'Account & knowledge')}</h3><div className={styles.accountTools}>
        <Button icon={<ReloadOutlined />} disabled={busy} onClick={() => ready ? void operation(() => listAndLoad(conversationId)) : void initialize()}>{tr('刷新','Refresh')}</Button>
        {role === 'owner' && <Button disabled={busy || serverRunning} onClick={() => { closeManager(); setKnowledgeOpen(true) }}>{tr('知识库', 'Knowledge')}</Button>}
        {role === 'owner' ? <Button icon={<LogoutOutlined />} disabled={busy} onClick={() => void operation(async () => {
          await agentApi.logout(); closeManager(); setMessages([]); setReview(null); setReady(false); setRole('guest'); setConversationId(''); setConversations([])
          await agentApi.guest(); await listAndLoad()
        })}>{tr('退出', 'Log out')}</Button> : <Button icon={<LoginOutlined />} disabled={busy} onClick={() => { setLoginOpen(!loginOpen); setPassword('') }}>{tr('本人登录', 'Owner login')}</Button>}
      </div>
      {loginOpen && <form className={styles.accountLogin} onSubmit={event => { event.preventDefault(); void operation(async () => {
        try {
          const result = await agentApi.login(password)
          setReady(false); setRole(result.role); setMessages([]); setReview(null); setConversations([]); setConversationId(''); closeManager()
          await listAndLoad()
        } finally { setPassword('') }
      }) }}>
        <label htmlFor="agent-password">{tr('Agent 本人密码', 'Agent owner password')}</label>
        <div className={styles.row}><Input.Password id="agent-password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
          <Button htmlType="submit" type="primary" loading={busy} disabled={!password || busy}>{tr('登录', 'Log in')}</Button></div>
        <p className={styles.muted}>{tr('使用 Agent 设置的本人密码，不是博客后台密码。', 'Use your Agent password, not the blog admin password.')}</p>
      </form>}
      </section>
    </div>
  </Drawer>
  const chatBody = <>
      {manager}
      {!standalone && <button className={styles.chatSwitcher} onClick={() => setControlsOpen(true)}><ControlOutlined /><span>{currentName}</span>{tr('管理会话','Manage chats')}</button>}
      <div className={styles.alerts}>
        {error && <Alert type="error" showIcon message={error} action={<Button size="small" disabled={busy} onClick={() => void initialize()}>{tr('重新连接', 'Reconnect')}</Button>} />}
        {notice && <Alert type="info" showIcon message={notice} />}
      </div>
      <div className={styles.timeline} ref={scroll} onScroll={event => { const target = event.currentTarget; follow.current = target.scrollHeight - target.scrollTop - target.clientHeight < 90 }}>
        {!ready && busy && <div className={styles.empty}><Spin /><p>{tr('正在连接…', 'Connecting…')}</p></div>}
        {ready && messages.length === 0 && !pending && <div className={styles.empty}>
          <div className={styles.emblem}><svg className={styles.trail} viewBox="0 0 190 60" aria-hidden="true"><path d="M2 48C28 50 65 49 65 32C65 16 41 17 45 33C50 49 93 44 141 15" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" /></svg><SignalMark /></div>
          <h2>{role === 'owner' ? tr('你好，我是小磊', 'Hi, I’m Xiaolei') : tr('你好，我是 Evan。', 'Hi, I’m Evan.')}</h2>
          <p>{role === 'owner'
            ? tr('我是你的私人助手，可以帮你查找和整理个人资料。你想记住的事，我会在你确认后保存。', 'I’m your personal assistant. I can find and organize your records, and I’ll ask for your approval before saving a new memory.')
            : tr('我是 Evan 的 AI 数字分身。想了解我的经历、项目，或者聊聊工作之外的兴趣，都可以从这里开始。', 'I’m Evan’s AI representative. Ask about my work, the projects I’ve built, or what I enjoy outside of work.')}</p>
        </div>}
        <div role="log" aria-label={tr('聊天记录', 'Conversation')} aria-live="off">
          {messages.filter(message => message.content || message.role === 'user').map(message => <article key={message.id} className={`${styles.message} ${message.role === 'user' ? styles.user : styles.assistant} ${message.id === writingId && phase === 'writing' ? styles.writing : ''}`}>
            {message.role === 'assistant' && <div className={styles.speaker}><SignalMark />{role === 'owner' ? '小磊' : 'Evan · AI'}</div>}
            <div className={styles.markdown}>{message.role === 'user' ? <UserContent text={message.content} conversation={conversationId} /> : message.content ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={message.deltaEnds?.length && message.id === writingId && phase === 'writing' ? [[revealStream, message.deltaEnds]] : []} skipHtml components={{ img: props => <ChatImage src={props.src} alt={props.alt} conversation={conversationId} />, a: props => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a> }}>{message.content}</ReactMarkdown> : <span className={styles.muted}>{tr('正在组织回答…', 'Preparing a reply…')}</span>}</div>
          </article>)}
        </div>
        {(['waiting', 'searching', 'analyzing', 'generating'].includes(phase)) && <div className={styles.activity} role="status">
          {phase === 'searching' ? <span className={styles.scan} aria-hidden="true"><GlobalOutlined /></span>
            : <span className={styles.wave} aria-hidden="true"><i /><i /><i /><i /><i /></span>}
          {phase === 'generating' ? tr('正在生成图片…', 'Generating an image…') : phase === 'analyzing' ? tr('正在识别图片…', 'Reading the image…') : phase === 'searching' ? tr('正在联网查找资料', 'Searching the web') : tr('正在整理回答', 'Preparing a reply')}
        </div>}
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
          {draftDirty && <p className={styles.muted}>{tr('补充内容尚未暂存。暂存后刷新页面可恢复，仍需确认才会写入资料库。', 'Unsaved edits. Save a review draft to restore it after refresh; confirmation is still required.')}</p>}
          <div className={styles.reviewActions}>
            <Button disabled={busy || serverRunning || !draftDirty} onClick={() => void operation(async () => {
              await agentApi.saveReviewDraft(conversationId, pending.approval_id, toDecisions(drafts))
              setDraftDirty(false)
              setNotice(tr('审批草稿已暂存；尚未写入个人资料，刷新后可恢复。', 'Review draft saved. No personal record has been written; you can restore it after refresh.'))
            })}>{tr('暂存补充', 'Save review draft')}</Button>
            <Button disabled={busy} onClick={() => void operation(async () => { await agentApi.cancelReview(conversationId, pending.approval_id); await loadConversation(conversationId); setNotice(tr('已取消本次待审批写入。', 'Pending changes cancelled.')) })}>{tr('取消本次写入', 'Cancel changes')}</Button>
            <Button type="primary" loading={busy} disabled={serverRunning || !confirmed || drafts.some(draft => !draft.reject && (!draft.content.trim() || combined(draft).length > 20000))} onClick={approve}>{tr('确认处理', 'Confirm decisions')}</Button>
          </div>
        </section>}
      </div>
      <div className={styles.composer}>
        {attachment && <div className={styles.imagePreview}><img src={attachment.url} alt="待发送图片" /><Button disabled={busy} onClick={() => setAttachment(null)}>移除</Button></div>}
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''
          if (!file) return
          const epoch = imageEpoch.current
          setPreparingImage(true)
          try { const blob = await prepareImage(file); if (alive.current && imageEpoch.current === epoch) setAttachment({ blob, url: URL.createObjectURL(blob) }) }
          catch (reason) { setError(reason instanceof Error ? reason.message : '图片处理失败') }
          finally { setPreparingImage(false) }
        }} />
        <Input.TextArea aria-label={tr('输入消息', 'Message')} placeholder={pending ? tr('请先处理待确认事项', 'Please review the pending changes') : tr('问问我的经历、项目，或聊点别的…', 'Ask about my experience, projects, or anything else…')}
          autoSize={{ minRows: 1, maxRows: 5 }} maxLength={12000} value={text} disabled={!ready || busy || serverRunning || !!pending} onChange={event => setText(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && !window.matchMedia('(pointer: coarse)').matches && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); send() } }} />
        <div className={styles.composerFooter}><Button type="text" icon={<PictureOutlined />} aria-label="上传图片" title="上传图片" loading={preparingImage} disabled={!ready || busy || serverRunning || !!pending} onClick={() => fileInput.current?.click()} />
          <span className={styles.muted}><span className={styles.desktopHint}>{tr('Enter 发送 · Shift+Enter 换行', 'Enter to send · Shift+Enter for a new line')}</span><span className={styles.touchHint}>{tr('回车换行', 'Return for a new line')}</span></span>
          {busy && abort.current ? <Button className={styles.sendControl} aria-label={tr('停止接收', 'Stop response')} title={tr('停止接收', 'Stop response')} icon={<StopOutlined />} onClick={() => abort.current?.abort()} />
            : <Button className={styles.sendControl} aria-label={tr('发送', 'Send')} title={tr('发送', 'Send')} type="primary" icon={<SendOutlined />} disabled={!ready || busy || serverRunning || !!pending || preparingImage || (!text.trim() && !attachment)} onClick={() => send()} />}
        </div>

      </div>
  </>
  const knowledge = open && knowledgeOpen && role === 'owner' && <KnowledgePanel onClose={() => setKnowledgeOpen(false)} onExpired={knowledgeExpired} />
  if (standalone) return <main ref={pageRef} className={styles.page}>
    <div className={styles.pageInner}>
      <header className={styles.pageHeader}>
        <div className={styles.identity}><span className={styles.brandMark}><SignalMark /></span><div><h1>{currentName === tr('当前会话', 'Current chat') ? (role === 'owner' ? tr('小磊', 'Xiaolei') : 'Evan') : currentName}</h1>
          <span>{role === 'owner' ? tr('私人助手', 'Personal assistant') : tr('AI 数字分身', 'AI representative')}</span></div></div>
        <nav className={styles.pageNav}>
          <button type="button" aria-expanded={controlsOpen} onClick={() => setControlsOpen(!controlsOpen)}><ControlOutlined /> {tr('会话', 'Chat options')}</button>
          <a href="/"><ArrowLeftOutlined /> {tr('博客', 'Blog')}</a>
        </nav>
      </header>
      {chatBody}
    </div>
    {knowledge}
  </main>

  return <>
    {createPortal(<Button ref={launcherRef} className={styles.launcher} type="primary" size="large" icon={<CommentOutlined />} onClick={launch} aria-label={tr('打开 AI 聊天', 'Open AI chat')}>
      {tr('和我聊聊', 'Chat with me')}
    </Button>, document.body)}
    <Drawer push={false} rootClassName={styles.chatDrawer} open={open} onClose={() => { setOpen(false); setLoginOpen(false); setPassword('') }} width="min(520px, 100vw)" extra={<a href="/chat">{tr('全屏聊天', 'Full screen')}</a>} title={<div className={styles.heading}>
      <span>{role === 'owner' ? tr('小磊 · 私人助手', 'Xiaolei · Assistant') : tr('Evan · AI 数字分身', 'Evan · AI representative')}</span>
      <Tag color={role === 'owner' ? 'green' : 'blue'}>{role === 'owner' ? tr('本人', 'Owner') : tr('访客', 'Guest')}</Tag>
    </div>} styles={{ body: { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}>
      {chatBody}
    </Drawer>
    {knowledge}
  </>
}
