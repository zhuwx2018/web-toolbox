<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回工具箱</router-link>
      </div>
      <div class="header-center">
        <h1>YAML 文件校验工具</h1>
        <p class="subtitle">校验 YAML 格式是否正确，显示错误位置</p>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="main-content">
      <div class="editor-section">
        <div class="input-panel">
          <div class="panel-header">
            <span>YAML 内容</span>
            <div class="actions">
              <button class="copy-btn" @click="copyYaml" :class="{ success: copySuccess }">
                {{ copySuccess ? '已复制' : '复制' }}
              </button>
              <label class="upload-btn">
                <input type="file" accept=".yaml,.yml" @change="handleFileUpload" hidden />
                上传
              </label>
              <button class="clear-btn" @click="yamlContent = ''">清空</button>
            </div>
          </div>
          <div class="editor-container">
            <div class="line-numbers" ref="lineNumbers">
              <div
                v-for="n in lineCount"
                :key="n"
                class="line-num"
                :class="{ 'error-line': error && error.line === n }"
              >{{ n }}</div>
            </div>
            <div class="editor-wrapper" ref="editorWrapperRef">
              <pre class="highlight-layer" ref="highlightLayerRef" v-html="highlightedYaml"></pre>
              <textarea
                v-model="yamlContent"
                placeholder="粘贴或输入 YAML 内容..."
                spellcheck="false"
                @scroll="syncScroll"
                ref="textareaRef"
              ></textarea>
            </div>
          </div>
        </div>

        <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
          ↑
        </button>
      </div>

      <div class="result-section">
        <div class="result-header">
          <span>校验结果</span>
          <button class="validate-btn" @click="validateYaml">校验</button>
        </div>

        <div class="result-body">
          <div v-if="!yamlContent" class="empty-hint">
            请输入 YAML 内容进行校验
          </div>
          <div v-else-if="validateSuccess" class="success-hint">
            ✓ YAML 格式正确
          </div>
          <div v-else-if="error" class="error-container">
            <div class="error-header">
              <span class="error-icon">✗</span>
              <span class="error-title">{{ error.message }}</span>
            </div>
            <div class="error-details" v-if="error.line">
              <span class="error-position">第 {{ error.line }} 行，第 {{ error.column }} 列</span>
            </div>
            <div class="error-context" v-if="error.line && error.context">
              <div class="context-line" v-for="(line, idx) in error.context" :key="idx"
                :class="{ 'error-line': line.isError, 'highlight-line': line.isHighlight }">
                <span class="line-num">{{ line.num }}</span>
                <span class="line-text">{{ line.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as YAML from 'yaml'

const yamlContent = ref('')
const validateSuccess = ref(false)
const error = ref(null)
const lineNumbers = ref(null)
const textareaRef = ref(null)
const editorWrapperRef = ref(null)
const highlightLayerRef = ref(null)
const showBackToTop = ref(false)
const copySuccess = ref(false)

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
})

const lineCount = computed(() => {
  if (!yamlContent.value) return 1
  return yamlContent.value.split('\n').length
})

const highlightedYaml = computed(() => {
  return highlightYaml(yamlContent.value)
})

function highlightYaml(content) {
  if (!content) return ''

  const lines = content.split('\n')
  return lines.map((line, lineIndex) => {
    // 注释
    if (line.trim().startsWith('#')) {
      return `<span class="yaml-comment">${escapeHtml(line)}</span>`
    }

    // 列表项 - 匹配 "- 值" 或 "-"
    const listMatch = line.match(/^(\s*)(-)(\s*)(.*)$/)
    if (listMatch) {
      const [full, indent, dash, space, rest] = listMatch
      let result = escapeHtml(indent) + `<span class="yaml-list-marker">-</span>`
      if (space) result += escapeHtml(space)
      if (rest) {
        result += highlightValue(rest)
      }
      return result
    }

    // 键值对 - 匹配 "key: value" 或 "key:"
    const kvIndex = line.indexOf(':')
    if (kvIndex > 0) {
      const indent = line.match(/^\s*/)[0]
      const beforeColon = line.substring(indent.length, kvIndex)
      const afterColon = line.substring(kvIndex + 1)

      let result = escapeHtml(indent)
      result += `<span class="yaml-key">${escapeHtml(beforeColon)}</span>`
      result += ':'
      if (afterColon) {
        result += highlightValue(afterColon)
      }
      return result
    }

    // 其他行
    return escapeHtml(line)
  }).join('\n')
}

