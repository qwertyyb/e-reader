<template>
  <div class="read-time-stats">
    <div class="date-range" v-if="range !== 'all'">
        <p class="date-range-text">{{ dateRange.start }} - {{ dateRange.end }}</p>
        <div class="date-range-btns">
          <button
            class="date-range-btn material-symbols-outlined"
            @click="offset -= 1"
          >keyboard_arrow_left</button>
          <button
            class="date-range-btn material-symbols-outlined"
            :class="{ disabled: !canNextDateRange }"
            @click="canNextDateRange && (offset += 1)"
          >keyboard_arrow_right</button>
        </div>
      </div>
      <div class="duration-summary">
        <p class="duration-total" v-html="totalDurationText"></p>
        <p class="duration-day" v-if="totalDuration">日均阅读{{ formatDuration(dayDuration, { style: false }) || '0分钟' }}<template v-if="range !== 'all'"> · 比{{ lastLabel[range] }}{{ dayDurationDiff > 0 ? '增加' : '减少'}} {{ Math.abs(dayDurationDiff) }}%</template></p>
      </div>
      <div class="duration-stats">
        <div class="stats-header">
          <div class="stats-title">阅读时长分布</div>
          <span class="material-symbols-outlined calendar-icon">calendar_month</span>
        </div>
        <canvas ref="canvas" class="chart-canvas"></canvas>
        <p class="longest-desc" v-if="totalDuration">{{ maxDurationRecord?.label }}阅读最久 · {{ formatDuration(maxDurationRecord?.duration ?? 0) }}</p>
      </div>
      <div class="longest-book" v-if="longestBook">
        <div class="stats-header">
          <div class="stats-title">阅读最久</div>
        </div>
        <div class="book-item"
          @click="$router.push({ name: 'read', params: { id: longestBook.id }, query: { trace: longestBook.id } })"
        >
          <div class="book-cover">
            <img :src="longestBook.cover"
              alt=""
              :data-book-cover-trace="longestBook.id"
            >
          </div>
          <div class="book-info">
            <div class="book-duration" v-html="formatDuration(longestBook.duration, { style: true })"></div>
            <div class="book-title">{{ longestBook.title }}</div>
            <div class="book-author">{{ longestBook.author }}</div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { booksStore, readTimeStore } from '@/services/storage';
import { formatDuration } from '@/utils';
import { Chart } from 'chart.js/auto'
import dayjs from 'dayjs';

const props = defineProps<{ range: 'week' | 'month' | 'year' | 'all' }>()

interface IReadTimeRecord extends Omit<IReadTime, 'bookId'> {
  label: string;
}

const lastLabel = { week: '上周', month: '上月', year: '去年', all: '' }

const offset = ref(0) // 0 表示当前， -1 表示上周/月/年，-2 表示上上周/月/年

const dateRange = computed(() => {
  if (props.range === 'all') {
    return { start: '2000/01/01', end: dayjs().format('YYYY/MM/DD') }
  }
  return { start: dayjs().add(offset.value, props.range).startOf(props.range).format('YYYY/MM/DD'), end: dayjs().add(offset.value, props.range).endOf(props.range).format('YYYY/MM/DD') }
})

const canNextDateRange = computed(() => {
  return dayjs(dateRange.value.end).isBefore(dayjs())
})

const list = shallowRef<IReadTimeRecord[]>([])

const totalDuration = computed(() => {
  return list.value.reduce((acc, item) => acc + item.duration, 0) || 0
})

const totalDurationText = computed(() => {
  const label = { week: '本周', month: '本月', year: '今年', all: '' }[props.range]
  return formatDuration(totalDuration.value, { style: true }) || (props.range === 'all' ? '尚未开始阅读' : `${label}没有阅读`)
})

const maxDurationRecord = computed(() => {
  // 过滤出最大阅读时间的记录
  const maxDuration = Math.max(...list.value.map(item => item.duration))
  const item = list.value.find(item => item.duration === maxDuration)
  if (!item) return item
  let label = ''
  if (props.range === 'week') {
    label = `周${item.label}`
  } else if (props.range === 'month') {
    label = `${item.label}日`
  } else if (props.range === 'year') {
    label = `${item.label}月`
  } else {
    label = `${item.label}年`
  }
  return {
    ...item,
    label
  }
})

const getDurationDays = (start: string, end: string) => {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)) + 1
}

// 日均阅读时间
const dayDuration = computed(() => {
  // 日均时间按时间范围内的天数计算
  return Math.round(totalDuration.value / getDurationDays(dateRange.value.start, dateRange.value.end))
})

const lastDayDuration = ref(0)

const dayDurationDiff = computed(() => {
  // 计算一下本周/月/年与上周/月/年的增加或减少的百分比
  return Math.round((dayDuration.value - lastDayDuration.value) / lastDayDuration.value * 100)
})

const formatData = (list: IReadTime[]): IReadTimeRecord[] => {
  const startDate = dayjs(dateRange.value.start)
  const endDate = dayjs(dateRange.value.end)

  const results: IReadTimeRecord[] = []
  const format = { week: 'dd', month: 'D', year: 'M', all: 'YYYY' }[props.range]
  const unit = ({ week: 'days', month: 'days', year: 'months', all: 'years' } as const)[props.range]
  for (let cur = startDate; cur.isSameOrBefore(endDate); cur = cur.add(1, unit)) {
    const nextDate = cur.add(1, unit)
    const items = list.filter(item => dayjs(item.date).isSameOrAfter(cur) && dayjs(item.date).isBefore(nextDate))
    const label = dayjs(cur).format(format)
      results.push({ date: cur.format('YYYY/MM/DD'), label, duration: items.reduce((acc, cur) => acc + cur.duration, 0) })
  }

  return results;
}

