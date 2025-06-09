<template>
  <route-page class="notes-view">
    <navigation-bar no-menu :title="book?.title"></navigation-bar>
    <main class="notes-main">
      <Book-mark-list :book-id="+id"></Book-mark-list>
    </main>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
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
  height: 100%;
  display: flex;
  flex-direction: column;
}
.notes-main {
  height: 0;
  flex: 1;
  overflow: auto;
  padding: 16px;
  border-radius: 6px;
}
</style>
