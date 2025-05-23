<template>
  <div class="slide-back" ref="el">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import Hammer from 'hammerjs'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

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
