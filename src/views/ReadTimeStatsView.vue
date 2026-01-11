<template>
  <route-page>
    <navigation-bar title="阅读统计" no-menu></navigation-bar>
    <main>
      <c-tab-nav :list="tabs" v-model="curTab"></c-tab-nav>
      <div class="duration-summary">
        <p class="duration-total">{{ totalDuration }}</p>
        <p class="duration-day">日均阅读{{ dayAvgDuration }}，比上周 xxx</p>
      </div>
      <div class="duration-stats">
        <div class="stats-header">
          <div class="stats-title">阅读时长分布</div>
          <span class="material-symbols-outlined calendar-icon">calendar_month</span>
        </div>
        <canvas ref="canvas" class="chart-canvas"></canvas>
        <p class="longest-desc">周六阅读最久-8分钟</p>
      </div>
    </main>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import CTabNav from '@/components/common/CTabNav.vue';
import { ref, shallowRef, useTemplateRef, watch } from 'vue';
import { readTimeStore } from '@/services/storage';
import { formatDuration } from '@/utils';
import { Chart } from 'chart.js/auto'

const tabs = [
  { name: 'week', title: '周' },
  { name: 'month', title: '月' },
  { name: 'year', title: '年' },
  { name: 'all', title: '总' },
]

const curTab = ref('week')

const dateRange = shallowRef({ start: '2026/01/05', end: '2026/01/11' })

const canvas = useTemplateRef('canvas')

const totalDuration = ref('')
const dayAvgDuration = ref('')
const list = shallowRef<IReadTime[]>([])

const getList = async () => {
  const results = await readTimeStore.getListByDateRange(dateRange.value.start, dateRange.value.end)
  console.log('results', results)
  const total = results.reduce((acc, item) => acc + item.duration, 0)
  totalDuration.value = formatDuration(total)
  // 计算日均阅读时间
  const durationTotal = results.reduce((acc, item) => acc + item.duration, 0)
  const durationAvg = Math.round(durationTotal / results.length)
  dayAvgDuration.value = formatDuration(durationAvg)

  list.value = results
}

getList()

let chart: Chart | null = null
watch(list, (value) => {
  chart?.destroy()
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chart = new Chart(canvas.value!.getContext('2d')!, {
    type: 'bar',
    data: {
      datasets: [{
        label: '阅读时长',
        data: value,
        borderRadius: 4,
        backgroundColor: '#007bff'
      }]
    },
    options: {
      parsing: {
        xAxisKey: 'date',
        yAxisKey: 'duration'
      },
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      },
    }
  })
})

</script>

<style lang="scss" scoped>
main {
  padding: 16px 16px;
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
      background: #ddd;
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
</style>