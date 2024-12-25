<template>
  <div class="book-list-view">
    <ul class="book-list">
      <book-item
        v-for="book in bookList"
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
import { ref } from 'vue';

import BookItem from '@/components/BookItem.vue';
import { dataService } from '@/services/local';
import { formatSize, showToast } from '@/utils';
import router from '@/router';

const bookList = ref<IBookListItem[]>([])

const refresh = async () => {
  const list = await dataService.getBookList()
  console.table(list)
  bookList.value = list.map(item => {
    return {
      ...item,
      status: item.downloaded ? 'downloaded' : 'remote',
    }
  })
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
  // @todo 开书动画
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
  padding-bottom: calc(54px + env(safe-area-inset-bottom));
  position: relative;
  box-sizing: border-box;
}
</style>
