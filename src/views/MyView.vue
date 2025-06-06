<template>
  <section class="my-view">
    <div class="navigation-bar">
      <span class="material-symbols-outlined pointer settings-icon" @click="$router.push({ name: 'preferences' })">tune</span>
    </div>
    <header class="my-info">
      <img :src="'./icons/icon128.png'" alt="" class="avatar">
      <p class="my-nick">昵称</p>
    </header>
    <main class="my-main">
      <ul class="my-list">
        <li class="my-item duration-item pointer" @click="$router.push({ name: 'state' })">
          <h3 class="item-title">阅读时长</h3>
          <div class="item-desc" v-html="durationTotal"></div>
          <p class="item-more"><span class="material-symbols-outlined">arrow_forward_ios</span></p>
        </li>
      </ul>
    </main>
  </section>
</template>

<script setup lang="ts">
import { readingStateStore } from '@/services/storage';
import { formatDuration } from '@/utils';
import { ref } from 'vue';

const durationTotal = ref('')

const refresh = async () => {
  const list = await readingStateStore.getList()
  const duration = list.reduce((acc, item) => acc + (item.duration ?? 0), 0)
  durationTotal.value = formatDuration(duration).replace(/(\d+)/g, `<span class="big-text">$1</span>`)
}

refresh()
</script>

<style lang="scss" scoped>
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
    background: var(--card-bg-color);
    box-shadow: 0 7px 14px var(--shadow-color);
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
  &.duration-item {
    .item-desc {
      margin-top: 8px;
    }
    .item-more {
      transform: translateY(-50%);
      position: absolute;
      top: 50%;
      right: 16px;
      opacity: 0.7;
    }
  }
  .item-title {
    font-size: 13px;
  }
}
</style>
