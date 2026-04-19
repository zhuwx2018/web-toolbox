export const tools = [
  {
    id: 'markdown',
    name: '微信公众号 Markdown 编辑器',
    description: '支持 Markdown 语法高亮，一键复制为公众号适配格式',
    icon: 'M↓',
    route: '/tools/markdown',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
  },
  {
    id: 'text-diff',
    name: '文本差异对比工具',
    description: '对比两个文本，高亮显示差异部分，快速定位修改位置',
    icon: '≡',
    route: '/tools/text-diff',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  {
    id: 'yaml',
    name: 'YAML 文件校验工具',
    description: '校验 YAML 格式是否正确，显示错误位置信息',
    icon: '{}',
    route: '/tools/yaml',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
  },
  {
    id: 'json',
    name: 'JSON 格式化工具',
    description: '格式化 JSON 数据，语法高亮显示，支持压缩',
    icon: '{}',
    route: '/tools/json',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)'
  },
  {
    id: 'image-base64',
    name: '图片 BASE64 转换工具',
    description: '图片与 Base64 文本互转，支持预览和复制',
    icon: '⊞',
    route: '/tools/image-base64',
    gradient: 'linear-gradient(135deg, #30cfd0, #330867)'
  },
  {
    id: 'base64-to-file',
    name: 'Base64 转文件工具',
    description: '将 Base64 字符串转换为指定格式文件并下载',
    icon: '📥',
    route: '/tools/base64-to-file',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)'
  }
]
