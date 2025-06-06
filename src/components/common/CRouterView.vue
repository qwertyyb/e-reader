<template>
  <div class="c-router-view" ref="el">
    <ul class="route-history-list"
      v-if="history.length"
      @pointerdown="pointerDownHandler"
      @pointermove="pointerMoveHandler"
      @pointerup="pointerUpHandler"
      @pointercancel="pointerCancelHandler"
    >
      <li class="route-history-item"
        v-for="(route, index) in history"
        :key="index"
        :class="{
          'current': index === history.length - 1,
          'previous': index === history.length - 2,
        }"
      >
        <component
          ref="components"
          v-for="matched in route.matched.slice(parentRouteMatchedIndex + 1).filter(i => i.components?.default).slice(0, 1)"
          :key="matched.path"
          :is="matched.components?.default"
          v-bind="route.params"
        ></component>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import router, { appRouter, routerViewSymbol } from '@/router';
import { disableAnim } from '@/utils/env';
import { computed, type ComputedRef, inject, nextTick, onBeforeUnmount, provide, shallowRef, useTemplateRef } from 'vue';
import type { RouteLocation } from 'vue-router';

const el = useTemplateRef('el')
const components = useTemplateRef<{
  pop?: (to: RouteLocation, from: RouteLocation, toEl?: HTMLElement | null, fromEl?: HTMLElement | null) => void | Promise<void>,
  push?: (to: RouteLocation, from?: RouteLocation, toEl?: HTMLElement | null, fromEl?: HTMLElement | null) => void | Promise<void>
}[]>('components')

const history = shallowRef<RouteLocation[]>([])

const parentRouteMatchedIndex = inject<ComputedRef<number>>(routerViewSymbol, computed(() => -1))

const lastRouteMatchedIndex = computed(() => {
  const route = history.value[history.value.length - 1]
  if (!route) return -1;
  return route.matched.findIndex(i => !!i.components?.default)
})

provide(routerViewSymbol, lastRouteMatchedIndex)

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
  if (!history.value.length) return true
  if (parentRouteMatchedIndex.value >= 0) {
    return history.value[0].matched.slice(0, parentRouteMatchedIndex.value + 1).every((item, index) => item.path === to.matched[index].path)
  }
  const last = history.value[history.value.length - 1]
  const commonMatched = getCommonMatched(last, to)
  return !commonMatched.some(item => item.components?.default)
}

const runDefaultPushAnimation = async (cur?: HTMLElement | null, prev?: HTMLElement | null) => {
  const prevAnim = prev?.animate([{ transform: `translateX(0)` }, { transform: `translateX(-30%)` }], { duration: 200, easing: 'ease-out' })
  const curAnim = cur?.animate([{ transform: `translateX(100%)` }, { transform: `translateX(0)` }], { duration: 200, easing: 'ease-out' })
  await Promise.all([prevAnim?.finished, curAnim?.finished])
  prev?.classList.add('animate-end')
}

const runDefaultPopAnimation = async (cur?: HTMLElement | null, prev?: HTMLElement | null) => {
  const prevAnim = prev?.animate(
    [
      { transform: `translateX(0)`, '--mask-opacity': '0' },
      {
        transform: prev.style.getPropertyValue('transform') ||`translateX(-30%)`,
        '--mask-opacity': prev.style.getPropertyValue('--mask-opacity') || '0'
      }
    ],
    { duration: 200, easing: 'ease-in', direction: 'reverse' }
  )
  const curAnim = cur?.animate(
    [
      { transform: `translateX(100%)` },
      { transform: cur.style.getPropertyValue('transform') || `translateX(0)` }
    ],
    { duration: 200, easing: 'ease-in', direction: 'reverse' }
  )
  await Promise.all([prevAnim?.finished, curAnim?.finished])
  prev?.style.removeProperty('transform')
  prev?.style.removeProperty('--mask-opacity')
}

const popHandler = async (delta: number) => {
  if (!disableAnim.value) {
    const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
    const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
    const to = history.value[history.value.length + delta - 1]
    const from = history.value[history.value.length + delta]
    const cur = components.value?.[history.value.length + delta]
    if (typeof cur?.pop === 'function') {
      await cur.pop(to, from, toEl, fromEl)
    } else {
      await runDefaultPopAnimation(fromEl, toEl);
    }
  }
  history.value = [...history.value.slice(0, history.value.length + delta)]
  if (!history.value.length) {
    // 无法后退时，回到主页
    history.value = [appRouter.resolve({ path: '/' })]
  }
}

const pushHandler = async (to: RouteLocation, from?: RouteLocation) => {
  console.log('need', needAppendHistory(to))
  // 暂时先不考虑多层级的嵌套路由
  history.value = [...history.value, to]
  if (disableAnim.value) return;
  await nextTick()
  const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const curRouteComp = components.value?.[history.value.length - 1]
  if (typeof curRouteComp?.push === 'function') {
    curRouteComp.push(to, from, toEl, fromEl)
    return;
  }
  runDefaultPushAnimation(toEl, fromEl);
}

const replaceHandler = (to: RouteLocation) => {
  history.value = [...history.value.slice(0, history.value.length - 1), to]
}

appRouter.onPush(pushHandler)
appRouter.onPop(popHandler)
appRouter.onReplace(replaceHandler)

router.isReady().then(() => {
  pushHandler(router.currentRoute.value)
})

onBeforeUnmount(() => {
  appRouter.offPop(popHandler)
  appRouter.offPush(pushHandler)
  appRouter.offReplace(replaceHandler)
})

let startX = -1
let touching = false
let startTime = 0
const pointerDownHandler = (e: PointerEvent) => {
  if ((components.value?.length ?? 0) < 2 || typeof components.value?.[components.value.length - 1]?.pop === 'function') return;
  startX = e.screenX
  touching = true
  startTime = performance.now()
}

const setViewStyle = (options: { offset: number }) => {
  const current = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const prev = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  if (!current || !prev) return;
  const progress = options.offset / el.value!.getBoundingClientRect().width
  const prevOffset = 30 * progress - 30
  current.style.setProperty('transform', `translateX(${options.offset}px)`)
  prev.style.setProperty('transform', `translateX(${prevOffset}%)`)
  prev.style.setProperty('--mask-opacity', `${0.1 - progress * 0.1}`)
}

const pointerMoveHandler = (e: PointerEvent) => {
  if (!touching) return;
  const deltaX = e.screenX - startX
  if (deltaX < 0) return
  setViewStyle({ offset: deltaX })
}

const resetView = async () => {
  const current = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const previous = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  await Promise.all([
    current?.animate([{ transform: 'translateX(0)' }], { duration: 200 }).finished,
    previous?.animate([{ transform: 'translateX(-30%)' }], { duration: 200 }).finished
  ])
  current?.style.removeProperty('transform')
  previous?.style.removeProperty('transform')
  previous?.style.removeProperty('--mask-opacity')
}

const pointerUpHandler = async (e: PointerEvent) => {
  if (!touching) return;
  touching = false
  const deltaX = e.screenX - startX
  const width = el.value!.getBoundingClientRect().width
  const speed = deltaX / (performance.now() - startTime)
  if (deltaX > width / 2 || speed > 0.5) {
    popHandler(-1)
  } else {
    resetView();
  }
}

const pointerCancelHandler = async () => {
  if (!touching) return;
  touching = false
  resetView();
}

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
    visibility: hidden;
    --mask-opacity: 0.1;
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
