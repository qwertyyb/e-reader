<template>
  <slide-back class="read-time-view">
    <navigation-bar no-menu title="阅读明细"></navigation-bar>
    <main class="read-time-main">
      <ul class="summary-list">
        <li class="summary-item" v-for="summary in summaryList" :key="summary.title">
          <h3 class="summary-title">{{ summary.title }}</h3>
          <div class="summary-text" v-html="summary.text"></div>
          <div class="summary-detail">{{ summary.desc }}</div>
        </li>
      </ul>
      <ul class="group-list">
        <li class="group-item" v-for="(item, index) in timeList" :key="index">
          <h4 class="group-title" v-if="timeList.length > 1">{{ item.title }}</h4>
          <ul class="group-time-list">
            <li class="group-time-item" v-for="time in item.list" :key="time.title">
              <div class="group-time-value-progress" :style="{width: time.width}">
                <span class="group-time-title">{{ time.title }}</span>
                <span class="group-time-value">{{ time.value }}</span>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </main>
    <footer class="read-time-footer">
      <button class="btn text-btn">点评此书</button>
      <button class="btn primary-btn">分享阅读成就</button>
    </footer>
  </slide-back>
</template>

<script setup lang="ts">
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import { shallowRef } from 'vue';
import { readTimeStore } from '@/services/storage';
import { formatDuration } from '@/utils';

const props = defineProps<{ id: string }>()

interface ITimeItem {
  title: string,
  list: { title: string, value: string, duration: number, width: string }[]
}

const summaryList = shallowRef<{ title: string, text: string, desc: string }[]>([
  { title: '累计时长', text: '<span class="big-text">53</span>小时<span class="big-text">18</span>分钟', desc: '2020年5月18日开始阅读'},
  { title: '阅读天数', text: '<span class="big-text">6</span>天', desc: '上次阅读'},
  { title: '想法笔记', text: '<span class="big-text">6</span>条', desc: '2020年5月18日开始阅读'},
  { title: '单日阅读最久', text: '<span class="big-text">6</span>分钟', desc: '2020年5月18日'}
])

const timeList = shallowRef<ITimeItem[]>([
  {
    title: '6月 九分钟',
    list: [
      { title: '14日', value: '9分钟', duration: 540, width: '75%' },
      { title: '12日', value: '12分钟', duration: 720, width: '100%' },
      { title: '6日', value: '3分钟', duration: 180, width: '25%' },
      { title: '4日', value: '8分钟', duration: 480, width: '66.7%' },
      { title: '3日', value: '10分钟', duration: 600, width: '83.3%' }
    ]
  },
  {
    title: '6月 九分钟',
    list: [
      { title: '14日', value: '9分钟', duration: 540, width: '75%' },
      { title: '12日', value: '12分钟', duration: 720, width: '100%' },
      { title: '6日', value: '3分钟', duration: 180, width: '25%' },
      { title: '4日', value: '8分钟', duration: 480, width: '66.7%' },
      { title: '3日', value: '10分钟', duration: 600, width: '83.3%' }
    ]
  }
])

const refresh = async () => {
  const list = await readTimeStore.getListByBookId(props.id)
  const max = Math.max(...list.map(i => i.duration))
  const results: Record<string, IReadTime[] | undefined> = {}
  list.forEach(item => {
    const month = item.date.match(/^(\d+\/\d+)/)![1]
    if (results[month]) {
      results[month] = [...results[month], item]
    } else {
      results[month] = [item]
    }
  })
  timeList.value = Object.entries(results).map(([month, list]) => {
    return {
      title: month,
      list: list!.map(item => {
        return {
          title: parseInt(item.date.match(/^\d+\/\d+\/(\d+)/)![1], 10) + '日',
          value: formatDuration(item.duration) + '分钟',
          duration: item.duration,
          width: (item.duration / max * 100) + '%'
        }
      })
    }
  })
  console.log(results)
}

refresh()

</script>

<style lang="scss" scoped>
.read-time-view {
  height: var(--page-height);
  display: flex;
  flex-direction: column;
}
.read-time-main {
  margin: 16px;
  background: var(--card-bg-color);
  padding: 16px;
  border-radius: 6px;
  &:deep(.big-text) {
    font-size: 24px;
  }
}
.summary-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  justify-content: space-between;
}
.summary-item {
  flex: 1;
  min-width: 34%;
  display: flex;
  flex-direction: column;
  .summary-title {
    font-size: 14px;
    font-weight: bold;
    opacity: 0.7;
  }
  .summary-text {
    font-size: 14px;
    font-weight: bold;
    margin: 4px 0;
  }
  .summary-detail {
    font-size: 12px;
    opacity: 0.5;
  }
}
.group-list {
  margin-top: 24px;
  .group-item + .group-item {
    margin-top: 16px;
  }
  .group-title {
    margin-bottom: 12px;
    opacity: 0.7;
    font-size: 12px;
  }
}
.group-time-list {
  .group-time-item {
    height: 32px;
    width: 100%;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
    & + .group-time-item {
      margin-top: 8px;
    }
  }
  .group-time-value-progress {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    background: var(--theme-color);
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    * {
      color: #fff;
    }
    .group-time-title {
      font-size: 12px;
      opacity: 0.7;
      font-weight: 500;
    }
    .group-time-value {
      font-size: 12px;
      font-weight: 500;
    }
  }
}
</style>
