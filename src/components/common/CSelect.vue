<template>
  <div class="c-select">
    <div class="c-select-label" @click="optionsVisible=true">
      <slot :value="modelValue" :label="currentLabel">
        <span class="c-select-label-value">{{ currentLabel }}</span>
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </slot>
    </div>
    <c-picker
      :options="options"
      :visible="optionsVisible"
      :model-value="modelValue"
      @select="selectOption"
      @close="optionsVisible=false"
    ></c-picker>
  </div>
</template>

<script setup lang="ts" generic="T extends any = any">
import { computed, ref } from 'vue';
import CPicker from './CPicker.vue';

const modelValue = defineModel<T>({ required: true })

const emit = defineEmits<{
  (e: 'change', value: T, oldValue: T): void
}>()

const props = defineProps<{
  options: {
    label: string
    value: T
  }[]
}>()

const currentLabel = computed(() => {
  const selectedOption = props.options.find(option => option.value === modelValue.value)
  return selectedOption?.label || ''
})

const optionsVisible = ref(false)

const selectOption = (option: { value: T, label: string }) => {
  const oldValue = modelValue.value
  modelValue.value = option.value
  emit('change', option.value, oldValue)
  optionsVisible.value = false
}
</script>

<style lang="scss" scoped>
.c-select {
  width: 100%;
}
.c-select-label {
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 18px;
  .arrow-icon {
    margin-left: auto;
    font-size: 24px;
  }
}
</style>
