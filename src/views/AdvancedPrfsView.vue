<template>
  <slide-back class="advanced-prfs-view">
    <NavigationBar title="高级设置" :no-menu="true"/>

    <div class="prfs-item" @click="prompt('shelfServerUrl')">
      <div class="prfs-label">书架服务URL</div>
      <div class="prfs-control"><p>{{ preferences.shelfServerUrl }}</p></div>
    </div>

    <div class="prfs-item" @click="prompt('opdsServerUrl')">
      <div class="prfs-label">OPDS URL</div>
      <div class="prfs-control"><p>{{ preferences.opdsServerUrl }}</p></div>
    </div>

    <div class="prfs-item" @click="aiVisible = true">
      <div class="prfs-label">AI功能配置</div>
      <div class="prfs-control">
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </div>
    </div>

    <a-i-prfs-dialog :visible="aiVisible" @close="aiVisible = false" />
  </slide-back>
</template>

<script setup lang="ts">
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import AIPrfsDialog from '@/components/AIPrfsDialog.vue';
import { preferences } from '@/stores/preferences'
import { ref } from 'vue';

const aiVisible = ref(false)

const prompt = (name: 'shelfServerUrl' | 'opdsServerUrl') => {
  const newValue = window.prompt(`请输入${name}`, preferences.value[name])
  // 对用户输入的 URL 进行校验

  if (newValue !== null) {
    preferences.value[name] = newValue.trim()
  }
}
</script>

<style lang="scss" scoped>
.advanced-prfs-view {
  max-width: 600px;
  height: var(--page-height);
}

.prfs-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e5ea;
}

.prfs-control {
  width: auto;
  margin-left: auto;
  font-size: 18px;
  display: flex;
  .arrow-icon {
    font-size: 24px;
  }
}
</style>
