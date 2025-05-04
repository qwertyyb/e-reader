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
import router from '@/router';
import { readingStateStore } from '@/services/storage';
import { useRoute } from 'vue-router';
import { setAnimData, animData } from '@/stores/bookAnim';

const bookList = ref<IBookItem[]>([])

const route = useRoute()

const visibleList = computed(() => {
  return bookList.value.map(item => {
    return {
      ...item,
      reading: !!item.localBookId && String(item.trace) === String(animData.value.trace)
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

  const getRemoteBookList = () => window.remoteBooks.map((item) => {
    const localBook = localBooks.find((book) => String(book.onlineBookId) === String(item.id))
    return {
      ...item,
      trace: `${route.path}_${item.id}`,
      reading: false,
      downloaded: !!localBook,
      localBookId: localBook?.id,
      lastReadTime: localBook && reading[localBook.id] ? reading[localBook.id].lastReadTime : 0,
    }
  })

  const getLocalBookList = () => localBooks.map(item => {
    return {
      ...item,
      trace: `${route.path}_${item.id}`,
      reading: false,
      downloaded: true,
      localBookId: item.id,
      lastReadTime: item && reading[item.id] ? reading[item.id].lastReadTime : 0,
    }
  })

  bookList.value = (route.name === 'local' ? getLocalBookList() : getRemoteBookList())
    .sort((prev, next) => Number(next.downloaded) - Number(prev.downloaded) || next.lastReadTime - prev.lastReadTime)
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
    setAnimData({ cover: book.cover, title: book.title, trace: book.trace! })
    router.push({
      name: 'read',
      params: { id: book.localBookId }
    })
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
