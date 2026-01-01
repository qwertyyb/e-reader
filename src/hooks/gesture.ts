import { onBeforeUnmount, shallowRef, watchEffect, type ShallowRef } from "vue";
import { createGesture, type IGestureOptions } from "@/utils/gesture";

export const useGesture = (el: Readonly<ShallowRef<HTMLElement | null>>, options: Omit<IGestureOptions, 'el'>) => {
  const gesture = shallowRef<ReturnType<typeof createGesture> | null>(null)

  watchEffect(() => {
    if (!el.value) return;
    gesture.value?.clean()
    gesture.value = createGesture({ ...options, el: el.value })
  })

  onBeforeUnmount(() => {
    gesture.value?.clean()
    gesture.value = null
  })

  return { gesture }
}
