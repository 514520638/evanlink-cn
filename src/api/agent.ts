/** Agent API 客户端：凭据只走 HttpOnly Cookie，不使用博客管理员密码或 localStorage。 */
const BASE = '/agent-api'

export type AgentRole = 'guest' | 'owner'
export interface MemoryAction {
  name: 'save_personal_memory' | 'update_personal_memory'
  args: { content: string; entry_id?: string; category?: string; visibility?: 'public' | 'private'; status?: 'draft' | 'published' | 'archived' }
  description?: string
}
export interface PendingApproval {
  approval_id: string
  user_message?: string
  action_requests: MemoryAction[]
  review_configs: { action_name: string; allowed_decisions: string[] }[]
}
export type AgentEvent =
  | { type: 'message_start' }
  | { type: 'delta'; text: string }
  | { type: 'done'; answer: string }
  | ({ type: 'approval_required' } & PendingApproval)
  | { type: 'error'; code: string; message: string }

export interface ApprovalDecision {
  type: 'approve' | 'edit' | 'reject'
  changes?: { content?: string; category?: string; visibility?: 'public' | 'private'; status?: 'draft' | 'published' | 'archived' }
}
export interface Conversation {
  conversation_id: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  pending: PendingApproval | null
}

export class AgentApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'AgentApiError'
  }
}

async function request(path: string, method = 'GET', body?: unknown, signal?: AbortSignal) {
  const response = await fetch(BASE + path, {
    method, credentials: 'include', signal,
    headers: { 'X-Agent-Request': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new AgentApiError(response.status, typeof payload?.detail === 'string' ? payload.detail : `Agent 请求失败 (${response.status})`)
  }
  return response
}

/** fetch 读取 POST SSE；按空行分帧，支持中文 UTF-8 跨网络块以及 CRLF。 */
async function stream(path: string, body: unknown, onEvent: (event: AgentEvent) => void, signal?: AbortSignal) {
  const response = await request(path, 'POST', body, signal)
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new AgentApiError(502, 'Agent 未返回事件流')
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let terminal = false
  const consume = (frame: string) => {
    const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart()).join('\n')
    if (!data) return
    const event = JSON.parse(data) as AgentEvent
    if (['done', 'approval_required', 'error'].includes(event.type)) terminal = true
    onEvent(event)
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      let boundary = /\r?\n\r?\n/.exec(buffer)
      while (boundary) {
        consume(buffer.slice(0, boundary.index))
        buffer = buffer.slice(boundary.index + boundary[0].length)
        boundary = /\r?\n\r?\n/.exec(buffer)
      }
      if (done) break
    }
    if (!terminal) throw new AgentApiError(502, '回答连接已中断，当前内容可能不完整；请刷新聊天状态后再操作')
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

export const agentApi = {
  me: async (): Promise<{ role: AgentRole; user_id: string | null }> => (await request('/auth/me')).json(),
  guest: async (): Promise<{ role: AgentRole; expires_in: number }> => (await request('/auth/guest', 'POST')).json(),
  login: async (password: string): Promise<{ role: AgentRole; expires_in: number }> => (await request('/auth/login', 'POST', { password })).json(),
  logout: async () => { await request('/auth/logout', 'POST') },
  createConversation: async (): Promise<{ conversation_id: string }> => (await request('/conversations', 'POST')).json(),
  conversations: async (): Promise<{ items: { conversation_id: string; message_count: number }[] }> => (await request('/conversations')).json(),
  conversation: async (id: string): Promise<Conversation> => (await request(`/conversations/${encodeURIComponent(id)}`)).json(),
  clear: async (id: string) => { await request(`/conversations/${encodeURIComponent(id)}/messages`, 'DELETE') },
  send: (id: string, message: string, onEvent: (event: AgentEvent) => void, signal?: AbortSignal) =>
    stream(`/conversations/${encodeURIComponent(id)}/messages`, { message }, onEvent, signal),
  review: (id: string, approvalId: string, decisions: ApprovalDecision[], onEvent: (event: AgentEvent) => void, signal?: AbortSignal) =>
    stream(`/conversations/${encodeURIComponent(id)}/approvals/${encodeURIComponent(approvalId)}`, { decisions }, onEvent, signal),
  cancelReview: async (id: string, approvalId: string) => {
    await request(`/conversations/${encodeURIComponent(id)}/approvals/${encodeURIComponent(approvalId)}`, 'DELETE')
  },
}
