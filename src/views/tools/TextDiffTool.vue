<template>
  <div class="app">
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="back-link">← 返回工具箱</router-link>
      </div>
      <div class="header-center">
        <h1>文本差异对比工具</h1>
        <p class="subtitle">对比两个文本，高亮显示差异部分</p>
      </div>
      <div class="header-right"></div>
    </header>

    <div class="main-content">
      <div class="input-section">
        <div class="input-panel">
          <div class="panel-header">
            <span>原始文本</span>
            <div class="actions">
              <label class="upload-btn">
                <input type="file" accept=".txt,.md,.js,.json,.html,.css" @change="handleFileUpload1" hidden />
                上传文件
              </label>
              <button class="clear-btn" @click="text1 = ''">清空</button>
            </div>
          </div>
          <textarea
            v-model="text1"
            placeholder="粘贴或输入第一个文本..."
            spellcheck="false"
          ></textarea>
        </div>

        <div class="input-panel">
          <div class="panel-header">
            <span>对比文本</span>
            <div class="actions">
              <label class="upload-btn">
                <input type="file" accept=".txt,.md,.js,.json,.html,.css" @change="handleFileUpload2" hidden />
                上传文件
              </label>
              <button class="clear-btn" @click="text2 = ''">清空</button>
            </div>
          </div>
          <textarea
            v-model="text2"
            placeholder="粘贴或输入第二个文本..."
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <div class="result-section">
        <div class="result-header">
          <span>差异结果</span>
          <div class="view-toggle">
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'split' }"
              @click="viewMode = 'split'"
            >并排对比</button>
            <button
              class="toggle-btn"
              :class="{ active: viewMode === 'unified' }"
              @click="viewMode = 'unified'"
            >合并显示</button>
          </div>
          <div class="diff-nav" v-if="diffIndices.length > 0">
            <span class="diff-count">共 {{ diffIndices.length }} 处差异</span>
            <span class="diff-current">{{ currentDiffIndex + 1 }} / {{ diffIndices.length }}</span>
            <button class="nav-btn" @click="prevDiff" :disabled="currentDiffIndex <= 0">← 上一个</button>
            <button class="nav-btn" @click="nextDiff" :disabled="currentDiffIndex >= diffIndices.length - 1">下一个 →</button>
          </div>
        </div>

        <div class="result-body">
          <!-- 并排对比视图 -->
          <div v-if="viewMode === 'split'" class="diff-split" ref="splitContainer">
            <div class="split-column left">
              <div class="split-header">原始文本</div>
              <div class="split-content-wrapper">
                <div class="split-line-nums">
                  <template v-for="(item, index) in splitResult.left" :key="'ln' + index">
                    <div v-if="item.type !== 'empty'" class="line-num">
                      {{ item.lineNum }}
                    </div>
                  </template>
                </div>
                <div class="split-content-text" ref="leftContent" @scroll="syncScroll('left', $event)">
                  <template v-for="(item, index) in splitResult.left" :key="'l' + index">
                    <div
                      v-if="item.type === 'delete'"
                      class="diff-line delete"
                    >
                      <span class="line-value">{{ item.value }}</span>
                    </div>
                    <div
                      v-else-if="item.type === 'replace'"
                      class="diff-line replace"
                    >
                      <span class="line-value" v-html="renderCharDiff(item.charDiff, 'old')"></span>
                    </div>
                    <div v-else-if="item.type === 'equal'" class="diff-line equal">
                      <span class="line-value">{{ item.value }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <div class="split-column right">
              <div class="split-header">对比文本</div>
              <div class="split-content-wrapper">
                <div class="split-line-nums">
                  <template v-for="(item, index) in splitResult.right" :key="'rn' + index">
                    <div v-if="item.type !== 'empty'" class="line-num">
                      {{ item.lineNum }}
                    </div>
                  </template>
                </div>
                <div class="split-content-text" ref="rightContent" @scroll="syncScroll('right', $event)">
                  <template v-for="(item, index) in splitResult.right" :key="'r' + index">
                    <div
                      v-if="item.type === 'insert'"
                      class="diff-line insert"
                    >
                      <span class="line-value">{{ item.value }}</span>
                    </div>
                    <div
                      v-else-if="item.type === 'replace'"
                      class="diff-line replace"
                    >
                      <span class="line-value" v-html="renderCharDiff(item.charDiff, 'new')"></span>
                    </div>
                    <div v-else-if="item.type === 'equal'" class="diff-line equal">
                      <span class="line-value">{{ item.value }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- 合并显示视图 -->
          <div v-else class="diff-unified">
            <div v-if="!text1 && !text2" class="empty-hint">
              请在下方输入两个文本进行对比
            </div>
            <div v-else-if="diffIndices.length === 0 && (text1 || text2)" class="empty-hint">
              两个文本完全相同 ✓
            </div>
            <template v-else>
              <div
                v-for="(item, index) in diffResult"
                :key="index"
                class="diff-line"
                :class="[item.type, { highlighted: item.type !== 'equal' && diffIndices.findIndex(d => d.index === index) === currentDiffIndex }]"
              >
                <span class="line-num">{{ item.lineNum1 || '-' }}</span>
                <span class="line-num">{{ item.lineNum2 || '-' }}</span>
                <span class="line-type">{{ getLineTypeChar(item.type) }}</span>
                <span class="line-value" v-if="item.type === 'equal'">{{ item.value }}</span>
                <span class="line-value" v-else-if="item.type === 'replace'" v-html="renderCharDiff(item.charDiff, 'both')"></span>
                <span class="line-value" v-else>{{ item.value }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <button v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
        ↑
      </button>

      <!-- 调试面板 -->
      <div class="debug-panel" v-if="showDebug">
        <div class="debug-header">
          <span>diffResult</span>
        </div>
        <pre>{{ JSON.stringify(diffResult, null, 2) }}</pre>
        <div class="debug-header" style="margin-top: 20px;">
          <span>splitResult.left</span>
        </div>
        <pre>{{ JSON.stringify(splitResult.left, null, 2) }}</pre>
        <div class="debug-header" style="margin-top: 20px;">
          <span>splitResult.right</span>
        </div>
        <pre>{{ JSON.stringify(splitResult.right, null, 2) }}</pre>
        <div style="text-align: center; margin-top: 10px;">
          <button @click="showDebug = false">关闭</button>
        </div>
      </div>
      <button v-if="!showDebug" class="debug-btn" @click="showDebug = true">调试</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { computeDiff, findDiffIndices, computeLineDiff } from '../../utils/diff'

const text1 = ref(`function hello() {
  console.log("Hello World");
  return true;
}

const name = "Alice";
const age = 25;`)

const text2 = ref(`function hello() {
  console.log("Hello New");
  return false;
}

const name = "Bob";
const age = 30;
const city = "Beijing";`)
const viewMode = ref('split')
const currentDiffIndex = ref(0)
const leftContent = ref(null)
const rightContent = ref(null)
const showBackToTop = ref(false)
const showDebug = ref(false)
let isScrolling = false

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

const diffResult = computed(() => {
  if (!text1.value && !text2.value) return []
  return computeDiff(text1.value, text2.value)
})

const diffIndices = computed(() => findDiffIndices(diffResult.value))

const splitResult = computed(() => {
  const left = []
  const right = []
  let leftLineNum = 1
  let rightLineNum = 1
  const diff = diffResult.value
  let i = 0

  while (i < diff.length) {
    const item = diff[i]

    if (item.type === 'equal') {
      left.push({ type: 'equal', lineNum: leftLineNum, value: item.value })
      right.push({ type: 'equal', lineNum: rightLineNum, value: item.value })
      leftLineNum++
      rightLineNum++
      i++
    } else if (item.type === 'delete') {
      // 检查后续是否有相似的 insert（可能是同一行的修改）
      let matchedInsert = -1
      for (let j = i + 1; j < Math.min(i + 5, diff.length); j++) {
        if (diff[j].type === 'insert' && linesSimilar(item.value, diff[j].value)) {
          matchedInsert = j
          break
        }
        if (diff[j].type === 'equal') break
      }

      if (matchedInsert > i) {
        // 找到匹配的 insert，合并为 replace
        const insertItem = diff[matchedInsert]
        const charDiff = computeLineDiff(item.value, insertItem.value)
        left.push({ type: 'replace', lineNum: leftLineNum, value: item.value, charDiff })
        right.push({ type: 'replace', lineNum: rightLineNum, value: insertItem.value, charDiff })
        leftLineNum++
        rightLineNum++
        i = matchedInsert + 1
      } else {
        // 纯删除行
        left.push({ type: 'delete', lineNum: leftLineNum, value: item.value })
        leftLineNum++
        i++
      }
    } else if (item.type === 'insert') {
      right.push({ type: 'insert', lineNum: rightLineNum, value: item.value })
      rightLineNum++
      i++
    } else if (item.type === 'replace') {
      left.push({ type: 'replace', lineNum: leftLineNum, value: item.oldValue, charDiff: item.charDiff })
      right.push({ type: 'replace', lineNum: rightLineNum, value: item.newValue, charDiff: item.charDiff })
      leftLineNum++
      rightLineNum++
      i++
    } else {
      i++
    }
  }

  return { left, right }
})

function linesSimilar(line1, line2) {
  if (line1 === line2) return true
  if (!line1 || !line2) return false

  // 计算公共前缀长度
  let prefixLen = 0
  const minLen = Math.min(line1.length, line2.length)
  while (prefixLen < minLen && line1[prefixLen] === line2[prefixLen]) {
    prefixLen++
  }

  const maxLen = Math.max(line1.length, line2.length)
  if (maxLen === 0) return true

  // 只要公共前缀够长（超过50%），就认为相似
  return prefixLen >= maxLen * 0.5
}

function getLineTypeChar(type) {
  switch (type) {
    case 'delete': return '-'
    case 'insert': return '+'
    case 'replace': return '~'
    default: return ' '
  }
}

/**
 * 渲染字符级差异
 * @param {Array} charDiff - 字符差异数组
 * @param {string} mode - 'old' 显示删除字符, 'new' 显示新增字符, 'both' 显示所有
 */
function renderCharDiff(charDiff, mode) {
  if (!charDiff || charDiff.length === 0) return ''
  return charDiff.map(chunk => {
    if (chunk.type === 'equal') {
      return escapeHtml(chunk.value)
    } else if (chunk.type === 'delete') {
      if (mode === 'old' || mode === 'both') {
        return `<span class="char-delete">${escapeHtml(chunk.value)}</span>`
      }
      return ''
    } else if (chunk.type === 'insert') {
      if (mode === 'new' || mode === 'both') {
        return `<span class="char-insert">${escapeHtml(chunk.value)}</span>`
      }
      return ''
    }
    return escapeHtml(chunk.value)
  }).join('')
}

function escapeHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function handleFileUpload1(event) {
  const file = event.target.files[0]
  if (file) readFile(file, v => text1.value = v)
  event.target.value = ''
}

function handleFileUpload2(event) {
  const file = event.target.files[0]
  if (file) readFile(file, v => text2.value = v)
  event.target.value = ''
}

function readFile(file, callback) {
  const reader = new FileReader()
  reader.onload = (e) => callback(e.target.result)
  reader.readAsText(file)
}

function syncScroll(side, event) {
  if (isScrolling) return
  isScrolling = true

  const scrollTop = event.target.scrollTop
  const scrollLeft = event.target.scrollLeft
  const other = side === 'left' ? rightContent.value : leftContent.value
  if (other) {
    other.scrollTop = scrollTop
    other.scrollLeft = scrollLeft
  }

  requestAnimationFrame(() => {
    isScrolling = false
  })
}

function nextDiff() {
  if (currentDiffIndex.value < diffIndices.value.length - 1) {
    currentDiffIndex.value++
    scrollToCurrentDiff()
  }
}

function prevDiff() {
  if (currentDiffIndex.value > 0) {
    currentDiffIndex.value--
    scrollToCurrentDiff()
  }
}

function scrollToCurrentDiff() {
  nextTick(() => {
    const diffIndex = diffIndices.value[currentDiffIndex.value]
    if (!diffIndex) return

    // 移除之前的高亮
    document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'))

    let targetEl = null

    if (viewMode.value === 'unified') {
      const container = document.querySelector('.diff-unified')
      if (!container) return
      const lines = container.querySelectorAll('.diff-line:not(.equal)')
      targetEl = lines[currentDiffIndex.value]
    } else {
      // split 视图 - 根据差异类型选择面板
      const diffType = diffIndex.type
      const side = diffType === 'delete' ? 'left' : 'right'
      const container = side === 'left' ? leftContent.value : rightContent.value
      if (!container) return
      // 计算同类型第N个元素的位置
      let count = 0
      for (let i = 0; i <= diffIndex.index; i++) {
        if (diffResult.value[i].type === diffType) {
          count++
        }
      }
      // 查询所有同类型行
      const lines = container.querySelectorAll(`.diff-line.${diffType}`)
      targetEl = lines[count - 1]
    }

    if (targetEl) {
      targetEl.classList.add('highlighted')
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
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

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

/* 差异结果面板 */
.result-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e1e4e8;
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.result-header > span {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.view-toggle {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.toggle-btn:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}

.diff-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diff-count {
  font-size: 13px;
  color: #666;
  font-weight: normal;
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

.debug-btn {
  position: fixed;
  bottom: 100px;
  right: 40px;
  width: 50px;
  height: 50px;
  background: #666;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  z-index: 1000;
}

.debug-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 16px;
  max-width: 80%;
  max-height: 80%;
  overflow: auto;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ddd;
}

.debug-header button {
  padding: 4px 12px;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.debug-panel pre {
  font-size: 12px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-info {
  font-size: 10px;
  color: #999;
  margin-left: 8px;
}

.diff-current {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
  padding: 2px 10px;
  background: #f0f0ff;
  border-radius: 10px;
}

.nav-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.nav-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-body {
  overflow-x: auto;
  overflow-y: auto;
  max-height: none;
}

/* 并排对比视图 */
.diff-split {
  display: flex;
  min-width: 0;
  overflow: auto;
}

.split-column {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 1;
  overflow: hidden;
}

.split-column.left {
  border-right: 1px solid #e1e4e8;
}

.split-header {
  padding: 8px 16px;
  background: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
}

.split-content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.split-line-nums {
  flex-shrink: 0;
  width: 50px;
  background: #f6f8fa;
  border-right: 1px solid #e1e4e8;
  overflow: hidden;
}

.split-line-nums .line-num {
  height: 21px;
  padding: 0 8px;
  text-align: right;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 12px;
  color: #999;
  line-height: 21px;
  user-select: none;
}

.split-content-text {
  flex: 1;
  overflow-x: auto;
  overflow-y: visible;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 21px;
}

.diff-line {
  display: flex;
  padding: 0 8px;
  border-radius: 4px;
  margin: 0;
  white-space: pre;
  min-height: 21px;
  box-sizing: border-box;
}

.diff-line.equal {
  color: #666;
}

.diff-line.delete {
  background: #ffeef0;
  color: #dc3545;
}

.diff-line.insert {
  background: #f0fff4;
  color: #28a745;
}

.diff-line.replace {
  background: #ffeeba;
  color: #856404;
  font-weight: 600;
}

/* 行内字符差异高亮 - 与背景形成鲜明对比 */
.char-delete {
  background: #dc3545;
  color: #ffffff;
  text-decoration: line-through;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.char-insert {
  background: #28a745;
  color: #ffffff;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.line-value {
  flex: 1;
}

/* 合并显示视图 */
.diff-unified {
  padding: 12px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 21px;
  overflow-x: auto;
}

.diff-unified .diff-line {
  display: flex;
  align-items: center;
}

.diff-unified .line-num {
  width: 40px;
  color: #999;
  text-align: right;
  padding-right: 8px;
  user-select: none;
  flex-shrink: 0;
}

.diff-unified .line-type {
  width: 20px;
  font-weight: bold;
  user-select: none;
  flex-shrink: 0;
}

.diff-unified .line-value {
  flex: 1;
  white-space: pre;
}

.diff-unified .diff-line.equal {
  color: #666;
}

.diff-unified .diff-line.delete {
  background: #ffeef0;
  color: #dc3545;
}

.diff-unified .diff-line.insert {
  background: #f0fff4;
  color: #28a745;
}

.diff-unified .diff-line.replace {
  background: #ffeeba;
  color: #856404;
  font-weight: 600;
}

.empty-hint {
  text-align: center;
  color: #999;
  padding: 40px 20px;
}

/* 输入区域 */
.input-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 200px;
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

.actions {
  display: flex;
  gap: 8px;
}

.upload-btn,
.clear-btn {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
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

.input-panel textarea {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  outline: none;
}

.input-panel textarea::placeholder {
  color: #999;
}

@media (max-width: 900px) {
  .input-section {
    grid-template-columns: 1fr;
  }

  .diff-split {
    grid-template-columns: 1fr;
  }

  .split-pane.left {
    border-right: none;
    border-bottom: 1px solid #e1e4e8;
  }

  .split-header {
    top: 100px;
  }
}
</style>

<!-- 全局样式 - 用于 v-html 渲染的内容 -->
<style>
.char-delete {
  background: #dc3545 !important;
  color: #ffffff !important;
  text-decoration: line-through;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.char-insert {
  background: #28a745 !important;
  color: #ffffff !important;
  padding: 0 3px;
  border-radius: 3px;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.debug-info {
  font-size: 10px;
  color: #999;
  margin-left: 8px;
}
</style>
