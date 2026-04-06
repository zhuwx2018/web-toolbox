<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回工具箱</router-link>
      </div>
      <div class="header-center">
        <h1>JSON 格式化工具</h1>
        <p class="subtitle">格式化 JSON 数据，支持压缩和高亮显示</p>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="main-content">
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="action-btn primary" @click="formatJson">格式化</button>
          <button class="action-btn" @click="compressJson">压缩</button>
          <button class="action-btn" @click="clearAll">清空</button>
        </div>
        <div class="toolbar-right">
          <button class="action-btn copy" @click="copyOutput">
            {{ copied ? '已复制 ✓' : '复制结果' }}
          </button>
        </div>
      </div>

      <div class="content-area">
        <div class="input-section">
          <div class="panel-header">
            <span>输入 JSON</span>
            <label class="upload-btn">
              <input type="file" accept=".json" @change="handleFileUpload" hidden />
              上传文件
            </label>
          </div>
          <textarea
            v-model="inputText"
            placeholder="粘贴或输入 JSON 数据..."
            spellcheck="false"
            @input="onInputChange"
          ></textarea>
        </div>

        <div class="output-section">
          <div class="panel-header">
            <span>格式化结果</span>
            <span class="json-status" :class="statusClass">{{ statusText }}</span>
          </div>
          <div class="output-content" ref="outputRef">
            <pre v-if="error" class="error-text">{{ error }}</pre>
            <pre v-else ref="highlightRef" class="highlighted-json" v-html="highlightedJson"></pre>
          </div>
        </div>
      </div>

      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
        ↑
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('json', json)

const inputText = ref('')
const outputText = ref('')
const error = ref('')
const copied = ref(false)
const outputRef = ref(null)
const highlightRef = ref(null)
const showBackToTop = ref(false)

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

function onWindowScroll() {
  showBackToTop.value = window.scrollY > 200
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const statusClass = computed(() => {
  if (error.value) return 'error'
  if (outputText.value) return 'success'
  return ''
})

const statusText = computed(() => {
  if (error.value) return '格式错误'
  if (outputText.value) {
    const lines = outputText.value.split('\n').length
    return `有效 JSON · ${lines} 行`
  }
  return ''
})

const highlightedJson = computed(() => {
  if (!outputText.value) return ''
  try {
    return hljs.highlight(outputText.value, { language: 'json' }).value
  } catch {
    return escapeHtml(outputText.value)
  }
})

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function onInputChange() {
  tryFormat()
}

function tryFormat() {
  error.value = ''
  if (!inputText.value.trim()) {
    outputText.value = ''
    return
  }
  try {
    const parsed = JSON.parse(inputText.value)
    outputText.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    error.value = e.message
    outputText.value = ''
  }
}

function formatJson() {
  tryFormat()
}

function compressJson() {
  if (!inputText.value.trim()) return
  try {
    const parsed = JSON.parse(inputText.value)
    outputText.value = JSON.stringify(parsed)
    error.value = ''
  } catch (e) {
    error.value = e.message
    outputText.value = ''
  }
}

function clearAll() {
  inputText.value = ''
  outputText.value = ''
  error.value = ''
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      inputText.value = e.target.result
      tryFormat()
    }
    reader.readAsText(file)
  }
  event.target.value = ''
}

async function copyOutput() {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  gap: 20px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.header-left, .header-right {
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

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  position: relative;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #666;
}

.action-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.action-btn.primary {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.action-btn.primary:hover {
  background: #5a6fd6;
}

.action-btn.copy {
  background: #07c160;
  color: #fff;
  border-color: #07c160;
}

.action-btn.copy:hover {
  background: #06ad56;
}

.content-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  flex: 1;
}

.input-section, .output-section {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 400px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e1e4e8;
}

.panel-header span {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.json-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

.json-status.success {
  background: #f0fff4;
  color: #28a745;
}

.json-status.error {
  background: #ffeef0;
  color: #dc3545;
}

.upload-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: #07c160;
  color: #fff;
  border: none;
}

.upload-btn:hover {
  background: #06ad56;
}

textarea {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
}

textarea::placeholder {
  color: #999;
}

.output-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.output-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-text {
  color: #dc3545;
}

.highlighted-json {
  margin: 0;
}

/* highlight.js 样式覆盖 */
.highlighted-json :deep(.hljs-attr) {
  color: #905;
}

.highlighted-json :deep(.hljs-string) {
  color: #690;
}

.highlighted-json :deep(.hljs-number) {
  color: #08c;
}

.highlighted-json :deep(.hljs-literal) {
  color: #905;
}

.highlighted-json :deep(.hljs-null) {
  color: #999;
}

.back-to-top {
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.45);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-to-top:hover {
  transform: translateY(-4px) scale(1.08);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
}

@media (max-width: 900px) {
  .content-area {
    grid-template-columns: 1fr;
  }
}
</style>
