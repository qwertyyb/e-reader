<template>
  <div class="book-list-view">
    <ul class="book-list">
      <book-item
        v-for="book in visibleList"
        :key="book.id"
        :book="book"
        mode="show"
        @onTap="onTap(book)"
      ></book-item>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BookItem from '@/components/BookItem.vue';
import { onlineService } from '@/services/OnlineService';
import { formatSize, showToast } from '@/utils';
import { localBookService } from '@/services/LocalBookService';
import { useReadingStore } from '@/stores/reading';
import router from '@/router';
import { readingStateStore } from '@/services/storage';
import { useRoute } from 'vue-router';

const bookList = ref<IBookItem[]>([])
const readingStore = useReadingStore()

const route = useRoute()

const visibleList = computed(() => {
  return bookList.value.map(item => {
    return {
      ...item,
      reading: !!item.localBookId && String(item.localBookId) === String(readingStore.readingBookId)
    }
  })
})

const refresh = async () => {
  const [localBooks, reading] = await Promise.all([
    localBookService.getBookList(),
    readingStateStore.getList().then((list) => {
      return list.reduce((acc, item) => {
        acc[item.bookId] = item
        return acc
      }, {} as Record<string, IReadingState>)
    })
  ])

  bookList.value = window.remoteBooks.map((item) => {
    const localBook = localBooks.find((book) => String(book.onlineBookId) === String(item.id))
    return {
      ...item,
      reading: item.id === String(readingStore.readingBookId),
      downloaded: !!localBook,
      localBookId: localBook?.id,
      lastReadTime: localBook && reading[localBook.id] ? reading[localBook.id].lastReadTime : 0,
    }
  })
    .sort((prev, next) => Number(next.downloaded) - Number(prev.downloaded) || prev.lastReadTime - next.lastReadTime)
    .filter((item) => {
      if (route.name === 'local') {
        return item.downloaded
      }
      return true
  })
}

const download = async ({ id }: IBookItem) => {
  const book = bookList.value.find((item) => item.id === id)!
  book.downloading = true
  onlineService.downloadBook(book.id, (progress, total) => {
    book.downloadProgress = {
      total,
      downloaded: progress,
      percent: Math.floor((progress / total) * 100),
      progress: `${formatSize(progress)}/${formatSize(total)}`
    }
  }).then(() => {
    showToast('下载完成')
    refresh()
  }).catch((err) => {
    showToast('下载失败')
    throw err;
  })
}

const onTap = async (book: IBookItem) => {
  if (book.downloaded) {
    readingStore.setReadingBookId(book.localBookId!)
    router.push({ name: 'read', params: { id: book.localBookId } })
    return;
  }
  await download(book)
}

refresh()

watch(() => route.name, () => {
  refresh()
})

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
