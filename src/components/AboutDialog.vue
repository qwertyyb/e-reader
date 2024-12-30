<template>
  <c-dialog :visible="visible" @close="$emit('close')" class="about-dialog">
    <div class="about">
      <img class="logo" src="/icons/icon128.png" />
      <h3 class="name">EInk Reader</h3>
      <p class="version" v-if="version">v{{ version }}</p>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import { ref } from 'vue';

defineProps<{ visible: boolean }>()

const version = ref<string>('')

const getVersion = async () => {
  const r = await fetch('./version.json')
  const json = await r.json()
  version.value = json.version
}

getVersion()

</script>

<style lang="scss" scoped>
.about-dialog .c-dialog-content {
  width: 100%;
}
.about-dialog .about {
  text-align: center;
  height: 160px;
  padding: 20px 0 0 0;
  box-sizing: content-box;
}
.about-dialog .about > * {
  margin-bottom: 16px;
}
.about-dialog .about .logo {
  width: 64px;
  height: 64px;
}
.about-dialog .about .version {
  font-size: 12px;
}
</style>
