<template>
  <div class="c-select" ref="el" :class="{'options-visible': optionsVisible}">
    <div class="c-select-label" @click="optionsVisible = !optionsVisible">
      <slot :value="modelValue" :label="currentLabel">
        <span class="c-select-label-value">{{ currentLabel }}</span>
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </slot>
    </div>
    <ul class="c-select-options" :class="{ visible: !isSmall && optionsVisible }">
      <li class="c-select-option"
        v-for="option in options"
        @click="selectOption(option)"
        :key="option.value as any"
      >{{ option.label }}</li>
    </ul>
    <c-picker
      :options="options"
      :visible="optionsVisible && isSmall"
      :model-value="modelValue"
      :title="title"
      @select="selectOption"
      @close="optionsVisible=false"
    ></c-picker>
  </div>
</template>

<script setup lang="ts" generic="T extends any = any">
import { computed, ref, useTemplateRef, watch } from 'vue';
import CPicker from './CPicker.vue';
import { useWindowSize } from '@/hooks/windowSize';

const modelValue = defineModel<T>({ required: true })

const emit = defineEmits<{
  (e: 'change', value: T, oldValue: T): void
}>()

const props = defineProps<{
  title?: string
  options: {
    label: string
    value: T,
    subtitle?: string
  }[]
}>()

const el = useTemplateRef('el')

const { isSmall } = useWindowSize();

const currentLabel = computed(() => {
  const selectedOption = props.options.find(option => option.value === modelValue.value)
  return selectedOption?.label || ''
})

const optionsVisible = ref(false)

const handlePointerDown = (e: PointerEvent) => {
  if ((e.target as HTMLElement)?.closest('.c-select') === el.value) return;
  e.stopPropagation();
  optionsVisible.value = false
}

watch(() => !isSmall.value && optionsVisible.value, (val) => {
  window.removeEventListener('pointerdown', handlePointerDown, true)
  if (val) {
    window.addEventListener('pointerdown', handlePointerDown, true)
  }
})

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
  position: relative;
  cursor: pointer;
  &.options-visible .c-select-label:deep(.arrow-icon) {
    transform: rotate(90deg);
  }
}
.c-select-label {
  display: flex;
  align-items: center;
  height: 100%;
  font-size: 16px;
  z-index: 2;
  :deep(.arrow-icon) {
    margin-left: auto;
    font-size: 24px;
    width: 24px;
    height: 24px;
    transition: transform .2s ease-out;
  }
}
.c-select-options {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: light-dark(#fff, #000);
  z-index: 1;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: height .2s ease-out;
  interpolate-size: allow-keywords;
  height: 0;
  overflow: hidden;
  &.visible {
    height: auto;
  }
  .c-select-option {
    padding: 4px 16px;
    font-size: 16px;
    white-space: nowrap;
    &:first-child {
      padding-top: 8px;
    }
    &:last-child {
      padding-bottom: 8px;
    }
    &:hover {
      background: var(--theme-color-hover);
      color: light-dark(#fff, #fff);
    }
  }
}
</style>
