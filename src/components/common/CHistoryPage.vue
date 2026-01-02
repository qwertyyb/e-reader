<template>
  <div class="c-history-page">
    <component
      :key="node.matchedRoute.path"
      :is="node.matchedRoute.components?.default"
    ></component>
  </div>
</template>

<script setup lang="ts">
import { historyKey, historyItemKey, pageEventKey, viewDepthKey, type RouteHistoryItem } from '@/router/const';
import type { RouteHistoryNode } from '@/router/history';
import { computed, inject, provide } from 'vue';

const props = defineProps<{
  node: RouteHistoryNode
}>()

console.log(props.node)

const historyNode = computed(() => {
  return props.node
})

provide(historyKey, historyNode)
provide(historyItemKey, historyNode)

</script>