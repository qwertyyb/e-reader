<template>
  <route-page>
    <navigation-bar title="阅读统计" no-menu></navigation-bar>
    <main>
      <c-tab-nav :list="tabs" v-model="curTab"></c-tab-nav>
      <keep-alive>
        <read-time-stats :range="curTab" :key="curTab" @view="view" ref="readTimeStats"></read-time-stats>
      </keep-alive>
    </main>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import CTabNav from '@/components/common/CTabNav.vue';
import ReadTimeStats from '@/components/ReadTimeStats.vue';
import { nextTick, ref, useTemplateRef } from 'vue';

const tabs = [
  { name: 'week', title: '周' },
  { name: 'month', title: '月' },
  { name: 'year', title: '年' },
  { name: 'all', title: '总' },
]

const curTab = ref<'week' | 'month' | 'year' | 'all'>('week')
const rsRef = useTemplateRef('readTimeStats')

const view = async (range: 'month' | 'year', expectDate: string) => {
  // 此处需要等一下，否则 chart 会报错
  await new Promise(resolve => setTimeout(resolve, 0));
  curTab.value = range
  await nextTick()
  rsRef.value?.view(expectDate)
}

</script>

<style lang="scss" scoped>
main {
  padding: 16px 16px;
}
</style>
