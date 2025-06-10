import { onBeforeUnmount, watchEffect, type ShallowRef } from "vue";

export const useResizeObserver = (el: Readonly<ShallowRef<HTMLElement | null>>, callback: ResizeObserverCallback, options?: ResizeObserverOptions) => {
  const observer = new ResizeObserver(callback)
  watchEffect(() => {
    if (!el.value) return;
    observer.observe(el.value, options)
  })
  onBeforeUnmount(() => {
    observer.disconnect()
  })
}
