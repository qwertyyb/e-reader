<template>
  <div class="c-slide">
    <ul class="c-slide-list" ref="el"
      @scroll="scrollHandler"
    >
      <li class="c-slide-item"
        v-for="(item, index) in list"
        :key="index"
        @scroll="itemScrollHandler(item, index, $event)"
      >
        <slot name="item" :item="item" :index="index"></slot>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts" generic="T extends any = any">
import { debounce } from '@/utils';
import { nextTick, useTemplateRef, watch } from 'vue';

const props = defineProps<{
  list: T[]
}>()

const emits = defineEmits<{
  pop: [],
  loadMore: [T, number]
}>()

const el = useTemplateRef('el')

const scrollHandler = debounce(() => {
  if (!el.value) return;
  const page = Math.round((el.value.scrollLeft + el.value.clientWidth) / el.value.clientWidth)
  const total = Math.round(el.value.scrollWidth / el.value.clientWidth)
  console.log(page, total)
  if (page < total) {
    emits('pop')
  }
}, 200)

const itemScrollHandler = (item: T, index: number, event: Event) => {
  const target = event.currentTarget as HTMLElement
  const { scrollTop, clientHeight, scrollHeight } = target
  const distance = scrollHeight - scrollTop - clientHeight
  if (distance < 100) {
    emits('loadMore', item, index)
  }
}

watch(() => props.list.length, async (count, old) => {
  if (count > old) {
    await nextTick()
  }
  if (!el.value) return;
  el.value.scrollTo({ left: Math.max(0, count - 1) * el.value.clientWidth, behavior: 'smooth' })
})

defineExpose({
  pop() {
    if (!el.value) return;
    const page = Math.round(el.value.scrollLeft / el.value.clientWidth)
    if (page >= 1) {
      el.value.scrollTo({ left: (page - 1) * el.value.clientWidth, behavior: 'smooth' })
    }
  }
})

</script>

<style lang="scss" scoped>
.c-slide {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.c-slide-list {
  overflow: auto hidden;
  height: 100%;
  display: flex;
  scroll-snap-type: x mandatory;
}
.c-slide-item {
  height: 100%;
  width: 100%;
  flex-shrink: 0;
  overflow: hidden auto;
  scroll-snap-align: center;
}
</style>
