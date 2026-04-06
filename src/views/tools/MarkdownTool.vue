<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回工具箱</router-link>
      </div>
      <div class="header-center">
        <h1>微信公众号 Markdown 编辑器</h1>
        <p class="subtitle">输入 Markdown，自动渲染为公众号样式，支持一键复制</p>
      </div>
      <div class="header-right"></div>
    </header>

    <main class="app-main">
      <div class="editor-panel">
        <MarkdownEditor
          v-model="markdown"
          @file-loaded="handleFileLoaded"
          @clear="markdown = ''"
        />
      </div>
      <div class="preview-panel">
        <MarkdownPreview
          :content="markdown"
          @copy="copyToClipboard"
          @showHtml="showDebugHtml"
        />
      </div>
    </main>

    <div class="templates-bar">
      <span class="templates-label">快速模板：</span>
      <button
        v-for="tpl in templates"
        :key="tpl.name"
        class="template-btn"
        @click="applyTemplate(tpl.content)"
      >
        {{ tpl.name }}
      </button>
    </div>

    <!-- 调试弹窗 -->
    <div v-if="debugHtml" class="debug-modal" @click.self="debugHtml = ''">
      <div class="debug-content">
        <div class="debug-header">
          <span>生成的 HTML</span>
          <button class="close-btn" @click="debugHtml = ''">关闭</button>
        </div>
        <textarea readonly :value="debugHtml" @click="selectAll"></textarea>
        <button class="copy-html-btn" @click="copyHtml">复制 HTML</button>
      </div>
    </div>

    <transition name="toast">
      <div v-if="showToast" class="toast">{{ toastMessage }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MarkdownEditor from '../../components/MarkdownEditor.vue'
import MarkdownPreview from '../../components/MarkdownPreview.vue'
import { toWechatHTML } from '../../utils/markdown'

const markdown = ref('')
const showToast = ref(false)
const toastMessage = ref('')
const debugHtml = ref('')

const templates = [
  {
    name: '标题文章',
    content: '# 文章标题\n\n这是一段正文内容。微信公众号文章需要使用适配的样式，包括合理的字号、行高和间距。\n\n## 小节标题\n\n这里是小节内容，可以包含**加粗**、*斜体*和[链接](https://example.com)。\n\n> 这里是引用内容，用于强调重要信息。\n\n### 代码示例\n\n```javascript\nconsole.log("Hello, WeChat!");\n```\n\n- 列表项一\n- 列表项二\n- 列表项三\n'
  },
  {
    name: '教程文章',
    content: '# 教程标题\n\n> 本文介绍如何使用方法。\n\n## 第一步\n\n首先，我们需要准备环境。\n\n### 环境要求\n\n1. Node.js 14+\n2. npm 或 yarn\n\n## 第二步\n\n安装依赖：\n\n```bash\nnpm install\n```\n\n## 第三步\n\n运行项目：\n\n```bash\nnpm run dev\n```\n\n完成！\n'
  },
  {
    name: '空模板',
    content: '# 标题\n\n正文内容\n'
  }
]

function handleFileLoaded(content) {
  markdown.value = content
}

function applyTemplate(content) {
  markdown.value = content
}

async function copyToClipboard() {
  if (!markdown.value.trim()) {
    showToastMessage('请先输入内容')
    return
  }

  try {
    const html = toWechatHTML(markdown.value)
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([markdown.value], { type: 'text/plain' })
      })
    ])
    showToastMessage('已复制，可直接粘贴到公众号')
  } catch (err) {
    try {
      await navigator.clipboard.writeText(markdown.value)
      showToastMessage('复制成功（纯文本模式）')
    } catch {
      showToastMessage('复制失败，请手动复制')
    }
  }
}

function showToastMessage(message) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

function showDebugHtml(html) {
  debugHtml.value = html
}

function selectAll(event) {
  event.target.select()
}

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(debugHtml.value)
    showToastMessage('HTML 已复制')
  } catch {
    showToastMessage('复制失败')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  position: relative;
}

.header-left,
.header-right {
  flex: 1;
}

.header-center {
  text-align: center;
}

.back-link {
  position: absolute;
  left: 0;
  font-size: 14px;
  color: #07c160;
  text-decoration: none;
  padding: 8px 0;
}

.back-link:hover {
  text-decoration: underline;
}

.app-header h1 {
  font-size: 28px;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.app-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 500px;
}

.editor-panel,
.preview-panel {
  min-height: 500px;
}

.templates-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-wrap: wrap;
}

.templates-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.template-btn {
  padding: 6px 14px;
  font-size: 13px;
  background: #f6f8fa;
  color: #333;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  background: #07c160;
  color: #fff;
  border-color: #07c160;
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #333;
  color: #fff;
  font-size: 14px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.debug-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.debug-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e4e8;
}

.debug-header span {
  font-weight: 600;
  color: #333;
}

.close-btn {
  padding: 4px 12px;
  font-size: 13px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.close-btn:hover {
  color: #333;
  border-color: #333;
}

.debug-content textarea {
  flex: 1;
  min-height: 300px;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
  background: #f6f8fa;
}

.copy-html-btn {
  margin: 12px 16px;
  padding: 8px 16px;
  font-size: 13px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.copy-html-btn:hover {
  background: #06ad56;
}

@media (max-width: 900px) {
  .app-main {
    grid-template-columns: 1fr;
  }

  .editor-panel,
  .preview-panel {
    min-height: 400px;
  }
}
</style>