function highlightValue(value) {
  if (!value) return ''

  // 去掉前导空格
  const leadingSpace = value.match(/^(\s*)/)[1]
  let result = escapeHtml(leadingSpace)

  // 检查是否有注释
  const hashIndex = value.indexOf('#', leadingSpace.length)
  let valuePart = value.substring(leadingSpace.length)
  let commentPart = ''

  if (hashIndex >= 0) {
    // 找到注释
    const beforeComment = value.substring(leadingSpace.length, hashIndex)
    commentPart = value.substring(hashIndex)
    valuePart = beforeComment
  }

  // 高亮值
  const trimmed = valuePart.trim()
  if (trimmed === 'true' || trimmed === 'false') {
    result += `<span class="yaml-boolean">${trimmed}</span>`
  } else if (trimmed === 'null' || trimmed === '~') {
    result += `<span class="yaml-null">${trimmed}</span>`
  } else if (/^-?\d+\.?\d*$/.test(trimmed)) {
    result += `<span class="yaml-number">${trimmed}</span>`
  } else if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
             (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    result += `<span class="yaml-string">${escapeHtml(trimmed)}</span>`
  } else if (trimmed) {
    result += escapeHtml(trimmed)
  }

  // 添加注释
  if (commentPart) {
    result += `<span class="yaml-comment">${escapeHtml(commentPart)}</span>`
  }

  return result
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function syncScroll(e) {
  const scrollTop = e.target.scrollTop
  const scrollLeft = e.target.scrollLeft

  // 同步 line-numbers
  if (lineNumbers.value) {
    lineNumbers.value.scrollTop = scrollTop
  }

  // 同步 highlight-layer
  if (highlightLayerRef && highlightLayerRef.value) {
    highlightLayerRef.value.scrollTop = scrollTop
    highlightLayerRef.value.scrollLeft = scrollLeft
  }
}

// 监听页面滚动
function onWindowScroll() {
  showBackToTop.value = window.scrollY > 200
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      yamlContent.value = e.target.result
      validateYaml()
    }
    reader.readAsText(file)
  }
  event.target.value = ''
}

