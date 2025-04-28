<template>
  <transition name="fade-in"
    @enter="contentVisible=true">
    <div class="c-dialog" v-if="containerVisible">
      <div class="mask" @pointerdown="$emit('close')"></div>
      <transition :name="anim" @after-leave="containerVisible=false">
        <section class="c-dialog-content" v-if="contentVisible" :style="{ height: props.height || 'auto' }">
          <header class="c-dialog-header">
            <slot name="header">
              <h2 class="c-dialog-title" v-if="title">{{ title }}</h2>
            </slot>
          </header>
          <slot></slot>
        </section>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  visible: boolean,
  anim?: string,
  height?: string,
  title?: string,
}>(), { anim: 'slide-up' })

const emits = defineEmits<{
  open: []
  close: []
}>()

const containerVisible = ref(props.visible)
const contentVisible = ref(props.visible)

watch(() => props.visible, () => {
  if (props.visible) {
    containerVisible.value = true
    emits('open')
  } else {
    contentVisible.value = false
  }
})
</script>

<style lang="scss" scoped>
.c-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  z-index: 10;
}

.c-dialog-content {
  width: 100%;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
  overflow: auto;
  display: flex;
  flex-direction: column;
  & > * {
    width: 100%;
  }
}
.c-dialog-header {
  display: flex;
  align-items: center;
  padding: 12px 16px 8px 16px;
}
.c-dialog-title {
  font-size: 16px;
  font-weight: bold;
}
</style>
