<template>
  <div class="notes-view">
    <h2 class="book-title">{{ book?.title }}</h2>
    <Book-mark-list :book-id="+id"></Book-mark-list>
  </div>
</template>

<script setup lang="ts">
import BookMarkList from '@/components/BookMarkList.vue';
import { localBookService } from '@/services/LocalBookService';
import { ref } from 'vue';

const props = defineProps<{
  id: number | string
}>()

const book = ref<IBookEntity>()

const refresh = async () => {
  const result = await localBookService.getBook(String(props.id))
  book.value = result
}

refresh()

</script>

<style lang="scss" scoped>
.notes-view {
  padding: env(safe-area-inset-top) 12px env(safe-area-inset-bottom) 12px;
  background: rgb(238, 238, 238);
}
.book-title {
  margin-bottom: 12px;
}
</style>
