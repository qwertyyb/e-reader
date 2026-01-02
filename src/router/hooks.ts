import { inject, onBeforeUnmount } from "vue"
import { historyItemKey, type RouteHistoryItem, type RouteHistoryLifecycle } from "./const"

const createPageListener = <K extends keyof RouteHistoryLifecycle>(lifecycleName: K) => (handler: RouteHistoryLifecycle[K]) => {
  const historyItem = inject<RouteHistoryItem>(historyItemKey)
  if (!historyItem) return;
  if (!historyItem.lifecycle) {
    historyItem.lifecycle = {}
  }
  if (!historyItem.lifecycle[lifecycleName]) {
    historyItem.lifecycle[lifecycleName] = []
  }
  historyItem.lifecycle[lifecycleName].push(handler)
  onBeforeUnmount(() => {
    if (!historyItem.lifecycle?.[lifecycleName]) return;
    const list = historyItem.lifecycle?.[lifecycleName]?.filter(h => h !== handler) ?? [];
    (historyItem.lifecycle[lifecycleName] as RouteHistoryLifecycle[K][]) = list
  })
}

export const onForwardTo = createPageListener('onForwardTo')

export const onBackTo = createPageListener('onBackTo')

export const onForwardFrom = createPageListener('onForwardFrom')

export const onBackFrom = createPageListener('onBackFrom')
