<template>
  <div class="tool-card" :style="{ background: tool.gradient }" @click="goToTool">
    <div class="tool-icon">{{ tool.icon }}</div>
    <h3 class="tool-name">{{ tool.name }}</h3>
    <p class="tool-description">{{ tool.description }}</p>
    <div class="tool-arrow">→</div>
  </div>
</template>

<script>
export default {
  name: 'ToolCard',
  props: {
    tool: {
      type: Object,
      required: true
    }
  },
  methods: {
    goToTool() {
      this.$router.push(this.tool.route)
    }
  }
}
</script>

<style scoped>
.tool-card {
  border-radius: 16px;
  padding: 32px;
  color: white;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tool-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.tool-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.tool-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
}

.tool-description {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.6;
}

.tool-arrow {
  position: absolute;
  right: 24px;
  bottom: 24px;
  font-size: 24px;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.tool-card:hover .tool-arrow {
  opacity: 1;
  transform: translateX(4px);
}
</style>
