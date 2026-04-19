import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MarkdownTool from '../views/tools/MarkdownTool.vue'
import TextDiffTool from '../views/tools/TextDiffTool.vue'
import YamlTool from '../views/tools/YamlTool.vue'
import JsonTool from '../views/tools/JsonTool.vue'
import ImageBase64Tool from '../views/tools/ImageBase64Tool.vue'
import Base64ToFileTool from '../views/tools/Base64ToFileTool.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/tools/markdown', name: 'markdown', component: MarkdownTool },
  { path: '/tools/text-diff', name: 'text-diff', component: TextDiffTool },
  { path: '/tools/yaml', name: 'yaml', component: YamlTool },
  { path: '/tools/json', name: 'json', component: JsonTool },
  { path: '/tools/image-base64', name: 'image-base64', component: ImageBase64Tool },
  { path: '/tools/base64-to-file', name: 'base64-to-file', component: Base64ToFileTool }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
