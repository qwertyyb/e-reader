<template>
  <route-page class="read-time-view">
    <navigation-bar no-menu title="阅读明细"></navigation-bar>
    <div class="read-time-content">
      <header class="read-time-header" v-if="book">
        <img :src="book.cover" alt=""
          class="book-cover-img"
          :data-book-cover-trace="book.id"
          @click="toRead"
        >
        <div class="book-info">
          <h2 class="book-title">{{ book.title }}</h2>
          <p class="book-author">{{ book.author }}</p>
          <button class="btn primary-btn read-btn"
            @click="toRead"
          >现在阅读</button>
        </div>
      </header>
      <ul class="summary-list">
        <li class="summary-item" v-for="summary in summaryList" :key="summary.title">
          <h3 class="summary-title">{{ summary.title }}</h3>
          <div class="summary-text" v-html="summary.text"></div>
          <div class="summary-detail">{{ summary.desc }}</div>
        </li>
      </ul>
      <main class="read-time-main">
        <h3 class="stats-title">时长明细</h3>
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
        <button class="btn primary-btn" @click="dialog='share'">分享阅读成就</button>
      </footer>
    </div>
    <book-share-dialog mode="book" :book-id="id" :visible="dialog === 'share'" @close="dialog = ''"></book-share-dialog>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import BookShareDialog from '@/components/BookShareDialog.vue';
import { shallowRef } from 'vue';
import { booksStore, readTimeStore } from '@/services/storage';
import { formatDuration } from '@/utils';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{ id: string }>()

interface ITimeItem {
  title: string,
  list: { title: string, value: string, duration: number, width: string }[]
}

const minPercent = 30

const summaryList = shallowRef<{ title: string, text: string, desc: string }[]>([])

const timeList = shallowRef<ITimeItem[]>([])
const book = shallowRef<IBook>()
const dialog = shallowRef('')

booksStore.get(Number(props.id)).then(result => book.value = result)

const refreshTimeList = async () => {
  const list = await readTimeStore.getListByBookId(props.id)
  if (!list.length) return;
  list.sort((prev, next) => next.date.localeCompare(prev.date))
  const max = Math.max(...list.map(i => i.duration))
  const firstDay = list[list.length - 1]
  const lastDay = list[0]
  let maxDay: IReadTime
  let durationTotal = 0
  const results: Record<string, IReadTime[] | undefined> = {}
  list.forEach(item => {
    if (!maxDay || (maxDay && item.duration > maxDay.duration)) {
      maxDay = item
    }
    durationTotal += item.duration

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
          value: formatDuration(item.duration),
          duration: item.duration,
          width: (minPercent + (item.duration / max * 70)) + '%'
        }
      })
    }
  })
  summaryList.value = [
    { title: '累计时长', text: '<span class="big-text">' + formatDuration(durationTotal) + '</span>', desc: `${firstDay.date}开始阅读` },
    { title: '阅读天数', text: '<span class="big-text">' + list.length + '</span>天', desc: `上次阅读${lastDay.date}` },
    { title: '单日阅读最久', text: '<span class="big-text">' + formatDuration(maxDay!.duration) + '</span>', desc: maxDay!.date },
  ]
}

const refresh = async () => {
  refreshTimeList()
}

refresh()

const route = useRoute()
const router = useRouter()
const toRead = () => {
  // 如果是从阅读界面跳过来的，则返回上一页
  if (route.query.fromRead === '1') {
    router.back()
  } else {
    router.push({ name: 'read', params: { id: book.value!.id }, query: { trace: book.value!.id } })
  }
}

</script>

<style lang="scss" scoped>
@import "../assets/variables.scss";

.read-time-view {
  height: var(--page-height);
  display: flex;
  flex-direction: column;
}
.read-time-content {
  flex: 1;
  height: 0;
  overflow: auto;
  padding-bottom: 60px;
}
.read-time-header {
  display: flex;
  margin: 16px 16px 0 16px;
  padding: 16px;
  background: var(--card-bg-color);
  border-radius: 6px;
  .book-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .book-title {
    font-size: 20px;
  }
  .book-author {
    font-size: 14px;
    opacity: 0.7;
    margin-top: 12px;
  }
  .read-btn {
    margin-left: auto;
    margin-top: 12px;
  }
  .book-cover-img {
    width: 90px;
    height: 120px;
    margin-right: 16px;
    vertical-align: top;
  }
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
  margin: 16px;
  background: var(--card-bg-color);
  padding: 16px;
  border-radius: 6px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  row-gap: 28px;
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
    margin: 2px 0 4px 0;
  }
  .summary-detail {
    font-size: 12px;
    opacity: 0.5;
  }
}
.stats-title {
  font-size: 14px;
}
.group-list {
  margin-top: 12px;
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
.read-time-footer {
  display: flex;
  justify-content: center;
}

@media (width > $MAX_SMALL_WIDTH) {
  .read-time-content {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
  }
  .read-time-header {
    height: 160px;
    margin-right: 0;
  }
  .book-info .read-btn {
    margin-left: 0;
    margin-right: auto;
  }
  .read-time-main {
    width: 100%;
    margin-top: 0;
  }
  .summary-list {
    flex: 1;
    height: 160px;
    border-radius: 0;
    margin-left: 0;
    grid-template-columns: repeat(3, 1fr);
  }
  .read-time-footer {
    width: 100%;
    text-align: center;
  }
}
</style>
