<template>
  <transition name="fade-in"
    @enter="contentVisible=true">
    <div class="c-dialog" v-if="containerVisible">
      <div class="mask" @pointerdown="$emit('close')"></div>
      <transition :name="anim" @after-leave="containerVisible=false">
        <div class="c-dialog-content" v-if="contentVisible">
          <slot></slot>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  visible: boolean,
  anim?: string
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

.c-dialog .c-dialog-content {
  width: 100%;
  background: #fff;
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
