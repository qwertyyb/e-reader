<template>
  <div class="c-router-view" ref="el">
    <ul class="route-history-list">
      <CHistoryPage
        v-for="(node, index) in matchedList"
        :key="node.matched.path"
        :item="node"
        :class="{
          'current': index === matchedList.length - 1,
          'previous': index === matchedList.length - 2,
        }"
      ></CHistoryPage>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { isEqual } from 'es-toolkit'
import { historyKey, viewDepthKey, type RouteHistoryItem } from '@/router/const';
import { computed, inject, unref, type Ref } from 'vue';
import { type RouteLocationMatched, type RouteParamsGeneric } from 'vue-router';
import CHistoryPage from './CHistoryPage.vue';

const history = inject<Ref<RouteHistoryItem[]>>(historyKey)
const depth = inject<number>(viewDepthKey, 0)

const findMatchIndex = (route: RouteHistoryItem) => {
  for (let i = unref(depth); i < route.location.matched.length; i += 1) {
    if (route.location.matched[i].components?.default) {
      return i
    }
  }
  return -1
}

const parseMatchedParams = (path: string, params: RouteParamsGeneric) => {
  const variables = path.match(/(?<=\/:)(\w+)/g) || []
  const result: RouteParamsGeneric = {}
  variables.forEach(key => {
    result[key] = params[key]
  })
  return result
}

type MatchedListItem = {
  matched: RouteLocationMatched,
  params: RouteParamsGeneric,
  matchIndex: number,
  locations: RouteHistoryItem[]
}

const matchedList = computed(() => {
  const results: MatchedListItem[] = []
  let last: MatchedListItem | null = null
  const locations = unref(history!)
  for (let i = 0; i < locations.length; i += 1) {
    const item = locations[i]
    if (
      last &&
      last.matched === item.location.matched[last.matchIndex] &&
      isEqual(last.params, parseMatchedParams(last.matched.path, item.location.params))
    ) {
      // 多个相同的路由，合并到一个页面中
      last.locations.push(item)
    } else {
      const matchIndex = findMatchIndex(item)
      const matched = item.location.matched[matchIndex]
      const params = parseMatchedParams(matched.path, item.location.params)
      last = {
        matched,
        params,
        matchIndex,
        locations: [item]
      }
      results.push(last)
    }
  }
  return results;
})

</script>

<style lang="scss" scoped>
@use "../../styles/variables";

.route-history-list {
  height: 100%;
  overflow: hidden;
  position: relative;
  width: 100%;
  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    visibility: hidden;
    display: flex;
    z-index: 0;
    --mask-opacity: 0.1;
    &:deep(> *) {
      width: 100%;
    }
    &.previous, &.current {
      visibility: visible;
    }
    &.previous {
      z-index: 1;
      &.animate-end::after {
        content: " ";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, var(--mask-opacity));
        z-index: 20;
      }
    }
    &.current {
      z-index: 2;
    }
  }
}
</style>
