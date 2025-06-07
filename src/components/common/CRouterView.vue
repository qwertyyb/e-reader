<template>
  <div class="c-router-view" ref="el">
    <ul class="route-history-list"
      @pointerdown="pointerDownHandler"
      @pointermove="pointerMoveHandler"
      @pointerup="pointerUpHandler"
      @pointercancel="pointerCancelHandler"
      @touchmove="touchMoveHandler"
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
          v-for="matched in route.matched.filter(i => i.components?.default).slice(0, 1)"
          :key="matched.path"
          :is="matched.components?.default"
          v-bind="route.params"
        ></component>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import router, { appRouter } from '@/router';
import { disableAnim } from '@/utils/env';
import { nextTick, onBeforeUnmount, shallowRef, useTemplateRef } from 'vue';
import type { RouteLocation } from 'vue-router';

const el = useTemplateRef('el')
const components = useTemplateRef<{
  onBackFrom?: (to: RouteLocation, from: RouteLocation, toEl?: HTMLElement | null, fromEl?: HTMLElement | null) => void | Promise<void>,
  onForwardTo?: (to: RouteLocation, from?: RouteLocation, toEl?: HTMLElement | null, fromEl?: HTMLElement | null) => void | Promise<void>,
  onBackTo?: (to: RouteLocation, from: RouteLocation, toEl?: HTMLElement | null, fromEl?: HTMLElement | null) => void | Promise<void>,
  onForwardFrom?: (to: RouteLocation, from: RouteLocation, toEl?: HTMLElement | null, fromEl?: HTMLElement | null) => void | Promise<void>,
}[]>('components')

const history = shallowRef<RouteLocation[]>([])

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
  const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const to = history.value[history.value.length + delta - 1]
  const from = history.value[history.value.length + delta]
  const prev = components.value?.[history.value.length + delta - 1]
  const cur = components.value?.[history.value.length + delta]
  if (typeof cur?.onBackFrom === 'function') {
    await cur.onBackFrom(to, from, toEl, fromEl)
  } else if (!disableAnim.value) {
    console.log('back', disableAnim.value)
    await runDefaultPopAnimation(fromEl, toEl);
  }
  history.value = [...history.value.slice(0, history.value.length + delta)]
  if (typeof prev?.onBackTo === 'function') {
    prev.onBackTo(to, from, toEl, fromEl)
  }
  if (!history.value.length) {
    // 无法后退时，回到主页
    history.value = [appRouter.resolve({ path: '/' })]
  }
}

const pushHandler = async (to: RouteLocation, from?: RouteLocation) => {
  // 暂时先不考虑多层级的嵌套路由
  history.value = [...history.value, to]
  await nextTick()
  const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const prevRouteComp = components.value?.[history.value.length - 2]
  const curRouteComp = components.value?.[history.value.length - 1]
  if (typeof prevRouteComp?.onForwardFrom === 'function') {
    prevRouteComp.onForwardFrom(to, from!, toEl, fromEl)
  }

  if (typeof curRouteComp?.onForwardTo === 'function') {
    curRouteComp.onForwardTo(to, from, toEl, fromEl)
    return;
  }
  if (disableAnim.value) return;
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
let startY = -1
let touching = false
let startTime = 0
let needPreventTouchMove: boolean | null = null
const pointerDownHandler = (e: PointerEvent) => {
  // 如果当前页面已经是最后一个路由，或者当前页面的有自定义的 pop 方法，则不执行默认的回退手势
  if ((components.value?.length ?? 0) < 2 || typeof components.value?.[components.value.length - 1]?.onBackFrom === 'function') return;
  // 记录手势的初始位置，有两个作用，1. 用以判断是否是纵向滑动，2. 计算横向滑动的距离
  startX = e.screenX
  startY = e.screenY

  // 标记手势已开始
  touching = true

  // 记录手势开始时间，在手势结束时用以计算滑动的速度
  startTime = performance.now()

  // 初始化 needPreventTouchMove 的值，在 pointermove 事件中根据初次滑动的方向来决定是否阻止 touchmove 事件
  needPreventTouchMove = null
}

const setViewStyle = (options: { offset: number }) => {
  // 根据当前滑动的距离，设置当前页面的和前一个页面的样式
  const current = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const prev = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  const progress = options.offset / el.value!.getBoundingClientRect().width
  const prevOffset = 30 * progress - 30
  current?.style.setProperty('transform', `translateX(${options.offset}px)`)
  prev?.style.setProperty('transform', `translateX(${prevOffset}%)`)
  prev?.style.setProperty('--mask-opacity', `${0.1 - progress * 0.1}`)
}

// pointermove 事件的 preventDefault 无法阻止页面内的滚动事件，因此需要通过 touchmove 事件来阻止
// 但是是否阻止 touchmove 事件，取决于在 pointermove 事件回调的判断，即 needPreventTouchMove 的值
const touchMoveHandler = (e: TouchEvent) => {
  if (needPreventTouchMove === true) {
    e.preventDefault()
  }
}


const pointerMoveHandler = (e: PointerEvent) => {
  // 如果手势未开始，则无须执行回调
  if (!touching) return;
  const deltaX = e.screenX - startX

  // 如果滑动距离小于 0，即向左滑动，则无须执行回调
  if (deltaX < 0) return

  // 如果尚未决定滑动的方向，则需要判断
  if (needPreventTouchMove === null) {
    const deltaY = e.screenY - startY
    needPreventTouchMove = Math.abs(deltaX) > Math.abs(deltaY)
  }
  // 如果滑动的方向不是横向，即 needPreventTouchMove 为 false, 则无须执行回调
  if (!needPreventTouchMove) return;
  setViewStyle({ offset: deltaX })
}

// 手势结束时，如果无须 pop 当前路由，则需要调用此方法，恢复手势过程中写入的样式
const resetViewStyle = async () => {
  console.log('rrrr')
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
  if (!touching || needPreventTouchMove !== true) return;
  touching = false
  needPreventTouchMove = null
  const deltaX = e.screenX - startX
  const width = el.value!.getBoundingClientRect().width
  const speed = deltaX / (performance.now() - startTime)
  // 如果滑动距离大于屏幕宽度的一半，或者滑动速度大于 0.5，则 pop 当前路由
  if (deltaX > width / 2 || speed > 0.5) {
    popHandler(-1)
  } else {
    resetViewStyle();
  }
}

const pointerCancelHandler = async () => {
  if (!touching || needPreventTouchMove !== true) return;
  touching = false
  needPreventTouchMove = null
  resetViewStyle();
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
