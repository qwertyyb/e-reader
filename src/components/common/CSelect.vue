<template>
  <div class="c-select">
    <div class="c-select-label" @click="optionsVisible=true">
      <slot name="label" :value="modelValue">{{ label }}</slot>
    </div>
    <c-dialog :visible="optionsVisible" @close="optionsVisible=false" class="c-select-dialog">
      <div class="c-option-list">
        <slot></slot>
      </div>
    </c-dialog>
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import CDialog from './CDialog.vue'

const modelValue = defineModel()

defineProps<{ label?: string }>()

const optionsVisible = ref(false)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onOptionSelected = (value: any) => {
  modelValue.value = value
  optionsVisible.value = false
}

provide(Symbol.for('c-select:modelValue'), modelValue)
provide(Symbol.for('c-select:onOptionSelected'), onOptionSelected)
</script>
