import { createGesture, type IGestureOptions } from "@/utils/gesture";
import { onBeforeUnmount, watchEffect, type ShallowRef } from "vue";

export const useGesture = (el: Readonly<ShallowRef<HTMLElement | null>>, options: Omit<IGestureOptions, 'el'>) => {
  let gesture: ReturnType<typeof createGesture> | null = null

  watchEffect(() => {
    if (!el.value) return;
    gesture?.clean()
    gesture = createGesture({ ...options, el: el.value })
  })

  onBeforeUnmount(() => {
    gesture?.clean()
    gesture = null
  })
}
