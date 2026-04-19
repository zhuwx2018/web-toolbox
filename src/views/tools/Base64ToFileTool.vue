<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回工具箱</router-link>
      </div>
      <div class="header-center">
        <h1>Base64 转文件工具</h1>
        <p class="subtitle">将 Base64 字符串转换为指定格式文件并下载</p>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="main-content">
      <div class="toolbar">
        <div class="format-select">
          <label>目标格式：</label>
          <select v-model="targetFormat">
            <option value="image/png">PNG 图片</option>
            <option value="image/jpeg">JPEG 图片</option>
            <option value="image/gif">GIF 图片</option>
            <option value="image/webp">WebP 图片</option>
            <option value="application/pdf">PDF 文档</option>
            <option value="application/zip">ZIP 压缩包</option>
          </select>
        </div>
        <div class="toolbar-actions">
                    <button class="action-btn download" @click="downloadFile" :disabled="!convertedBlob">
            下载文件
          </button>
          <button class="action-btn copy" @click="copyContent" :disabled="!inputBase64.trim()">
            {{ copied ? '已复制 ✓' : '复制' }}
          </button>
        </div>
      </div>

      <div class="content-area">
        <div class="input-section">
          <div class="panel-header">
            <span>输入 Base64 字符串</span>
            <span class="size-info" v-if="inputSize">输入大小: {{ inputSize }}</span>
          </div>
          <textarea
            v-model="inputBase64"
            placeholder="粘贴 Base64 字符串（可包含或不含 data:image/...;base64, 前缀）..."
          ></textarea>
          <div class="error-hint" v-if="error">{{ error }}</div>
        </div>

        <div class="output-section">
          <div class="panel-header">
            <span>文件预览</span>
            <span v-if="convertedBlob">{{ fileName }}</span>
          </div>
          <div class="preview-area">
            <img v-if="previewUrl && targetFormat.startsWith('image/')" :src="previewUrl" class="file-preview" alt="预览" />
            <div v-else-if="convertedBlob" class="file-preview-card" @click="downloadFile">
              <span class="file-icon">{{ formatIcon }}</span>
              <span class="file-name">{{ fileName }}</span>
              <span class="file-size">{{ fileSize }}</span>
              <span class="download-hint">点击下载</span>
            </div>
            <div v-else class="empty-hint">
              <span>粘贴 Base64 文本并选择格式后点击转换</span>
              <span class="hint-sub">转换后将显示预览并可下载文件</span>
            </div>
          </div>
        </div>
      </div>

      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">↑</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const inputBase64 = ref('')
const targetFormat = ref('image/png')
const convertedBlob = ref(null)
const previewUrl = ref('')
const error = ref('')
const copied = ref(false)
const showBackToTop = ref(false)
const inputSize = ref('')

onMounted(() => {
  window.addEventListener('scroll', onWindowScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onWindowScroll)
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

function onWindowScroll() {
  showBackToTop.value = window.scrollY > 200
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const fileName = computed(() => {
  const mimeToExt = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'application/zip': 'zip'
  }
  const ext = mimeToExt[targetFormat.value] || 'bin'
  const now = new Date()
  const pad = n => n.toString().padStart(2, '0')
  const timestamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return `${timestamp}.${ext}`
})

const fileSize = computed(() => {
  return convertedBlob.value ? formatFileSize(convertedBlob.value.size) : ''
})

const formatIcon = computed(() => {
  const icons = {
    'application/pdf': '📄',
    'application/zip': '📦'
  }
  return icons[targetFormat.value] || '📁'
})

let debounceTimer = null
watch(inputBase64, (val) => {
  if (val.trim()) {
    const cleanBase64 = val.replace(/\s/g, '')
    inputSize.value = formatFileSize(Math.ceil(cleanBase64.length * 0.75))
    // 自动转换，延迟执行以等待用户输入完成
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      convertBase64()
    }, 500)
  } else {
    inputSize.value = ''
    convertedBlob.value = null
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = ''
    }
    error.value = ''
  }
})

function convertBase64() {
  error.value = ''
  convertedBlob.value = null

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }

  if (!inputBase64.value.trim()) {
    error.value = '请输入 Base64 字符串'
    return
  }

  try {
    let base64Data = inputBase64.value.trim()

    // 检查是否包含 data URL 前缀
    const dataUrlMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    let mimeType = targetFormat.value
    let base64Content = base64Data

    if (dataUrlMatch) {
      // 如果输入包含 data URL 前缀，使用输入的 MIME 类型或用户选择的类型
      mimeType = targetFormat.value
      base64Content = dataUrlMatch[2]
    } else {
      // 纯 base64 字符串，添加用户选择的 MIME 类型
      base64Content = base64Data.replace(/\s/g, '')
    }

    // 验证 base64 格式
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(base64Content)) {
      throw new Error('Base64 格式无效')
    }

    // 解码 base64 为二进制数据
    const binaryString = atob(base64Content)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 创建 Blob
    convertedBlob.value = new Blob([bytes], { type: mimeType })

    // 创建预览 URL
    previewUrl.value = URL.createObjectURL(convertedBlob.value)

  } catch (e) {
    error.value = 'Base64 解析失败: ' + e.message
    convertedBlob.value = null
  }
}

function downloadFile() {
  if (!convertedBlob.value) return

  const link = document.createElement('a')
  link.href = URL.createObjectURL(convertedBlob.value)
  link.download = fileName.value
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 清理 URL
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
  }, 100)
}

const copyContent = async () => {
  if (!inputBase64.value) return
  try {
    await navigator.clipboard.writeText(inputBase64.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = inputBase64.value
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

.format-select {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-select label {
  font-size: 14px;
  color: #666;
}

.format-select select {
  padding: 6px 12px;
  font-size: 14px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  outline: none;
}

.format-select select:focus {
  border-color: #07c160;
}

.toolbar-actions {
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn:not(:disabled):hover {
  border-color: #07c160;
  color: #07c160;
}

.action-btn.download {
  background: #07c160;
  color: #fff;
  border-color: #07c160;
}

.action-btn.download:not(:disabled):hover {
  background: #06ad56;
}

.action-btn.copy {
  background: #07c160;
  color: #fff;
  border-color: #07c160;
}

.action-btn.copy:not(:disabled):hover {
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

.panel-header span:first-child {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.size-info {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.input-section textarea {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  outline: none;
}

.input-section textarea::placeholder {
  color: #999;
}

.error-hint {
  padding: 8px 16px;
  background: #ffeef0;
  color: #dc3545;
  font-size: 12px;
}

.preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
  background: #fafafa;
}

.file-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.file-preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  background: #fff;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-preview-card:hover {
  border-color: #07c160;
  background: #f0fff4;
}

.file-icon {
  font-size: 64px;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  font-family: Consolas, Monaco, 'Courier New', monospace;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.download-hint {
  font-size: 12px;
  color: #07c160;
  margin-top: 8px;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.hint-sub {
  font-size: 12px;
  color: #bbb;
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
