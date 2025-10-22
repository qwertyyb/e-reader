<template>
  <route-page class="advanced-prfs-view">
    <NavigationBar title="高级设置" :no-menu="true"/>

    <div class="prfs-main">
      <div class="prfs-item" @click="prompt('shelfServerUrl')">
        <div class="prfs-label">书架服务URL</div>
        <div class="prfs-control">{{ preferences.shelfServerUrl }}</div>
      </div>

      <div class="prfs-item" @click="prompt('opdsServerUrl')">
        <div class="prfs-label">OPDS URL</div>
        <div class="prfs-control">{{ preferences.opdsServerUrl }}</div>
      </div>

      <div class="prfs-item">
        <div class="prfs-label">TTS 服务</div>
        <c-select
          title="选择 TTS 服务"
          v-model="preferences.tts"
          class="prfs-control"
          style="width:auto"
          :options="[
            { label: 'Edge TTS 服务', value: 'edge-tts', subtitle: '使用Microsoft Edge在线文字转语音服务(效果好，需联网)' },
            { label: '本机 TTS 服务', value: 'local', subtitle: '使用设备本身的文字转语音能力(效果差，无需联网)' },
          ]"
        >
        </c-select>
      </div>

      <div class="prfs-item" @click="aiVisible = true">
        <div class="prfs-label">AI功能配置</div>
        <div class="prfs-control">
          <span class="material-symbols-outlined arrow-icon">chevron_right</span>
        </div>
      </div>
    </div>

    <a-i-prfs-dialog :visible="aiVisible" @close="aiVisible = false" />
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import AIPrfsDialog from '@/components/AIPrfsDialog.vue';
import CSelect from '@/components/common/CSelect.vue';
import { preferences } from '@/stores/preferences'
import { ref } from 'vue';

const aiVisible = ref(false)

if (!preferences.value.tts) {
  preferences.value.tts = 'edge-tts'
}

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
.prfs-main {
  background: var(--card-bg-color);
  border-radius: 6px;
  margin: 16px;
}
.prfs-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 16px;
  padding: 16px 0;
  & + .prfs-item {
    border-top: 1px solid var(--card-border-color);
  }
}
.prfs-label {
  margin-right: auto;
  white-space: nowrap;
  font-weight: bold;
}

.prfs-control {
  margin-left: auto;
  font-size: 16px;
  display: flex;
  align-items: center;
  text-align: right;
  .arrow-icon {
    font-size: 24px;
  }
}
</style>
