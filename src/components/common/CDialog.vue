<template>
  <teleport to="#app">
    <div class="c-dialog" :class="`dialog-position-${position || 'default'} ${props.class}`" v-if="containerVisible">
      <div class="mask" @pointerdown="$emit('close')" ref="mask"></div>
      <section class="c-dialog-content"
        ref="dialog"
        :style="{ height: props.height || 'auto', width: props.width }"
      >
        <div class="nav-indicator-wrapper" ref="indicator-wrapper">
          <div class="nav-indicator" v-if="position === 'bottom' || !position"></div>
        </div>
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
import { useGesture } from '@/hooks/gesture';
import { onCloseRequest } from '@/platform/close-listener';
import { disableAnim } from '@/utils/env';
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch, type StyleValue } from 'vue';

const props = defineProps<{
  visible: boolean,
  position?: 'left' | 'bottom' | 'center' | 'right',
  height?: string,
  title?: string,
  width?: string,
  class?: string,
  bodyStyle?: StyleValue
}>()

const mask = useTemplateRef('mask')
const dialog = useTemplateRef('dialog')
const indicatorWrapper = useTemplateRef('indicator-wrapper')

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

const getDialogEnterToKeyframe = () => ({ transform: 'translateX(0) translateY(0)' })
const getDialogOutToKeyframe = () => ({ transform: props.position === 'left' ? 'translateX(100%)' : props.position === 'right' ? 'translateX(-100%)' : 'translateY(100%)' })
const getMaskEnterToKeyframe = () => ({ backgroundColor: 'rgba(0, 0, 0, 0.85)' })
const getMaskOutToKeyframe = () => ({ backgroundColor: 'rgba(0, 0, 0, 0)' })

let removeCloseRequestListener: ReturnType<typeof onCloseRequest> | null = null

const closeDialog = async () => {
  removeCloseRequestListener?.()
  if (disableAnim.value) {
    containerVisible.value = false
    emits('closed')
    return;
  }
  await nextTick()
  await Promise.all([
    dialog.value?.animate([getDialogOutToKeyframe()], { duration: 200, easing: 'ease-in', fill: 'both' }).finished,
    mask.value?.animate([getMaskOutToKeyframe()], { duration: 200, easing: 'ease-in', fill: 'both' }).finished
  ])
  containerVisible.value = false
  emits('closed')
}
const openDialog = async () => {
  containerVisible.value = true
  if (!disableAnim.value) {
    await nextTick()
    await Promise.all([
      dialog.value?.animate([getDialogOutToKeyframe(), getDialogEnterToKeyframe()], { duration: 200, easing: 'ease-out' }).finished.then((anim) => anim.commitStyles()),
      mask.value?.animate([getMaskOutToKeyframe(), getMaskEnterToKeyframe()], { duration: 200, easing: 'ease-out' }).finished.then((anim) => anim.commitStyles())
    ])
  }
  // 监听Android返回键
  removeCloseRequestListener = onCloseRequest(closeDialog, { once: true })
}

useGesture(indicatorWrapper, {
  direction: 'vertical',
  onMove(detail) {
    const percentage = Math.min(1, Math.abs(detail.deltaY) / dialog.value!.getBoundingClientRect().height)
    dialog.value?.style.setProperty('transform', `translateY(${Math.max(0, detail.deltaY)}px)`)
    mask.value?.style.setProperty('background-color', `rgba(0, 0, 0, ${0.85 * (1 - percentage)})`)
  },
  async onEnd(detail) {
    const { height } = dialog.value!.getBoundingClientRect()
    if (Math.abs(detail.deltaY) > height * 0.8) {
      closeDialog()
    } else {
      dialog.value?.animate([getDialogEnterToKeyframe()], { duration: 200, easing: 'ease-out' }).finished.then(() => {
        dialog.value!.style.setProperty('transform', getDialogEnterToKeyframe().transform)
      })
      mask.value?.animate([getMaskEnterToKeyframe()], { duration: 200, easing: 'ease-out' }).finished.then(() => {
        mask.value?.style.setProperty('background-color', getMaskEnterToKeyframe().backgroundColor)
      })
    }
  },
})

onBeforeUnmount(() => {
  removeCloseRequestListener?.()
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
  &.dialog-position-left {
    left: initial;
    .c-dialog-content {
      padding-top: max(16px, var(--sait));
    }
  }
  &.dialog-position-center {
    .c-dialog-content {
      border-radius: 6px;
      margin: auto;
      max-width: 600px;
    }
  }
  &.dialog-position-right {
    right: initial;
    .c-dialog-content {
      max-width: 600px;
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
.nav-indicator {
  background: var(--card-light-bg-color);
  width: 60px;
  height: 4px;
  border-radius: 6px;
  margin: 16px auto 8px auto;
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
