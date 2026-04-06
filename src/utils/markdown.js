import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

// 使用 marked-highlight 扩展
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value
  }
}))

marked.setOptions({
  breaks: false,
  gfm: true,
  headerIds: false,
  mangle: false
})

// 仅解析为 HTML（用于预览）
export function parseMarkdown(markdown) {
  if (!markdown.trim()) return ''
  return marked.parse(markdown)
}

// 将 Markdown 转换为内联样式的 HTML（适配微信公众号）
export function toWechatHTML(markdown) {
  if (!markdown.trim()) return ''
  const html = marked.parse(markdown)
  return convertToInlineStyle(html)
}

// 将 CSS 样式转换为内联样式
function convertToInlineStyle(html) {
  const hljsColorMap = {
    'hljs-keyword': 'color: #c678dd;',
    'hljs-built_in': 'color: #e6c07b;',
    'hljs-type': 'color: #e6c07b;',
    'hljs-literal': 'color: #56b6c2;',
    'hljs-number': 'color: #d19a66;',
    'hljs-string': 'color: #98c379;',
    'hljs-comment': 'color: #5c6370; font-style: italic;',
    'hljs-title': 'color: #61afef;',
    'hljs-section': 'color: #e06c75;',
    'hljs-tag': 'color: #e06c75;',
    'hljs-name': 'color: #e06c75;',
    'hljs-attr': 'color: #d19a66;',
    'hljs-variable': 'color: #e06c75;',
    'hljs-template-variable': 'color: #e06c75;',
    'hljs-class': 'color: #e6c07b;',
    'hljs-function': 'color: #61afef;',
    'hljs-symbol': 'color: #98c379;',
    'hljs-bullet': 'color: #61afef;',
    'hljs-link': 'color: #56b6c2;',
    'hljs-meta': 'color: #61afef;',
    'hljs-selector-id': 'color: #e06c75;',
    'hljs-selector-class': 'color: #e6c07b;',
    'hljs-emphasis': 'font-style: italic;',
    'hljs-strong': 'font-weight: bold;',
    'hljs-deletion': 'color: #e06c75; background: #ffeef0;',
    'hljs-addition': 'color: #98c379; background: #f0fff4;',
  }

  let result = html

  // 1. 处理 hljs span 标签
  Object.keys(hljsColorMap).forEach(cls => {
    const colorStyle = hljsColorMap[cls]
    const regex = new RegExp(`<span class="${cls}"`, 'g')
    result = result.replace(regex, `<span style="${colorStyle}"`)
  })

  // 2. 处理基础 hljs 类
  result = result.replace(/<span class="hljs"([^>]*)>/g, (match) => {
    if (match.includes('style=')) return match
    return match.replace('class="hljs"', 'style="color: #abb2bf;"')
  })

  // 3. 处理 pre 标签
  result = result.replace(/(<pre[^>]*?)>/g, (match, startTag) => {
    if (startTag.includes('style=')) return match
    return `${startTag} style="margin: 16px 0; padding: 14px; background: #282c34; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;">`
  })

  // 4. 处理 code 标签
  result = result.replace(/(<code[^>]*?)>/g, (match, startTag) => {
    if (startTag.includes('style=')) return match
    return `${startTag} style="font-family: Consolas, Monaco, monospace; font-size: 13px; color: #abb2bf; background: none; padding: 0; white-space: pre-wrap; word-break: break-all; display: block;">`
  })

  // 5. 应用其他标签样式
  const tagStyles = {
    'h1': 'font-size: 28px; font-weight: bold; margin: 24px 0 16px 0; color: #1a1a1a;',
    'h2': 'font-size: 22px; font-weight: bold; margin: 20px 0 12px 0; color: #1a1a1a;',
    'h3': 'font-size: 18px; font-weight: bold; margin: 16px 0 10px 0; color: #1a1a1a;',
    'p': 'font-size: 15px; line-height: 1.8; margin: 12px 0; color: #333;',
    'ul': 'margin: 12px 0; padding-left: 24px;',
    'ol': 'margin: 12px 0; padding-left: 24px;',
    'li': 'font-size: 15px; line-height: 1.8; margin: 6px 0; color: #333;',
    'blockquote': 'margin: 16px 0; padding: 12px 16px; background: #f8f8f8; border-left: 4px solid #07c160; color: #666;',
    'a': 'color: #07c160; text-decoration: none;',
    'img': 'max-width: 100%; height: auto; margin: 12px 0; border-radius: 6px;',
    'table': 'width: 100%; border-collapse: collapse; margin: 16px 0;',
    'th': 'background: #f6f8fa; padding: 10px 12px; border: 1px solid #e1e4e8; text-align: left; font-weight: bold;',
    'td': 'padding: 10px 12px; border: 1px solid #e1e4e8;',
    'hr': 'border: none; border-top: 1px solid #e1e4e8; margin: 24px 0;',
    'strong': 'font-weight: bold;',
    'em': 'font-style: italic;',
    'del': 'text-decoration: line-through;',
    'ins': 'text-decoration: underline;'
  }

  Object.keys(tagStyles).forEach(tag => {
    const style = tagStyles[tag]
    const regex = new RegExp(`<${tag}([^>]*)>`, 'g')
    result = result.replace(regex, (match, attrs) => {
      if (attrs.includes('style=')) return match
      return `<${tag}${attrs} style="${style}">`
    })
  })

  // 包装整个内容
  result = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;">${result}</div>`

  return result
}
