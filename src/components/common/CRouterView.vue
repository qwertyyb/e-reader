<template>
  <div class="c-router-view" ref="el">
    <ul class="route-history-list">
      <CHistoryPage
        v-for="(node, index) in matchedList"
        :key="node.locations[0].uniqueId"
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

console.log('matchedList', matchedList)

// const pages = useTemplateRef('pages')

// const el = useTemplateRef('el')

// const history = shallowRef<RouteLocation[]>([])

// const runDefaultPushAnimation = async (cur?: HTMLElement | null, prev?: HTMLElement | null) => {
//   const prevAnim = prev?.animate([{ transform: `translateX(0)` }, { transform: `translateX(-30%)` }], { duration: 200, easing: 'ease-out' })
//   const curAnim = cur?.animate([{ transform: `translateX(100%)` }, { transform: `translateX(0)` }], { duration: 200, easing: 'ease-out' })
//   await Promise.all([prevAnim?.finished, curAnim?.finished])
//   prev?.classList.add('animate-end')
// }

// const runDefaultPopAnimation = async (cur?: HTMLElement | null, prev?: HTMLElement | null) => {
//   const prevAnim = prev?.animate(
//     [
//       { transform: `translateX(0)`, '--mask-opacity': '0' },
//       {
//         transform: prev.style.getPropertyValue('transform') ||`translateX(-30%)`,
//         '--mask-opacity': prev.style.getPropertyValue('--mask-opacity') || '0'
//       }
//     ],
//     { duration: 200, easing: 'ease-in', direction: 'reverse' }
//   )
//   const curAnim = cur?.animate(
//     [
//       { transform: `translateX(100%)` },
//       { transform: cur.style.getPropertyValue('transform') || `translateX(0)` }
//     ],
//     { duration: 200, easing: 'ease-in', direction: 'reverse' }
//   )
//   await Promise.all([prevAnim?.finished, curAnim?.finished])
//   prev?.style.removeProperty('transform')
//   prev?.style.removeProperty('--mask-opacity')
// }

// const popHandler = async (delta: number, options: { hasUAVisualTransition: boolean }) => {
//   const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
//   const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
//   const to = history.value[history.value.length + delta - 1]
//   const from = history.value[history.value.length + delta]
//   const prev = components.value?.[history.value.length + delta - 1]
//   const cur = components.value?.[history.value.length + delta]
//   if (typeof cur?.onBackFrom === 'function') {
//     await cur.onBackFrom(to, from, toEl, fromEl)
//   } else if (!disableAnim.value && !options.hasUAVisualTransition && isSmall.value) {
//     console.log('back', disableAnim.value)
//     await runDefaultPopAnimation(fromEl, toEl);
//   }
//   history.value = [...history.value.slice(0, history.value.length + delta)]
//   if (typeof prev?.onBackTo === 'function') {
//     prev.onBackTo(to, from, toEl, fromEl)
//   }
//   if (!history.value.length) {
//     // 无法后退时，回到主页
//     history.value = [appRouter.resolve({ path: '/' })]
//   }
// }

// const pushHandler = async (to: RouteLocation, from?: RouteLocation) => {
//   // 暂时先不考虑多层级的嵌套路由
//   history.value = [...history.value, to]
//   await nextTick()
//   const fromEl = el.value?.querySelector<HTMLElement>('.route-history-item.previous')
//   const toEl = el.value?.querySelector<HTMLElement>('.route-history-item.current')
//   const prevRouteComp = components.value?.[history.value.length - 2]
//   const curRouteComp = components.value?.[history.value.length - 1]
//   if (typeof prevRouteComp?.onForwardFrom === 'function') {
//     prevRouteComp.onForwardFrom(to, from!, toEl, fromEl)
//   }

//   if (typeof curRouteComp?.onForwardTo === 'function') {
//     curRouteComp.onForwardTo(to, from, toEl, fromEl)
//     return;
//   }
//   if (disableAnim.value || history.value.length <= 1 || !isSmall.value) return;
//   runDefaultPushAnimation(toEl, fromEl);
// }

// const replaceHandler = (to: RouteLocation) => {
//   history.value = [...history.value.slice(0, history.value.length - 1), to]
// }

// appRouter.onPush(pushHandler)
// appRouter.onPop(popHandler)
// appRouter.onReplace(replaceHandler)

// appRouter.isReady().then(() => {
//   pushHandler(appRouter.currentRoute.value)
// })

// onBeforeUnmount(() => {
//   appRouter.offPop(popHandler)
//   appRouter.offPush(pushHandler)
//   appRouter.offReplace(replaceHandler)
// })

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
  @media (width > variables.$MAX_SMALL_WIDTH) {
    & > * {
      visibility: visible;
      background-color: rgba(0, 0, 0, 0.65);
    }
  }
}
</style>
