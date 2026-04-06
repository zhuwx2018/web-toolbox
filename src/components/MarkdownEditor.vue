<template>
  <div class="editor-container">
    <div class="editor-header">
      <span class="title">编辑区</span>
      <div class="actions">
        <label class="upload-btn">
          <input type="file" accept=".md,.markdown" @change="handleFileUpload" hidden />
          上传文件
        </label>
        <button class="clear-btn" @click="$emit('clear')">清空</button>
      </div>
    </div>
    <div
      class="editor-area"
      :class="{ 'dragover': isDragover }"
      @dragover.prevent="isDragover = true"
      @dragleave.prevent="isDragover = false"
      @drop.prevent="handleDrop"
    >
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        placeholder="在此输入 Markdown 文本，或拖拽 .md 文件到此处..."
        spellcheck="false"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'fileLoaded', 'clear'])

const isDragover = ref(false)

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (file) {
    readFile(file)
  }
  event.target.value = ''
}

function handleDrop(event) {
  isDragover.value = false
  const file = event.dataTransfer.files[0]
  if (file && (file.name.endsWith('.md') || file.name.endsWith('.markdown'))) {
    readFile(file)
  }
}

function readFile(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    emit('fileLoaded', e.target.result)
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.editor-header {
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
  gap: 12px;
}

.upload-btn,
.clear-btn {
  padding: 6px 12px;
  font-size: 13px;
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

.editor-area {
  flex: 1;
  position: relative;
}

.editor-area.dragover {
  background: #f0f9f4;
}

.editor-area textarea {
  width: 100%;
  height: 100%;
  padding: 16px;
  border: none;
  resize: none;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: transparent;
  outline: none;
}

.editor-area textarea::placeholder {
  color: #999;
}
</style>
