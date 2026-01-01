<template>
  <route-page class="state-view" tag="section">
    <navigation-bar title="在读"></navigation-bar>
    <header class="state-header">
      <c-select v-model="query.sort"
        title="排序"
        :options="sortOptions"
        class="sort-select"
        @change="refresh"
      >
        <template v-slot="{ value, label }">
          <div class="action-btn pointer" :class="{'not-default': value && value !== 'default'}">
            <span class="material-symbols-outlined sort-icon">sort</span>
            <span style="color:inherit">{{ label || '默认' }}</span>
          </div>
        </template>
      </c-select>
    </header>

    <main class="state-main">
      <ul class="book-list">
        <li class="book-item" v-for="item in list" :key="item.id" @click="$router.push({ name: 'readTime', params: { id: item.id } })">
          <img :src="item.cover" alt="" class="book-cover">
          <div class="book-info">
            <h3 class="book-title">{{ item.title }}</h3>
            <p class="book-progress" v-html="item.progress"></p>
            <p class="book-time" v-html="item.time"></p>
            <p class="book-last-read" v-if="item.lastReadTime">{{ item.lastReadTime }}最近在读</p>
          </div>
        </li>
      </ul>
    </main>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue'
import NavigationBar from '@/components/NavigationBar.vue';
import CSelect from '@/components/common/CSelect.vue';
import { booksStore, readingStateStore } from '@/services/storage';
import { ref } from 'vue';
import { formatDuration, formatProgress } from '@/utils';

const query = ref({ sort: 'default' })

const sortOptions = [
  { value: 'default', label: '默认' },
  { value: 'duration', label: '阅读时长' },
  { value: 'progress', label: '阅读进度' },
  { value: 'lastRead', label: '最近阅读' },
]

const list = ref<(ILocalBook & { time: string, progress: string, lastReadTime: string, state: IReadingState | undefined })[]>([])

const refresh = async () => {
  const [state, books] = await Promise.all([
    readingStateStore.getList().then((list) => {
      return list.reduce((acc, item) => {
        acc[item.bookId] = item
        return acc
      }, {} as Record<string, IReadingState | undefined>)
    }),
    booksStore.getList()
  ])
  const results = books.map(book => {
    const rs = state[book.id]
    const progress = !rs?.cursor || !book.maxCursor ? '在读' : rs.cursor / book.maxCursor < 0.01 ? '在读' : `<span class="big-text">${formatProgress(rs.cursor, book.maxCursor)}</span>`
    return {
      ...book,
      state: rs,
      time: formatDuration(rs?.duration || 0).replace(/(\d+)/g, `<span class="big-text">$1</span>`),
      progress,
      lastReadTime: rs?.lastReadTime ? new Date(rs.lastReadTime).toLocaleDateString('zh-CN', { dateStyle: 'medium' }) : ''
    }
  }).sort((prev, next) => {
    if (query.value.sort === 'duration') {
      return (next.state?.duration ?? 0) - (prev.state?.duration ?? 0)
    }
    if (query.value.sort === 'progress') {
      const pp = prev.maxCursor && prev.state ? prev.state.cursor / prev.maxCursor : 0
      const np = next.maxCursor && next.state ? next.state.cursor / next.maxCursor : 0
      return np - pp
    }
    if (query.value.sort === 'lastRead') {
      return (next.state?.lastReadTime ?? 0) - (prev.state?.lastReadTime ?? 0)
    }
    return 0
  })
  list.value = results
}

refresh()

</script>

<style lang="scss" scoped>
@use "../styles/variables";

.state-view {
  display: flex;
  flex-direction: column;
  height: var(--page-height);
}
.state-main {
  padding: 0 16px;
  height: 0;
  flex: 1;
  overflow: auto;
  padding-bottom: var(--saib);
}
.state-header {
  display: flex;
  padding: 4px 0;
  .action-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    font-weight: bold;
    opacity: 0.7;
    font-size: 13px;
    padding: 8px;
    &.not-default {
      color: var(--theme-color);
    }
  }
  .sort-icon {
    margin-right: 4px;
    font-size: 20px;
  }
  .sort-select {
    margin-left: auto;
    display: flex;
    width: fit-content;
    margin-right: 16px;
  }
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
    margin-left: 12px;
  }
  .book-last-read {
    margin-top: auto;
    font-size: 12px;
    opacity: 0.7;
    & + .book-title {
      margin-top: 0;
    }
  }
  .book-title {
    margin-top: auto;
    font-size: 12px;
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.7;
    max-width: calc(100% - 54px);
  }
  .book-time {
    line-height: 1.2;
  }
  .book-progress {
    position: absolute;
    top: 16px;
    right: 16px;
    font-weight: bold;
  }
}


@media (width > variables.$MAX_SMALL_WIDTH) {
  .book-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    .book-item {
      width: 380px;
      & + .book-item {
        margin-top: 0;
      }
    }
  }
}
</style>
