<template>
  <div class="book-list-view">
    <ul class="book-list">
      <book-item
        v-for="book in formattedList"
        :key="book.id"
        :book="book"
        mode="show"
        @download="download(book)"
        @read="read(book)"
      ></book-item>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import BookItem from '@/components/BookItem.vue';
import { dataService } from '@/services/local';
import { formatSize, showToast } from '@/utils';
import router from '@/router';
import { useReadingStore } from '@/stores/reading';

const bookList = ref<(IBookEntity & { downloaded: number, downloadUrl: string })[]>([])

const formattedList = computed(() => {
  return bookList.value.map(item => {
    return {
      ...item,
      status: (item.id === readingStore.readingBookId ? 'reading' : item.downloaded ? 'downloaded' : 'remote') as IBookListItem['status'],
    }
  })
})

const readingStore = useReadingStore()

const refresh = async () => {
  bookList.value = await dataService.getBookList()
}

const download = async (book: IBookListItem) => {
  showToast('开始下载...')
  let timeout: ReturnType<typeof setTimeout>
  let lastExecTime = Date.now()
  const onUpdate = (progress: number, total: number) => {
    if (timeout) { clearTimeout(timeout) }
    if (Date.now() - lastExecTime > 200) {
      lastExecTime = Date.now()
      book.downloading = {
        total,
        downloaded: progress,
        progress: `${formatSize(progress)}/${formatSize(total)}`
      }
      return;
    }
    timeout = setTimeout(() => {
      onUpdate(progress, total)
    }, 200)
  }
  await dataService.downloadRemoteBook(book, onUpdate)
  showToast(`${book.title}下载完成`)
  refresh()
}

const read = async (book: IBookListItem) => {
  book.status = 'reading'
  readingStore.setReadingBookId(book.id)
  router.push({ name: 'read', params: { id: book.id } })
}

refresh()

</script>

<style lang="scss" scoped>
.book-list {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, 100px);
  grid-gap: 10px;
  gap: 10px;
  justify-content: space-around;
  position: relative;
  box-sizing: border-box;
  perspective: 600px;
}
</style>
