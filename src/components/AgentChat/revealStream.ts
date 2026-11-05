import type { Element, Root, Text } from 'hast'
import styles from './AgentChat.module.css'

/** 在 Markdown 解析后按 SSE 片段切分文本，保留链接、表格和代码原有结构。 */
export function revealStream(ends: number[]) {
  return (tree: Root) => {
    let index = 0
    function visit(parent: Root | Element) {
      const children: typeof parent.children = []
      for (const child of parent.children) {
        if (child.type === 'doctype') continue
        if (child.type === 'element') visit(child)
        const start = child.position?.start.offset
        const end = child.position?.end.offset
        if (child.type !== 'text' || start === undefined || end === undefined || end - start !== child.value.length) {
          children.push(child)
          continue
        }
        while (index < ends.length && ends[index] <= start) index++
        let cursor = start
        while (cursor < end) {
          const next = Math.min(ends[index] ?? end, end)
          const value: Text = { type: 'text', value: child.value.slice(cursor - start, next - start) }
          children.push({ type: 'element', tagName: 'span', properties: { className: [styles.reveal] }, children: [value] })
          cursor = next
          if (cursor === ends[index]) index++
        }
      }
      parent.children = children
    }
    visit(tree)
  }
}
