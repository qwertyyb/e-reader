<template>
  <div class="c-select" ref="el" :class="{'options-visible': optionsVisible}">
    <div class="c-select-label"
      @click="optionsVisible = !optionsVisible"
      :style="{'anchor-name': '--c-select-label-' + id}"
    >
      <slot :value="modelValue" :label="currentLabel">
        <span class="c-select-label-value">{{ currentLabel }}</span>
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </slot>
    </div>
    <ul class="c-select-options"
      popover
      ref="floating"
      :style="{'position-anchor': '--c-select-label-' + id}"
    >
      <li class="c-select-option"
        v-for="(option, index) in options"
        @click="selectOption(option)"
        :key="option.value as any"
      >
        <slot name="option" :option="option" :index="index" :selected="modelValue === option.value">
          <div class="option-label">{{ option.label }}</div>
          <div class="option-subtitle">{{ option.subtitle }}</div>
        </slot>
      </li>
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
import { computed, ref, useId, useTemplateRef, watch } from 'vue';
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
const floating = useTemplateRef('floating')
const id = useId();

const { isSmall } = useWindowSize();

const currentLabel = computed(() => {
  const selectedOption = props.options.find(option => option.value === modelValue.value)
  return selectedOption?.label || ''
})

const optionsVisible = ref(false)

watch(optionsVisible, (val) => {
  if (val) {
    floating.value?.showPopover()
  } else {
    floating.value?.hidePopover()
  }
})

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
  user-select: none;
  anchor-name: --c-select-label;
  :deep(.arrow-icon) {
    margin-left: auto;
    font-size: 24px;
    width: 24px;
    height: 24px;
    transition: transform .2s ease-out;
  }
}
.c-select-options {
  position-anchor: --c-select-label;
  position-area: bottom span-left;
  // position-try/position-try-fallbacks 会导致 popover 显示时的过渡效果失效
  // position-try: left;

  // position: absolute;
  // top: anchor(bottom);
  // // left: anchor(left);
  // right: anchor(right);
  // min-width: anchor-size(width);
  // justify-self: anchor-center;

  background: light-dark(#fff, #000);
  z-index: 1;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: all .2s;
  transition-behavior: allow-discrete;
  overflow: hidden;
  border: 1px solid var(--border-color);
  text-align: left;
  height: 0;
  &:popover-open {
    height: calc-size(fit-content, size);
    @starting-style {
      height: 0;
    }
  }
  .c-select-option {
    padding: 4px 16px;
  }
  .option-label {
    font-size: 14px;
    white-space: nowrap;
    &:first-child {
      padding-top: 8px;
    }
    &:last-child {
      padding-bottom: 8px;
    }
    &:hover {
      background: var(--theme-color-hover);
      color: #fff;
    }
  }
  .option-subtitle {
    font-size: 12px;
    opacity: 0.6;
    white-space: nowrap;
  }
}

@starting-style {
  .c-select-options:popover-open {
    height: 0;
  }
}
</style>
