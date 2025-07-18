<template>
  <teleport to="#app">
    <div class="c-dialog" :class="`dialog-position-${position || 'default'} ${props.class}`" v-if="containerVisible">
      <div class="mask" @pointerdown="$emit('close')" ref="mask"></div>
      <section class="c-dialog-content"
        ref="dialog"
        :style="{ height: props.height || 'auto', width: props.width }"
      >
        <header class="c-dialog-header" v-if="$slots.header || title || $slots.title">
          <slot name="header">
            <slot name="title">
              <h2 class="c-dialog-title" v-if="title">{{ title }}</h2>
            </slot>
            <span class="material-symbols-outlined close-icon pointer" @click="$emit('close')">keyboard_arrow_down</span>
          </slot>
        </header>
        <main class="c-dialog-main" :style="bodyStyle">
          <slot></slot>
        </main>
      </section>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { disableAnim } from '@/utils/env';
import { nextTick, ref, useTemplateRef, watch, type StyleValue } from 'vue';

const props = defineProps<{
  visible: boolean,
  position?: 'left' | 'bottom',
  height?: string,
  title?: string,
  width?: string,
  class?: string,
  bodyStyle?: StyleValue
}>()

const mask = useTemplateRef('mask')
const dialog = useTemplateRef('dialog')

const emits = defineEmits<{
  open: []
  close: []
  closed: []
}>()

const containerVisible = ref(props.visible)

watch(() => props.visible, () => {
  if (props.visible) {
    openDialog()
    emits('open')
  } else {
    closeDialog()
  }
})

const fadeInKeyframes = [
  { backgroundColor: 'rgba(0, 0, 0, 0)' },
  { backgroundColor: 'rgba(0, 0, 0, 0.85)'}
]
const slideLeftInKeyframes = [
  { transform: 'translateX(100%)' },
  { transform: 'translateX(0)'}
]
const slideUpInKeyframes = [
  { transform: 'translateY(100%)' },
  { transform: 'translateY(0)'}
]

const getInKeyframes = () => props.position === 'left' ? slideLeftInKeyframes : slideUpInKeyframes

const closeDialog = async () => {
  if (disableAnim.value) {
    containerVisible.value = false
    emits('closed')
    return;
  }
  await nextTick()
  await Promise.all([
    dialog.value?.animate(getInKeyframes().toReversed(), { duration: 200, easing: 'ease-in', fill: 'both' }).finished,
    mask.value?.animate(fadeInKeyframes.toReversed(), { duration: 200, easing: 'ease-in', fill: 'both' }).finished
  ])
  containerVisible.value = false
  emits('closed')
}
const openDialog = async () => {
  containerVisible.value = true
  if (disableAnim.value) return;
  await nextTick()
  await Promise.all([
    dialog.value?.animate(getInKeyframes(), { duration: 200, easing: 'ease-out', fill: 'both' }).finished,
    mask.value?.animate(fadeInKeyframes, { duration: 200, easing: 'ease-out', fill: 'both' }).finished
  ])
}
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
  &.dialog-position-left {
    left: initial;
    .c-dialog-content {
      padding-top: max(16px, var(--sait));
    }
  }
}

.c-dialog-content {
  width: 100%;
  background: var(--bg-color);
  z-index: 10;
  padding-bottom: max(16px, var(--saib));
  box-sizing: border-box;
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
  justify-content: space-between;
  padding: 12px 16px 8px 16px;
  position: relative;
  &:empty {
    display: none;
  }
  .close-icon {
    font-size: 22px;
    padding: 4px;
    font-weight: 600;
  }
}
.c-dialog-title {
  font-size: 16px;
  font-weight: bold;
}
.c-dialog-main {
  // height: 0;
  height: fit-content;
  overflow: auto;
  flex: 1;
  padding-left: 16px;
  padding-right: 16px;
}
</style>
