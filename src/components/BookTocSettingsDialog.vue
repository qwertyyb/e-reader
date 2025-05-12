<template>
  <c-dialog title="目录设置" :visible="visible" @close="$emit('close')">
    <book-toc-settings :book-id="bookId"></book-toc-settings>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import BookTocSettings from '@/components/BookTocSettings.vue';

defineProps<{ visible: boolean, bookId: number | string }>()
defineEmits<{ close: [] }>()
</script>
