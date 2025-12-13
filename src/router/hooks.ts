import { inject, onBeforeUnmount, onMounted } from "vue"
import { pageEventKey } from "./const"

const createOnPageEvent = (eventName: string) => (handler: () => void) => {
  const pageEvent = inject<EventTarget>(pageEventKey)
  onMounted(() => {
    pageEvent?.addEventListener(eventName, handler)
  })
  onBeforeUnmount(() => {
    pageEvent?.removeEventListener(eventName, handler)
  })
}

export const onPageEnter = createOnPageEvent('pageEnter')

export const onPageExit = createOnPageEvent('pageExit')

export const onPageBack = createOnPageEvent('pageBack')

export const onPageLeave = createOnPageEvent('pageLeave')