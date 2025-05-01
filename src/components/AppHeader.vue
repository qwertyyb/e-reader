<template>
  <header class="app-header">
    <img class="logo" @click="menuDialogVisible=true" src="/icons/icon96.png" />
    <span class="material-symbols-outlined mode-toggle-action header-action"
      v-if="isDarkMode"
      @click="toggleDarkMode">dark_mode</span>
    <span class="material-symbols-outlined mode-toggle-action header-action"
      v-else
      @click="toggleDarkMode">light_mode</span>
    <!-- <span class="header-action select-action">选择</span> -->
    <!-- <span class="header-action select-action" v-if="mode==='select'">取消</span> -->
     <app-menu-dialog :visible="menuDialogVisible" @close="menuDialogVisible=false"></app-menu-dialog>
  </header>
</template>

<script setup lang="ts">
import AppMenuDialog from '@/components/AppMenuDialog.vue';
import { DarkMode } from '@/actions';
import { onUnmounted, ref } from 'vue';

const isDarkMode = ref(false);
const menuDialogVisible = ref(false);

const toggleDarkMode = () => {
  darkModeDetector.toggle()
}

const darkModeDetector = new DarkMode({
  auto: true,
  changeHandler: event => {
    isDarkMode.value = event.detail.enabled
  }
})

onUnmounted(() => darkModeDetector.destroy())

</script>

<style lang="scss" scoped>
.app-header {
  width: calc(100% - 40px);
  height: 48px;
  border-bottom: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-sizing: content-box;
  flex-shrink: 0;
  position: fixed;
  padding-top: var(--sait);
  z-index: 2;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
}
.app-header .logo {
  width: 24px;
  height: 24px;
}
.app-header .header-action {
  margin-left: 8px;
}
.app-header .header-action.mode-toggle-action {
  margin-left: auto;
}
.app-header .select-action {
  font-size: 20px;
}
.app-header #import-file {
  font-size: 32px;
}
</style>
