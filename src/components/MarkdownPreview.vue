<template>
  <div class="preview-container">
    <div class="preview-header">
      <span class="title">预览区</span>
      <div class="actions">
        <button class="debug-btn" @click="$emit('showHtml', wechatHtml)">
          查看HTML
        </button>
        <button class="copy-btn" @click="$emit('copy')">
          复制到公众号
        </button>
      </div>
    </div>
    <div class="preview-content wechat-preview" v-html="html"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { parseMarkdown, toWechatHTML } from '../utils/markdown'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

defineEmits(['copy', 'showHtml'])

const html = computed(() => {
  if (!props.content.trim()) {
    return '<p style="color: #999; text-align: center; padding: 40px;">预览区将显示渲染后的 Markdown 内容</p>'
  }
  return parseMarkdown(props.content)
})

const wechatHtml = computed(() => {
  if (!props.content.trim()) return ''
  return toWechatHTML(props.content)
})
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e4e8;
}

.title {
  font-weight: 600;
  color: #333;
}

.actions {
  display: flex;
  gap: 8px;
}

.debug-btn {
  padding: 6px 12px;
  font-size: 13px;
  background: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.debug-btn:hover {
  color: #333;
  border-color: #333;
}

.copy-btn {
  padding: 6px 16px;
  font-size: 13px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #06ad56;
}

.preview-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  background: #fff;
}

.preview-content:deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
