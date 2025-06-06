<template>
  <component class="slide-back" ref="el" :is="tag || 'section'">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import Hammer from 'hammerjs'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

defineProps<{ tag?: string }>()

let hammer: HammerManager | null = null

const el = useTemplateRef('el')

const router = useRouter()

onMounted(() => {
  hammer = new Hammer.Manager(el.value as HTMLElement, {
    recognizers: [
      [Hammer.Swipe, { direction: Hammer.DIRECTION_RIGHT, threshold: 10 }]
    ]
  })
  hammer.on('swiperight', () => {
    router.back()
  })
})

onBeforeUnmount(() => {
  hammer?.destroy()
  hammer = null
})
</script>

<style lang="scss" scoped>
.slide-back {
  background: var(--bg-color);
}
</style>
