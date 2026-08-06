import { visit } from 'unist-util-visit'
import type { Root, Text } from 'mdast'

/**
 * 自定义 remark 插件：将正文中的 `[N]` 数字角标提升为 citation 节点，
 * 由渲染层映射为可点击的来源角标（DeepSeek 式来源引用）。
 */
export function remarkCitations() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      const regex = /\[(\d{1,2})\]/g
      if (!regex.test(node.value)) return
      regex.lastIndex = 0
      const parts: Array<Text | { type: 'citation'; value: string; data: { index: number } }> = []
      let last = 0
      let match: RegExpExecArray | null
      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > last) {
          parts.push({ type: 'text', value: node.value.slice(last, match.index) })
        }
        parts.push({ type: 'citation', value: match[1], data: { index: Number(match[1]) } })
        last = match.index + match[0].length
      }
      if (parts.length === 0) return
      if (last < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(last) })
      }
      // 替换当前 text 节点
      const parentNode = parent as unknown as { children: unknown[] }
      parentNode.children.splice(index as number, 1, ...parts)
    })
  }
}

export interface CitationNode {
  type: 'citation'
  value: string
  data: { index: number }
}
