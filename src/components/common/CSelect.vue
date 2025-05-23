<template>
  <div class="c-select">
    <div class="c-select-label" @click="optionsVisible=true">
      <div class="c-select-label-value">
        <slot name="label" :value="modelValue">{{ currentLabel }}</slot>
      </div>
      <span class="material-symbols-outlined arrow-icon">chevron_right</span>
    </div>
    <c-dialog :visible="optionsVisible" @close="optionsVisible=false" class="c-select-dialog" body-style="padding: 16px 0">
      <div class="c-option-list">
        <div
          v-for="(option, index) in options"
          :key="option.value as any"
          class="c-option"
          :class="{selected: modelValue === option.value}"
          @click="selectOption(option.value)"
        >
          <slot name="option" :option="option" :index="index" :selected="modelValue === option.value">
            {{ option.label }}
          </slot>
        </div>
      </div>
    </c-dialog>
  </div>
</template>

<script setup lang="ts" generic="T extends any = any">
import { computed, ref } from 'vue';
import CDialog from './CDialog.vue'

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

const selectOption = (value: T) => {
  const oldValue = modelValue.value
  modelValue.value = value
  emit('change', value, oldValue)
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
  font-size: 18px;
  .arrow-icon {
    margin-left: auto;
    font-size: 24px;
  }
}
.c-option {
  padding: 12px 16px;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
}
</style>