async function copyYaml() {
  if (!yamlContent.value) return
  try {
    await navigator.clipboard.writeText(yamlContent.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

function validateYaml() {
  error.value = null
  validateSuccess.value = false

  if (!yamlContent.value.trim()) {
    return
  }

  try {
    YAML.parse(yamlContent.value)
    validateSuccess.value = true
  } catch (e) {
    validateSuccess.value = false
    error.value = parseYamlError(e, yamlContent.value)
  }
}

function parseYamlError(err, content) {
  const result = {
    message: err.message || 'YAML 解析错误',
    line: null,
    column: null,
    context: null
  }

  // 从错误消息中提取位置信息
  const lineMatch = err.message.match(/at line (\d+)/i) || err.message.match(/第\s*(\d+)\s*行/i)
  const columnMatch = err.message.match(/column (\d+)/i) || err.message.match(/第\s*(\d+)\s*列/i)

  if (lineMatch) {
    result.line = parseInt(lineMatch[1])
  }
  if (columnMatch) {
    result.column = parseInt(columnMatch[1])
  }

  // 如果没有从消息中提取到，尝试从 err 对象中获取
  if (err.line !== undefined) {
    result.line = err.line
  }
  if (err.column !== undefined) {
    result.column = err.column
  }

  // 生成错误上下文（显示错误行及前后各2行）
  if (result.line) {
    const lines = content.split('\n')
    const startLine = Math.max(0, result.line - 3)
    const endLine = Math.min(lines.length, result.line + 1)

    result.context = []
    for (let i = startLine; i < endLine; i++) {
      result.context.push({
        num: i + 1,
        text: lines[i] || '(空行)',
        isError: i === result.line - 1,
        isHighlight: i === result.line - 1
      })
    }
  }

  return result
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
  background: #f5f5f5;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
  left: 16px;
  font-size: 14px;
  color: #07c160;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-link:hover {
  background: #e8f8ee;
  text-decoration: none;
}

.app-header h1 {
  font-size: 24px;
  color: #1a1a1a;
  margin: 0;
  font-weight: 600;
}

.subtitle {
  font-size: 13px;
  color: #666;
  margin-top: 2px;
}

.main-content {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

/* 编辑器区域 */
.editor-section {
  flex: 1;
  display: flex;
  min-width: 0;
}

.input-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  min-height: 500px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e1e4e8;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.panel-header span {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.copy-btn,
.upload-btn,
.clear-btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn {
  background: #667eea;
  color: #fff;
  border: none;
}

.copy-btn:hover {
  background: #5a6fd6;
}

.copy-btn.success {
  background: #28a745;
}

.upload-btn {
  background: #07c160;
  color: #fff;
  border: none;
}

.upload-btn:hover {
  background: #06ad56;
}

.clear-btn {
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
}

.clear-btn:hover {
  color: #ff4d4f;
  border-color: #ff4d4f;
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

.back-to-top:active {
  transform: translateY(-2px) scale(1.04);
}

.editor-container {
  flex: 1;
  display: flex;
  overflow-y: auto;
  min-height: 0;
}

.line-numbers {
  width: 50px;
  background: #f6f8fa;
  border-right: 1px solid #e1e4e8;
  padding: 16px 0;
  overflow: hidden;
  text-align: right;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 21px;
  color: #999;
  user-select: none;
}

.line-num {
  padding-right: 12px;
  height: 21px;
}

.line-num.error-line {
  background: #ffeef0;
  color: #dc3545;
  font-weight: bold;
}

.editor-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  height: 100%;
}

.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  padding-left: 12px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 21px;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  pointer-events: none;
  color: #333;
  box-sizing: border-box;
  z-index: 0;
}

.editor-wrapper textarea {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  padding-left: 12px;
  box-sizing: border-box;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 21px;
  outline: none;
  background: transparent;
  color: transparent;
  caret-color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
}

/* 结果区域 */
.result-section {
  width: 360px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e1e4e8;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.result-header > span {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.validate-btn {
  padding: 6px 14px;
  font-size: 13px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.validate-btn:hover {
  background: #5a6fd6;
}

.result-body {
  flex: 1;
  padding: 16px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-y: auto;
  min-height: 0;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 50px 20px;
}

.success-hint {
  text-align: center;
  color: #28a745;
  padding: 30px 20px;
  font-size: 14px;
  font-weight: 500;
}

.error-container {
  background: #fff5f5;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  padding: 16px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.error-icon {
  width: 28px;
  height: 28px;
  background: #dc3545;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.error-title {
  color: #dc3545;
  font-weight: 600;
  font-size: 13px;
}

.error-details {
  margin-bottom: 12px;
}

.error-position {
  color: #666;
  font-size: 12px;
  background: #f0f0f0;
  padding: 3px 10px;
  border-radius: 4px;
}

.error-context {
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 4px;
  overflow: hidden;
}

.context-line {
  display: flex;
  padding: 3px 0;
  border-bottom: 1px solid #f5f5f5;
}

.context-line:last-child {
  border-bottom: none;
}

.context-line.error-line {
  background: #ffeef0;
}

.context-line .line-num {
  width: 40px;
  color: #999;
  text-align: right;
  padding-right: 10px;
  user-select: none;
  flex-shrink: 0;
  background: transparent;
  font-size: 12px;
}

.context-line.error-line .line-num {
  color: #dc3545;
  font-weight: bold;
}

.line-text {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  color: #333;
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .result-section {
    width: 100%;
    max-height: 350px;
  }

  .input-panel {
    min-height: 400px;
  }
}
</style>

<style>
/* YAML 语法高亮 - 非 scoped 以便 v-html 内容生效 */
.yaml-key {
  color: #e06c75;
  font-weight: 500;
}

.yaml-string {
  color: #98c379;
}

.yaml-number {
  color: #d19a66;
}

.yaml-boolean {
  color: #c678dd;
}

.yaml-null {
  color: #56b6c2;
}

.yaml-comment {
  color: #5c6370;
  font-style: italic;
}

.yaml-list-marker {
  color: #61aeee;
}
</style>
