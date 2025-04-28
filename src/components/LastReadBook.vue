<template>
  <book-item :book="visibleBook" :no-title="true" @on-tap="toRead" v-if="visibleBook" class="last-read-book" style="width:150px"></book-item>
</template>

<script setup lang="ts">
import { localBookService } from '@/services/LocalBookService';
import { readingStateStore } from '@/services/storage';
import BookItem from '@/components/BookItem.vue';
import { computed, ref } from 'vue';
import router from '@/router';
import { setAnimData, animData } from '@/stores/bookAnim';

const book = ref<IBookItem | null>(null)

const visibleBook = computed(() => {
  if (!book.value) return null
  return {
    ...book.value,
    reading: String(animData.value.trace) === String(book.value?.trace)
  }
})

const getLastReadBook = async () => {
  const readings = await readingStateStore.getList()
  if (!readings.length) {
    return null
  }
  const lastRead = readings.reduce((acc, item) => {
    if (!acc || item.lastReadTime > acc.lastReadTime) {
      return item
    }
    return acc
  }, null as IReadingState | null)

  if (!lastRead) {
    return null
  }
  const books = await localBookService.getBookList()
  const book = books.find((book) => String(book.id) === String(lastRead.bookId))
  if (!book) {
    return null
  }
  return {
    ...book,
    lastReadTime: lastRead.lastReadTime,
  }
}

const toRead = () => {
  if (!book.value) {
    return
  }
  setAnimData({ cover: book.value.cover, title: book.value.title, trace: book.value.trace! })
  router.push({
    name: 'read',
    params: {
      id: book.value.id,
    },
  })
}

getLastReadBook().then((lastReadBook) => {
  if (!lastReadBook) {
    return
  }
  book.value = {
    ...lastReadBook,
    trace: 'last-read',
    id: String(lastReadBook.id),
    reading: false,
    downloaded: true,
  }
})
</script>

<style lang="scss" scoped>
.last-read-book {
  // zoom: 1.5;
}
</style>
