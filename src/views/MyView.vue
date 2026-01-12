<template>
  <section class="my-view">
    <div class="navigation-bar">
      <span v-if="isSmall" class="material-symbols-outlined pointer settings-icon"
        @click="$router.push({ name: 'preferences' })">tune</span>
    </div>
    <header class="my-info">
      <img :src="'./icons/icon128.png'" alt="" class="avatar">
      <p class="my-nick">昵称</p>
    </header>
    <main class="my-main">
      <ul class="my-list">
        <li class="my-item duration-stats-item pointer" @click="$router.push({ name: 'durationStats' })">
          <h3 class="item-title">阅读统计</h3>
          <span class="material-symbols-outlined wrap-icon">stacked_bar_chart</span>
          <div class="item-desc" v-html="durationTotal"></div>
        </li>
        <li class="my-item duration-item pointer" @click="$router.push({ name: 'readingStats' })">
          <h3 class="item-title">在读</h3>
          <span class="material-symbols-outlined wrap-icon">auto_stories</span>
          <div class="item-desc" v-html="bookTotal"></div>
        </li>
        <li class="my-item notes-item pointer" @click="$router.push({ name: 'notesStats' })">
          <h3 class="item-title">笔记</h3>
          <span class="material-symbols-outlined wrap-icon">history_edu</span>
          <div class="item-desc" v-html="marksTotal"></div>
        </li>
      </ul>
    </main>
  </section>
</template>

<script setup lang="ts">
import { marks, readingStateStore } from '@/services/storage';
import { formatDuration } from '@/utils';
import { isSmall } from '@/utils/env';
import { ref } from 'vue';

const durationTotal = ref('')
const bookTotal = ref('')
const marksTotal = ref('')

const refreshDuration = async () => {
  const list = await readingStateStore.getList()
  const duration = list.reduce((acc, item) => acc + (item.duration ?? 0), 0)
  const books = new Set(list.map(item => item.bookId)).size
  bookTotal.value = `<span class="big-text num">${books}</span>本`
  durationTotal.value = formatDuration(duration).replace(/(\d+)/g, `<span class="big-text num">$1</span>`)
}

const refreshMarks = async () => {
  marksTotal.value = `<span class="big-text num">${await marks.count()}</span>个`
}

const refresh = () => {
  refreshDuration()
  refreshMarks()
}

refresh()
</script>

<style lang="scss" scoped>
@use "../styles/variables";

.my-view {
  padding: var(--sait) 16px 0 16px;
}
.navigation-bar {
  display: flex;
  justify-content: flex-end;
}
.settings-icon {
  padding: 6px;
  font-size: 24px;
}
.my-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0 30px 0;
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
  }
  .my-nick {
    margin-top: 12px;
    font-weight: 500;
    font-size: 14px;
  }
}
:deep(.big-text) {
  font-weight: bold;
  font-size: 28px;
  margin: 0 3px;
}
.my-list {
  list-style: none;
}
.my-item {
  background: var(--card-bg-color);
  border-radius: 4px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  & + .my-item {
    margin-top: 12px;
  }
  .wrap-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding-left: 16px;
    padding-top: 28px;
    font-size: 48px;
    opacity: 0.1;
  }
  .item-desc {
    margin-top: 8px;
    text-align: right;
  }
  .item-more {
    transform: translateY(-50%);
    position: absolute;
    top: 50%;
    right: 16px;
    opacity: 0.7;
  }
  .item-title {
    font-size: 13px;
  }
}

@media (width > variables.$MAX_SMALL_WIDTH) {
  .my-main {
    display: flex;
  }
  .my-list {
    margin: auto;
    display: flex;
    gap: 12px;
  }
  .my-item {
    height: 100px;
    width: 300px;
    display: flex;
    flex-direction: column;
    & + .my-item {
      margin-top: 0;
    }
  }
}
</style>
