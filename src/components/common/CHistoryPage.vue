<template>
  <div class="c-history-page" :data-route-unique-id="item.locations[0].uniqueId">
    <component
      :is="item.matched.components?.default"
      v-bind="item.locations[0]?.location.params"
    ></component>
  </div>
</template>

<script setup lang="ts">
import { historyKey, historyItemKey, viewDepthKey, type RouteHistoryItem } from '@/router/const';
import { computed, provide } from 'vue';
import type { RouteLocationMatched } from 'vue-router';

const props = defineProps<{
  item: { matched: RouteLocationMatched, matchIndex: number, locations: RouteHistoryItem[] }
}>()

const history = computed(() => {
  return props.item.locations
})

const nextDepth = computed(() => {
  return props.item.matchIndex + 1
})

provide(historyKey, history)
provide(viewDepthKey, nextDepth)
provide(historyItemKey, props.item.locations[0])

</script>

<!-- <style lang="scss" scoped>
@keyframes slide-left-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.c-history-page.current {
  transform: translateX(100%);
  @starting-style {
    animation: slide-left-in .2s forwards;
  }
}
</style> -->
