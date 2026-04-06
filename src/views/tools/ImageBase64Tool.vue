<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回工具箱</router-link>
      </div>
      <div class="header-center">
        <h1>图片 BASE64 转换工具</h1>
        <p class="subtitle">图片与 Base64 文本互转，支持预览和复制</p>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="main-content">
      <div class="toolbar">
        <div class="mode-switch">
          <button
            class="mode-btn"
            :class="{ active: mode === 'toBase64' }"
            @click="mode = 'toBase64'"
          >图片 → BASE64</button>
          <button
            class="mode-btn"
            :class="{ active: mode === 'toImage' }"
            @click="mode = 'toImage'"
          >BASE64 → 图片</button>
        </div>
        <button class="action-btn copy" @click="copyContent">
          {{ copied ? '已复制 ✓' : '复制' }}
        </button>
      </div>

      <!-- 图片转 BASE64 模式 -->
      <div v-if="mode === 'toBase64'" class="content-area">
        <div class="image-section">
          <div class="panel-header">
            <span>上传图片</span>
            <label class="upload-btn">
              <input type="file" accept="image/*" @change="handleImageUpload" hidden />
              选择图片
            </label>
          </div>
          <div class="image-preview-area">
            <img v-if="imageData" :src="imageData" class="image-preview" alt="预览" />
            <div v-else class="empty-hint">
              <span>点击上方按钮选择图片</span>
              <span class="hint-sub">支持 JPG、PNG、GIF、WebP 等格式</span>
            </div>
          </div>
        </div>

        <div class="base64-section">
          <div class="panel-header">
            <span>BASE64 文本</span>
            <span class="size-info" v-if="imageSize">原始大小: {{ imageSize }}</span>
          </div>
          <div class="base64-output">
            <textarea
              v-if="base64Text"
              :value="base64Text"
              readonly
              placeholder="图片的 Base64 编码将显示在这里..."
            ></textarea>
            <div v-else class="empty-hint">
              上传图片后自动生成 Base64 编码
            </div>
          </div>
        </div>
      </div>

      <!-- BASE64 转图片模式 -->
      <div v-else class="content-area reverse">
        <div class="base64-section">
          <div class="panel-header">
            <span>粘贴 BASE64 文本</span>
          </div>
          <textarea
            v-model="inputBase64"
            placeholder="粘贴 Base64 文本（需包含 data:image/...;base64, 前缀）..."
          ></textarea>
          <div class="error-hint" v-if="decodeError">{{ decodeError }}</div>
        </div>

        <div class="image-section">
          <div class="panel-header">
            <span>图片预览</span>
          </div>
          <div class="image-preview-area">
            <img v-if="decodedImage" :src="decodedImage" class="image-preview" alt="预览" />
            <div v-else class="empty-hint">
              <span>粘贴 Base64 文本后自动显示预览</span>
              <span class="hint-sub" v-if="inputBase64 && !decodedImage">Base64 格式不正确或无法解析</span>
            </div>
          </div>
        </div>
      </div>

      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">↑</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const mode = ref('toBase64')
const imageData = ref('')
const imageSize = ref('')
const base64Text = ref('')
const inputBase64 = ref('')
const decodedImage = ref('')
const decodeError = ref('')
const copied = ref(false)
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

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  imageSize.value = formatFileSize(file.size)

  const reader = new FileReader()
  reader.onload = (e) => {
    imageData.value = e.target.result
    base64Text.value = e.target.result
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

watch(inputBase64, (val) => {
  if (!val.trim()) {
    decodedImage.value = ''
    decodeError.value = ''
    return
  }
  try {
    decodedImage.value = val
    decodeError.value = ''
  } catch {
    decodeError.value = '无法解析 Base64 数据'
    decodedImage.value = ''
  }
})

const copyContent = async () => {
  const text = mode.value === 'toBase64' ? base64Text.value : inputBase64.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
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

.mode-switch {
  display: flex;
  gap: 4px;
  background: #f0f0f0;
  padding: 4px;
  border-radius: 6px;
}

.mode-btn {
  padding: 6px 16px;
  font-size: 13px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #666;
}

.mode-btn.active {
  background: #667eea;
  color: #fff;
}

.mode-btn:hover:not(.active) {
  background: #e0e0e0;
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

.content-area.reverse .base64-section:first-child,
.content-area.reverse .image-section:last-child {
  order: 1;
}

.image-section, .base64-section {
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

.size-info {
  font-size: 12px;
  color: #999;
  font-weight: normal;
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

.image-preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
  background: #fafafa;
}

.image-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
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

.base64-output {
  flex: 1;
  overflow: hidden;
}

.base64-output textarea {
  width: 100%;
  height: 100%;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  outline: none;
  background: #fafafa;
}

.base64-section textarea {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  outline: none;
}

.base64-section textarea::placeholder {
  color: #999;
}

.error-hint {
  padding: 8px 16px;
  background: #ffeef0;
  color: #dc3545;
  font-size: 12px;
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
