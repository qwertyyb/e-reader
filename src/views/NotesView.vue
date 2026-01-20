<template>
  <route-page class="notes-view">
    <navigation-bar no-menu :title="book?.title"></navigation-bar>
    <main class="notes-main">
      <div class="book-info">
        <img :src="book?.cover" alt="" class="book-cover">
        <div class="book-info-content">
          <h3 class="book-title">{{ book?.title }}</h3>
          <p class="summary-desc" v-if="readingState && book"><span class="material-symbols-outlined icon progress-icon">arrow_cool_down</span>已读到{{ (readingState.cursor / book.maxCursor * 100).toFixed(0) + '%' }} · {{ marksCount }}条笔记</p>
          <p class="summary-desc"><span class="material-symbols-outlined icon duration-icon">trending_up</span>{{ formatDuration(readingState?.duration || 0) }} · <router-link class="summary-link" :to="{ name: 'readTime', params: { id: props.id } }">阅读明细</router-link></p>
        </div>
      </div>
      <book-mark-list :book-id="+id"></book-mark-list>
    </main>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import BookMarkList from '@/components/BookMarkList.vue';
import { localBookService } from '@/services/LocalBookService';
import { ref } from 'vue';
import { formatDuration } from '@/utils';
import { marks, readingStateStore } from '@/services/storage';

const props = defineProps<{
  id: number | string
}>()

const book = ref<ILocalBook>()
const readingState = ref<IReadingState>()
const marksCount = ref(0)

const refresh = async () => {
  const [result, rs, count] = await Promise.all([
    localBookService.getBook(String(props.id)),
    readingStateStore.get(String(props.id)),
    marks.count(Number(props.id)),
  ]);
  book.value = result
  readingState.value = rs
  marksCount.value = count
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
  .book-info {
    display: flex;
    margin-bottom: 16px;
    background: var(--card-bg-color);
    padding: 16px;
    border-radius: 6px;
    .book-cover {
      width: 80px;
    }
    .book-info-content {
      margin-left: 12px;
    }
    .book-title {
      margin-bottom: 12px;
    }
    .summary-desc {
      display: flex;
      align-items: center;
      font-size: 13px;
      .icon {
        margin-right: 6px;
        &.progress-icon {
          transform: rotate(-90deg);
        }
      }
    }
    .summary-link {
      margin-left: 0.6em;
      color: var(--theme-color);
    }
  }
}
</style>
