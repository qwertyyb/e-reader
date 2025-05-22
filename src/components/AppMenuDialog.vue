<template>
  <div class="menu-dialog">
    <c-dialog :visible="visible"
      class="menu-dialog"
      @close="$emit('close')">
      <ul class="menu">
        <li class="menu-item" @click="$router.push({ name: 'preferences' })">设置</li>
        <li class="menu-item" @click="clearCache()">清除缓存</li>
        <li class="menu-item" @click="checkUpdates()">检查更新</li>
        <li class="menu-item" @click="dialog='about'">关于EInk Reader</li>
      </ul>
      <about-dialog :visible="dialog==='about'" @close="dialog=null"></about-dialog>
    </c-dialog>
  </div>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import AboutDialog from '@/components/AboutDialog.vue';
import { bridge } from '@/register-sw';
import { showToast } from '@/utils';
import { ref } from 'vue';

defineProps<{ visible: boolean }>()

const emits = defineEmits<{ close: [] }>()

const dialog = ref<string | null>(null)

const clearCache = async () => {
  await bridge.invoke('deleteAllCache')
  showToast('缓存已清除')
}
const checkUpdates = async () => {
  emits('close')
  document.dispatchEvent(new CustomEvent('app:checkupdates', { detail: { slient: false } }))
}
</script>

<style lang="scss" scoped>
.menu-dialog .menu {
  box-sizing: border-box;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: flex-end;
}
.menu-dialog .menu {
  list-style: none;
}
.menu-dialog .menu-item {
  padding: 8px 0;
  font-size: 18px;
  cursor: pointer;
}
</style>
