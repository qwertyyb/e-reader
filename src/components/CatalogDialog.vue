<template>
  <div class="catalog-dialog" :style="{ zIndex: zIndex, opacity: zIndex < 0 ? '0' : '1'}">
    <div class="mask" :class="maskAnim" @click="$emit('close')"></div>
    <div class="catalog-content" :class="anim" ref="list-wrapper">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { env } from '@/utils/env';
import { ref, watch } from 'vue';

const props = defineProps<{ visible: boolean }>()

const anim = ref<'slide-left' | 'slide-left-leave' | ''>('')
const zIndex = ref(-1)
const maskAnim = ref<'fade-in' | 'fade-out' | ''>('')

watch(() => props.visible, () => {
  if (props.visible) {
    zIndex.value = 10
    if (env.isInk()) {
      return
    }
    anim.value = 'slide-left'
    maskAnim.value = 'fade-in'
    setTimeout(() => {
      anim.value = ''
      maskAnim.value = ''
    }, 200)
  } else {
    if (env.isInk()) {
      zIndex.value = -1
      return
    }
    anim.value = 'slide-left-leave'
    maskAnim.value = 'fade-out'
    setTimeout(() => {
      zIndex.value = -1
      anim.value = ''
      maskAnim.value = ''
    }, 200)
  }
})
</script>

<style lang="scss" scoped>
.catalog-dialog {
  position: relative;
}
.catalog-content {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  border-right: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  width: 80vw;
  max-width: 330px;
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
  z-index: 10;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: var(--sait);
  padding-bottom: var(--saib);
  box-sizing: border-box;
}
.catalog-content > div {
  box-sizing: border-box;
}
</style>
