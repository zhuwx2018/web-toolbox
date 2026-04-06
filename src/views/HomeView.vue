<template>
  <div class="home">
    <header class="home-header">
      <h1>在线工具箱</h1>
      <p>高效便捷的在线工具集合</p>
    </header>
    <div class="tools-grid">
      <ToolCard
        v-for="tool in tools"
        :key="tool.id"
        :tool="tool"
      />
    </div>
  </div>
</template>

<script>
import { tools } from '../tools-config'
import ToolCard from '../components/ToolCard.vue'

export default {
  name: 'HomeView',
  components: {
    ToolCard
  },
  data() {
    return {
      tools
    }
  }
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 40px 20px;
}

.home-header {
  text-align: center;
  color: white;
  margin-bottom: 60px;
}

.home-header h1 {
  font-size: 48px;
  margin-bottom: 16px;
  font-weight: 600;
}

.home-header p {
  font-size: 20px;
  opacity: 0.9;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
