<template>
  <div class="c-history-page">
    <component
      v-if="route.matched[matchedIndex]"
      :key="route.matched[matchedIndex].path"
      :is="route.matched[matchedIndex].components?.default"
      v-bind="route.params"
    ></component>
  </div>
</template>

<script setup lang="ts">
import { historyKey, pageEventKey, viewDepthKey, type RouteHistory, type RouteHistoryItem } from '@/router/const';
import { computed, inject, provide } from 'vue';
import { type RouteLocation } from 'vue-router';

const props = defineProps<{
  route: RouteHistoryItem
}>()

const viewDepth = inject<number>(viewDepthKey, 0)

provide(historyKey, props.route.history || [])

const matchedIndex = computed(() => {
  for (let i = viewDepth; i < props.route.matched.length; i +=1) {
    if (props.route.matched[i].components?.default) {
      return i
    }
  }
  return -1
})

provide(viewDepthKey, matchedIndex.value + 1)

const pageEvent = new EventTarget()

provide(pageEventKey, pageEvent)

const dispatchEvent = (eventName: 'pageEnter' | 'pageExit' | 'pageBack' | 'pageLeave') => {
  pageEvent.dispatchEvent(new CustomEvent(eventName))
}

defineExpose({
  // 从其它页面回退到当前页面
  dispatchPageBack: () => dispatchEvent('pageBack'),

  // 从其它页面进入到当前页面
  dispatchPageEnter: () => dispatchEvent('pageEnter'),

  // 从当前页面进入其他页面
  dispatchPageLeave: () => dispatchEvent('pageLeave'),

  // 从当前页面退出
  dispatchPageExit: () => dispatchEvent('pageExit')
})

</script>