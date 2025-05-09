<template>
  <virtual-list
    :data-key="dataKey"
    :data-sources="dataSources"
    ref="virtual"
    :estimate-size="estimateSize"
    @scroll="onScroll">
    <template #header v-if="$slots.header"><slot name="header"></slot></template>
    <template v-slot="{ source, index }">
      <slot :source="source" :index="index"></slot>
    </template>
  </virtual-list>
</template>

<script setup lang="ts" generic="ListItem extends Record<string, any>">
import { onMounted, useTemplateRef, watch } from 'vue';

const props = defineProps<{
  dataSources: ListItem[],
  dataKey: string,
  estimateSize?: number,
  activeId?: number | string,
  activeIndex?: number
}>()

const emits = defineEmits<{
  scroll: [Event, { start: number, end: number, padFront: number, padBehind: number }]
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const virtualListRef = useTemplateRef<any>('virtual')

const scrollToTarget = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
  if (typeof props.activeIndex === 'number') {
    virtualListRef.value?.scrollToIndex(props.activeIndex)
    return;
  }
  if (!props.activeId && props.activeId !== 0) return
  const index = props.dataSources.findIndex(item => item[props.dataKey] === props.activeId)
  if (index < 0) return;
  virtualListRef.value?.scrollToIndex(index)
}

watch(() => props.activeId, scrollToTarget)
watch(() => props.activeIndex, scrollToTarget)

onMounted(scrollToTarget)

const onScroll = (event: Event, range: { start: number, end: number, padFront: number, padBehind: number }) => {
  emits('scroll', event, range)
}

defineExpose({
  scrollToIndex(index: number) {
    return virtualListRef.value?.scrollToIndex(index)
  }
})
</script>
