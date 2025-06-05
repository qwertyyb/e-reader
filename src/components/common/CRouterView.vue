<template>
  <div class="c-router-view">
    <ul class="route-history-list" v-if="history.length">
      <transition-group name="slide-to-next">
        <li class="route-history-item"
          v-for="(route, index) in history"
          :key="index"
          :class="{
            'current': index === history.length - 1,
            'previous': index === history.length - 2,
          }"
        >
          <component
            v-for="matched in route.matched.slice(parentRouteMatchedIndex + 1).filter(i => i.components?.default).slice(0, 1)"
            :key="matched.path"
            :is="matched.components?.default"
            v-bind="route.params"
          ></component>
        </li>
      </transition-group>
    </ul>
  </div>
</template>

<script setup lang="ts">
import router, { appRouter, routerViewSymbol } from '@/router';
import { computed, type ComputedRef, inject, onBeforeUnmount, provide, shallowRef } from 'vue';
import type { RouteLocation } from 'vue-router';

const history = shallowRef<RouteLocation[]>([])

const parentRouteMatchedIndex = inject<ComputedRef<number>>(routerViewSymbol, computed(() => -1))

const lastRouteMatchedIndex = computed(() => {
  const route = history.value[history.value.length - 1]
  if (!route) return -1;
  return route.matched.findIndex(i => !!i.components?.default)
})

provide(routerViewSymbol, lastRouteMatchedIndex)

const popHandler = (delta: number, to: RouteLocation, from: RouteLocation) => {
  if (from.fullPath === history.value[history.value.length - 1].fullPath) {
    history.value = [...history.value.slice(0, history.value.length + delta)]
  }
}
const getCommonMatched = (prev: RouteLocation, next: RouteLocation) => {
  for(let i = 0; i < prev.matched.length; i += 1) {
    if (prev.matched[i].path !== next.matched[i]?.path) {
      return prev.matched.slice(0, i)
    }
  }
  return prev.matched.slice(0)
}

const needAppendHistory = (to: RouteLocation) => {
  // push history 有两种情况
  // 1. 当前路由是嵌套的路由，要跳转的路由是嵌套路由的子路由
  // 2. 当前路由不是嵌套路由，要跳转的路由与最后一个路由无法共用 parent，即不是嵌套路由
  if (parentRouteMatchedIndex.value >= 0) {
    return history.value[0].matched.slice(0, parentRouteMatchedIndex.value + 1).every((item, index) => item.path === to.matched[index].path)
  }
  const last = history.value[history.value.length - 1]
  const commonMatched = getCommonMatched(last, to)
  return !commonMatched.some(item => item.components?.default)
}

const pushHandler = (to: RouteLocation) => {
  console.log('need', needAppendHistory(to))
  if (needAppendHistory(to)) {
    history.value = [...history.value, to]
  }
}

const replaceHandler = (to: RouteLocation) => {
  if (needAppendHistory(to)) {
    history.value = [...history.value.slice(0, history.value.length - 1), to]
  }
}

appRouter.onPush(pushHandler)
appRouter.onPop(popHandler)
appRouter.onReplace(replaceHandler)

router.isReady().then(() => {
  history.value = [router.currentRoute.value]
})

onBeforeUnmount(() => {
  appRouter.offPop(popHandler)
  appRouter.offPush(pushHandler)
  appRouter.offReplace(replaceHandler)
})

</script>

<style lang="scss" scoped>
.route-history-list {
  height: var(--page-height);
  overflow: hidden;
  position: relative;
  width: 100%;
  & > * {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background: var(--bg-color);
    transition: transform 0.3s;
    &.previous {
      transform: translateX(-30%);
    }
  }
}
.slide-to-next-enter-from,
.slide-to-next-enter-to {
  transform: translateX(100%);
}
.slide-to-next-enter-active,
.slide-to-next-leave-active {
  transition: transform 0.3s;
}
.slide-to-next-enter-to,
.slide-to-next-leave-from {
  transform: translateX(0);
}
</style>
