<template>
  <div class="tab-view book-shelf">
    <app-header></app-header>
    <div class="tab-panel-container">
      <router-view></router-view>
    </div>
    <ul class="tab-nav-list">
      <li class="tab-nav-item" @click="$router.push({ name: 'local' })">
        <span class="material-symbols-outlined">newsstand</span>
        本地
      </li>
      <li class="last-read-item" v-if="book">
        <book-item :book="book" :no-title="true" @on-tap="toRead"></book-item>
      </li>
      <li class="tab-nav-item" @click="$router.push({ name: 'remote' })">
        <span class="material-symbols-outlined">storefront</span>
        在线
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import { localBookService } from '@/services/LocalBookService';
import { readingStateStore } from '@/services/storage';
import BookItem from '@/components/BookItem.vue';
import { ref } from 'vue';
import router from '@/router';

const book = ref<IBookItem | null>(null)

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
  // readingStore.setReadingBookId(book.value.id!)
  book.value.reading = true
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
    id: String(lastReadBook.id),
    reading: false,
    downloaded: true,
  }
})

</script>

<style lang="scss" scoped>
.tab-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.tab-panel-container {
  padding-top: calc(env(safe-area-inset-top) + 48px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 60px);
  min-height: 100vh;
}
.tab-nav-list {
  display: flex;
  list-style: none;
  padding-bottom: env(safe-area-inset-bottom);
  width: 100%;
  height: 54px;
  box-sizing: content-box;
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
}
.tab-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.last-read-item {
  height: 140px;
  align-self: flex-end;
  margin-bottom: 12px;
}
</style>
