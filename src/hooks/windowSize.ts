import { MAX_SMALL_WIDTH } from "@/constant"
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

export enum Size {
  SMALL = 'small',
  MEDIUM = 'medium',
}

export const useWindowSize = () => {
  const width = ref(window.innerWidth)

  const isSmall = computed(() => {
    return width.value <= MAX_SMALL_WIDTH
  })

  const handler = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', handler)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handler)
  })

  return {
    width,
    isSmall
  }
}