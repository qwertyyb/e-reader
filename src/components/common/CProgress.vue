<template>
  <div class="c-progress">
    <div class="c-progress-prefix" @click="action('dec')"><slot name="prefix"></slot></div>
    <div class="c-progress-bar" @click="onTap" @touchmove="onMove" ref="bar">
      <div class="c-progress-line" :style="{width: left}"></div>
      <div class="c-progress-indicator" :style="{left: left}"><slot name="label">{{ modelValue }}</slot></div>
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
.c-progress {
  --progress-height: 32px;
}
.c-progress, .c-progress .c-progress-bar {
  display: flex;
  align-items: center;
}
.c-progress-prefix, .c-progress-suffix {
  display: flex;
  align-items: center;
}

.c-progress .c-progress-bar {
  flex: 1;
  margin: 0 10px;
  height: var(--progress-height);
  position: relative;
  background-color: light-dark(#e3e3e3, #333);
  border-radius: 9999px;
}

.c-progress .c-progress-bar .c-progress-line {
  height: 100%;
  background: light-dark(#d0d0d0, #444);
  border-radius: 9999px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  width: 50%;
}
.c-progress .c-progress-bar .c-progress-indicator {
  position: absolute;
  height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 9999px;
  top: 0;
  left: 50%;
  margin-left: calc(0px - var(--progress-height) / 2);
  background: light-dark(#fff, #000);
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
