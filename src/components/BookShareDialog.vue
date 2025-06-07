<template>
  <Teleport to="#app">
    <div
      v-if="visible"
      @click.self="$emit('close')"
      class="book-share-dialog"
    >
      <book-share v-bind="($attrs as any)" ></book-share>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import BookShare from '@/components/BookShare.vue'

defineProps<{
  visible: boolean,
}>()

defineEmits<{ close: [] }>()
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
</style>
