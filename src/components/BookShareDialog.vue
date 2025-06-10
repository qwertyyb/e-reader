<template>
  <Teleport to="#app">
    <div
      v-if="visible"
      @click.self="$emit('close')"
      class="book-share-dialog"
    >
      <div class="share-dialog-content" :style="{ transform: `scale(${scale})` }">
        <span class="material-symbols-outlined close-icon pointer" @click="$emit('close')">close</span>
        <book-share v-bind="($attrs as any)" @success="calcScale"></book-share>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import BookShare from '@/components/BookShare.vue'
import { shallowRef, watchEffect } from 'vue';

const props = defineProps<{
  visible: boolean,
}>()

defineEmits<{ close: [] }>()

const scale = shallowRef(1);

watchEffect(() => {
  if (props.visible) {
    scale.value = 1
  }
});

const calcScale = () => {
  scale.value = Math.min(window.innerWidth / 400, window.innerHeight / 700);
}

</script>

<style lang="scss" scoped>
.book-share-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.65);
  z-index: 10;
}
.share-dialog-content {
  display: flex;
  flex-direction: column;
}
.close-icon {
  font-size: 32px;
  padding: 4px;
  color: #fff;
  margin-left: auto;
  margin-bottom: 12px;
}
</style>