const getLastDateRange = () => {
  if (props.range === 'all') {
    return null
  }
  return {
    start: dayjs().add(offset.value - 1, props.range).startOf(props.range).format('YYYY/MM/DD'),
    end: dayjs().add(offset.value - 1, props.range).endOf(props.range).format('YYYY/MM/DD')
  }
}

watch(() => props.range, () => {
  offset.value = 0
})

const longestBook = shallowRef<IBook & { duration: number }>()

const canvas = useTemplateRef('canvas')
let chart: Chart<'bar', (IReadTimeRecord & { durationF: number })[]> | null = null

const renderChart = (completeData: IReadTimeRecord[]) => {
  chart?.destroy()
  let  data: (IReadTimeRecord & { durationF: number })[] = []
  const maxDuration = Math.max(...completeData.map(item => item.duration)) || 150 * 60 * 1000
  if (maxDuration > 1.5 * 60 * 60) {
    // 超过两小时了，单位使用小时
    data = completeData.map(item => {
      return {
        ...item,
        durationF: Math.round(item.duration / 60 / 60)
      }
    })
  } else if (maxDuration >= 60) {
    // 超过一分钟了，单位使用分钟
    data = completeData.map(item => {
      return {
        ...item,
        durationF: Math.round(item.duration / 60)
      }
    })
  } else {
    // 否则使用秒
    data = completeData.map(item => {
      return {
        ...item,
        durationF: item.duration
      }
    })
  }
  chart = new Chart(canvas.value!, {
    type: 'bar',
    data: {
      datasets: [{
        label: '阅读时长',
        data: data,
        borderRadius: 4,
        backgroundColor: '#007bff'
      }]
    },
    options: {
      parsing: {
        xAxisKey: 'label',
        yAxisKey: 'durationF'
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value, index) => {
              return index % 2 ? '' : value + (maxDuration > 1.5 * 60 * 60 ? 'h' : maxDuration >= 60 ? 'min' : 's')
            }
          }
        },
        x: {
          grid: { display: false },
        }
      },
      plugins: {
        legend: {
          display: false
        }
      },
    }
  })
}

watch(dateRange, async ({ start, end }) => {
  const lastDateRange = getLastDateRange()
  const [results, lastResults] = await Promise.all([
    readTimeStore.getListByDateRange(start, end),
    lastDateRange ? readTimeStore.getListByDateRange(lastDateRange.start, lastDateRange.end) : Promise.resolve([])
  ])
  if (lastDateRange) {
    lastDayDuration.value = (lastResults.reduce((acc, item) => acc + item.duration, 0) || 0) / getDurationDays(lastDateRange.start, lastDateRange.end)
  }
  // 按累加时长，找到阅读时长最久的书
  const bookDurations: Record<string, number> = {}
  results.forEach(item => {
    if (bookDurations[item.bookId]) {
      bookDurations[item.bookId] += item.duration
    } else {
      bookDurations[item.bookId] = item.duration
    }
  })

  // 找到阅读时长最长的书
  const topBookId = Object.keys(bookDurations).reduce((a, b) => bookDurations[a] > bookDurations[b] ? a : b, '')
  if (topBookId) {
    booksStore.get(Number(topBookId)).then(book => {
      longestBook.value = { ...book, duration: bookDurations[topBookId] }
    })
  }


  // 查询出的数据可能缺少某些日期，需要补全, 并补充 label 字段
  // 按周/月查询时，每个时间段是天，按年/总查询时，每个时间段是月
  const completeData = formatData(results)

  renderChart(completeData)
  
  list.value = completeData
}, { immediate: true })

onBeforeUnmount(() => {
  chart?.destroy()
})
</script>

<style lang="scss" scoped>
.date-range {
  margin-left: 16px;
  font-weight: 500;
  opacity: 0.8;
  display: flex;
  align-items: center;
  margin-top: 24px;
  .date-range-btns {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    margin-left: auto;
    & > * {
      padding: 4px;
      border-radius: 9999px;
      background: light-dark(#ddd, #333);
      text-align: center;
      &.disabled {
        opacity: 0.4;
        cursor: no-drop;
      }
    }
  }
}
.duration-summary {
  padding: 16px;
  .duration-total {
    font-weight: bold;
    font-size: 20px;;
  }
  .duration-day {
    opacity: 0.6;
    font-size: 12px;
  }
}
.duration-stats {
  margin-top: 16px;
  background: var(--card-bg-color);
  border-radius: 6px;
  padding: 16px;
  .stats-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    .calendar-icon {
      font-size: 20px;
      background: light-dark(#ddd, #555);
      padding: 4px;
      border-radius: 9999px;
    }
  }
  .chart-canvas {
    margin-top: 16px;
    width: 100%;
    height: 300px;
  }
  .longest-desc {
    margin-top: 16px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 9999px;
    overflow: hidden;
    padding: 4px 12px;
    position: relative;
    z-index: 1;
    &::before {
      content: " ";
      display: block;
      position: absolute;
      inset: 0;
      z-index: -1;
      background: var(--theme-color);
      opacity: 0.1;
    }
  }
}
.longest-book {
  margin-top: 16px;
  background: var(--card-bg-color);
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  .book-item {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 16px;
  }
  .book-cover {
    width: 100px;
    img { width: 100%; height: auto; vertical-align: middle; }
  }
  .book-title {
    font-weight: bold;
  }
  .book-author {
    opacity: 0.8;
    font-size: 14px;
    margin-top: 8px;
  }
  .book-duration {
    margin-bottom: 8px;
    :deep(.num) {
      font-size: 30px;
      font-weight: bold;
      margin: 0 0.13em;
    }
  }
}
</style>
