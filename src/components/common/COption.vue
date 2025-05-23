<template>
  <div class="c-option" :class="{selected: selected}" @click="select"><slot></slot></div>
</template>

<script setup lang="ts">
import { computed, inject, type ModelRef } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ value: any }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectedValue = inject<ModelRef<any>>(Symbol.for('c-select:modelValue'))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onOptionSelected = inject<(value: any) => void>(Symbol.for('c-select:onOptionSelected'))

const selected = computed(() => selectedValue?.value === props.value)

const select = () => {
  onOptionSelected?.(props.value)
}
</script>

<style lang="scss" scoped>
.c-option {
  height: 42px;
  line-height: 42px;
  text-align: center;
  font-size: 18px;
}
</style>
