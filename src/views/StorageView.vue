<template>
  <slide-back class="storage-view">
    <navigation-bar no-menu title="存储空间"></navigation-bar>
    <div class="storage-main">
      <header class="usage-total">
        <h2 class="total-title">已用空间</h2>
        <div class="total-detail">{{ usageTotal }}</div>

        <h2 class="total-title">可用空间</h2>
        <div class="total-detail">{{ availableTotal }}</div>
      </header>
      <ul class="usage-list" v-if="usageList.length > 0">
        <li class="usage-item" v-for="item in usageList" :key="item.name">
          <h3 class="usage-title">{{ item.title }}</h3>
          <div class="usage-detail">{{ item.usage }}</div>
          <p class="usage-tip">{{ item.desc }}</p>
          <button class="btn primary-btn clear-btn"
            v-if="item.name === 'caches'"
            @click="clearCache"
          >清理</button>
        </li>
      </ul>
    </div>
  </slide-back>
</template>

<script setup lang="ts">
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import { onMounted, ref } from 'vue';
import { formatSize, showToast } from '@/utils';
import { clearAllCache } from '@/utils/cache';

const usageTotal = ref('');
const availableTotal = ref('');
const usageList = ref<{ name: string, usage: string, title: string, desc: string }[]>([])

const details = {
  indexedDB: {
    title: '书籍信息',
    desc: '包含已下载的书籍、阅读进度、笔记'
  },
  caches: {
    title: '应用缓存',
    desc: '应用离线访问所需要的资源，包含页面、样式、字体、图片、书架等'
  }
}

const refresh = () => {
  const storage = navigator.storage;
  storage.estimate().then(({ usage, quota, ...rest }) => {
    if (!usage || !quota) {
      usageTotal.value = 'unknown'
      availableTotal.value = 'unknown'
      return;
    }
    usageTotal.value = formatSize(usage)
    availableTotal.value = formatSize(quota - usage);
    // usageDetails is not standard, so check if it exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const usageDetails = (rest as any).usageDetails;
    if (usageDetails) {
      usageList.value = Object.entries(usageDetails).map(([name, usage]) => ({
        name, usage: formatSize(usage as number),
        ...details[name as keyof typeof details]
      }));
    }
  });
};

onMounted(refresh)

const clearCache = async () => {
  await clearAllCache()
  showToast('缓存已清除')
  refresh()
}
</script>

<style lang="scss" scoped>
.storage-view {
  height: var(--page-height);
}
.storage-main {
  padding: 16px;
}
.total-title {
  margin-top: 24px;
  font-size: 16px;
  font-weight: normal;
  &:first-child {
    margin-top: 0;
  }
}
.total-detail {
  margin-top: 8px;
  font-size: 32px;
  font-weight: bold;
}
.usage-list {
  list-style: none;
}
.usage-item {
  margin-top: 24px;
  background: var(--card-bg-color);
  padding: 16px;
  border-radius: 4px;
  position: relative;
}
.usage-title {
  font-size: 14px;
  font-weight: normal;
}
.usage-detail {
  font-size: 28px;
  margin-top: 8px;
  font-weight: bold;
}
.usage-tip {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.7;
}
.clear-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 16px;
}
</style>