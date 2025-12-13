<template>
  <div class="c-router-view" ref="el">
    <ul class="route-history-list">
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
import { useWindowSize } from '@/hooks/windowSize';
import { appRouter } from '@/router';
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
const { isSmall } = useWindowSize()

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

const popHandler = async (delta: number, options: { hasUAVisualTransition: boolean }) => {
  const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
  const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
  const to = history.value[history.value.length + delta - 1]
  const from = history.value[history.value.length + delta]
  const prev = components.value?.[history.value.length + delta - 1]
  const cur = components.value?.[history.value.length + delta]
  if (typeof cur?.onBackFrom === 'function') {
    await cur.onBackFrom(to, from, toEl, fromEl)
  } else if (!disableAnim.value && !options.hasUAVisualTransition && isSmall.value) {
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
  if (disableAnim.value || history.value.length <= 1 || !isSmall.value) return;
  runDefaultPushAnimation(toEl, fromEl);
}

const replaceHandler = (to: RouteLocation) => {
  history.value = [...history.value.slice(0, history.value.length - 1), to]
}

appRouter.onPush(pushHandler)
appRouter.onPop(popHandler)
appRouter.onReplace(replaceHandler)

appRouter.isReady().then(() => {
  pushHandler(appRouter.currentRoute.value)
})

onBeforeUnmount(() => {
  appRouter.offPop(popHandler)
  appRouter.offPush(pushHandler)
  appRouter.offReplace(replaceHandler)
})

</script>

<style lang="scss" scoped>
@import "../../assets/_variables.scss";

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
    display: flex;
    width: 100%;
    height: 100%;
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
  @media (width > $MAX_SMALL_WIDTH) {
    & > * {
      visibility: visible;
      background-color: rgba(0, 0, 0, 0.65);
    }
  }
}
</style>
