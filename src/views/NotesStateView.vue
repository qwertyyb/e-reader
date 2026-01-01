<template>
  <route-page class="notes-state-view">
    <navigation-bar no-menu title="笔记"></navigation-bar>
    <main class="notes-state-main">
      <ul class="book-list">
        <li class="book-item"
          v-for="item in books" :key="item.id"
          @click="$router.push({ name: 'notes', params: { id: item.id } })"
        >
          <div class="book-info">
            <p class="book-mark-count"><span class="big-text">{{ item.markCount }}</span>个笔记</p>
            <h3 class="book-title">{{ item.title }}</h3>
            <p class="book-item-footer">{{ item.progress }} | {{ item.duration }}</p>
          </div>
          <img :src="item.cover" alt="" class="book-cover">
        </li>
      </ul>
    </main>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue'
import NavigationBar from '@/components/NavigationBar.vue';
import { booksStore, marks, readingStateStore } from '@/services/storage';
import { shallowRef } from 'vue';
import { formatDuration, formatProgress } from '@/utils';

const books = shallowRef<(IBook & { markCount: number, progress: string, duration: string })[]>([])

const refresh = async () => {
  const [bookList, readingState] = await Promise.all([
    booksStore.getList(),
    readingStateStore.getList().then((list) => {
      return list.reduce((acc, item) => {
        acc[item.bookId] = item
        return acc
      }, {} as Record<string, IReadingState | undefined>)
    }),
  ])
  books.value = (await Promise.all(bookList.map(async (book) => {
    const markCount = await marks.count(Number(book.id))
    const rs = readingState[book.id]
    const progress = !rs?.cursor || !book.maxCursor ? '在读' : rs.cursor / book.maxCursor < 0.01 ? '在读' : formatProgress(rs.cursor, book.maxCursor)
    return {
      ...book,
      markCount,
      progress,
      duration: formatDuration(rs?.duration || 0)
    }
  })))
  .filter(i => i.markCount)
}

refresh()
</script>

<style lang="scss" scoped>
@use "../styles/variables";

.notes-state-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.notes-state-main {
  flex: 1;
  height: 0;
  overflow: auto;
  padding: 16px;
}

.book-item {
  display: flex;
  border-radius: 4px;
  background: var(--card-bg-color);
  padding: 16px;
  position: relative;
  & + .book-item {
    margin-top: 8px;
  }
  :deep(.big-text) {
    font-size: 24px;
    font-weight: bold;
    margin: 0 3px;
  }
  .book-cover {
    width: 60px;
    height: 80px;
    aspect-ratio: 3 / 4;
    border-radius: 4px;
  }
  .book-info {
    width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-right: auto;
  }
  .book-title, .book-item-footer {
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 54px);
  }
  .book-title {
    font-size: 14px;
  }
  .book-item-footer {
    font-size: 12px;
    opacity: 0.7
  }
}

@media (width > variables.$MAX_SMALL_WIDTH) {
  .book-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .book-item {
    width: 380px;
    & + .book-item {
      margin-top: 0;
    }
  }
}
</style>
