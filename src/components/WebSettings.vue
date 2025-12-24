<template>
  <c-dialog
    :visible="visible"
    @close="$emit('close')"
    position="center"
    title="设置"
  >
    <header class="header">
      <ul class="tab-nav-list">
        <li class="tab-nav-item pointer"
          @click="tabName = 'basic'"
          :class="{selected: tabName === 'basic'}"
        >基础</li>
        <li class="tab-nav-item pointer"
          @click="tabName = 'services'"
          :class="{selected: tabName === 'services'}"
        >服务</li>
        <li class="tab-nav-item pointer"
          @click="tabName = 'debug'"
          :class="{selected: tabName === 'debug'}"
        >开发</li>
        <li class="tab-nav-item pointer"
          @click="tabName = 'about'"
          :class="{selected: tabName === 'about'}"
        >关于</li>
      </ul>
    </header>
    <settings-panel v-model:name="tabName"></settings-panel>
  </c-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CDialog from './common/CDialog.vue';
import SettingsPanel from './SettingsPanel.vue';

defineProps<{
  visible: boolean,
}>()

const tabName = ref('basic')

</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  &::before, &::after {
    content: " ";
    display: block;
    height: 1px;
    flex: 1;
    background-color: var(--border-color);
  }
}
.tab-nav-list {
  display: flex;
  align-items: center;
  background-color: var(--card-bg-color);
  border-radius: 6px;
  overflow: hidden;
  .tab-nav-item {
    padding: 6px 16px;
    font-size: 14px;
    & + .tab-nav-item {
      border-left: 1px solid var(--border-color);
    }
  }
}
</style>
