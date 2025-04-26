<template>
  <div class="c-progress">
    <div class="c-progress-prefix" @click="action('dec')"><slot name="prefix"></slot></div>
    <div class="c-progress-bar" @click="onTap" @touchmove="onMove" ref="bar">
      <div class="c-progress-line"></div>
      <div class="c-progress-indicator" :style="{left: left}"></div>
    </div>
    <div class="c-progress-suffix" @click="action('inc')"><slot name="suffix"></slot></div>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

const modelValue = defineModel<number>({ required: true })

const props = defineProps<{
  min: number,
  max: number,
  step: number
}>()

const emits = defineEmits<{
  change: [number]
}>()

const barRef = useTemplateRef('bar')

const left = computed(() => `${(modelValue.value - props.min) / (props.max - props.min) * 100}%`)

const setValue = (value: number) => {
  modelValue.value = value
  emits('change', value)
}
const setValueFromOffset = (left: number) => {
  const { x, width } = barRef.value!.getBoundingClientRect();
  const percent = (left - x) / width
  const value = Math.round(percent * (props.max - props.min) / props.step) * props.step + props.min
  setValue(value)
}
const onTap = (e: MouseEvent) => {
  setValueFromOffset(e.clientX)
}
const onMove = (e: TouchEvent) => {
  setValueFromOffset(e.touches[0].clientX)
}
const action = (action: 'dec' | 'inc') => {
  let value = modelValue.value
  if (action === 'dec') {
    value = Math.max(props.min, modelValue.value - props.step)
  } else if (action === 'inc') {
    value = Math.min(props.max, modelValue.value + props.step)
  }
  setValue(value)
}
</script>

<style lang="scss" scoped>
.c-progress, .c-progress .c-progress-bar {
  display: flex;
  align-items: center;
}

.c-progress .c-progress-bar {
  flex: 1;
  margin: 0 10px;
  height: 16px;
  position: relative;
}

.c-progress .c-progress-bar .c-progress-line {
  height: 3px;
  background: light-dark(var(--light-text-color), var(--dark-text-color));
  border-radius: 9999px;
  width: 100%;
}
.c-progress .c-progress-bar .c-progress-indicator {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  top: 4px;
  left: 50%;
  margin-left: -4px;
  background: light-dark(var(--light-text-color), var(--dark-text-color));
}
</style>
