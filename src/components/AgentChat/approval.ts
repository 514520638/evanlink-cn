import type { ApprovalDecision, PendingApproval } from '../../api/agent'

export type Draft = { content: string; visibility: string; status: string; reject: boolean; extras: Record<string, string> }
export const combined = (draft: Draft) => [draft.content, ...Object.entries(draft.extras).filter(([, value]) => value.trim()).map(([label, value]) => `${label}：${value.trim()}`)].join('\n')

/** 补充字段只合并一次；从服务端恢复的草稿已经包含合并后的正文。 */
export function draftsFromPending(value: PendingApproval | null): Draft[] {
  return value?.action_requests.map((action, index) => {
    const saved = value.draft_decisions?.[index]
    return {
      content: saved?.changes?.content ?? action.args.content,
      visibility: saved?.changes?.visibility ?? action.args.visibility ?? (action.name === 'update_personal_memory' ? 'keep' : 'public'),
      status: saved?.changes?.status ?? action.args.status ?? (action.name === 'update_personal_memory' ? 'keep' : 'published'),
      reject: saved?.type === 'reject', extras: {},
    }
  }) ?? []
}

export function toDecisions(drafts: Draft[]): ApprovalDecision[] {
  return drafts.map(draft => ({
    type: draft.reject ? 'reject' : 'edit',
    ...(draft.reject ? {} : { changes: {
      content: combined(draft),
      ...(draft.visibility === 'keep' ? {} : { visibility: draft.visibility as 'public' | 'private' }),
      ...(draft.status === 'keep' ? {} : { status: draft.status as 'draft' | 'published' | 'archived' }),
    } }),
  }))
}
