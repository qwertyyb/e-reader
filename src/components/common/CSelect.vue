<template>
  <div class="c-select" ref="el" :class="{'options-visible': optionsVisible}">
    <div class="c-select-label"
      @click="optionsVisible = !optionsVisible"
      ref="reference"
      :style="{'anchor-name': '--c-select-label-' + id} as any"
    >
      <slot :value="modelValue" :label="currentLabel">
        <span class="c-select-label-value">{{ currentLabel }}</span>
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </slot>
    </div>
    <ul class="c-select-options c-select-popover"
      :class="placement"
      popover
      ref="floating"
      @toggle="toggleHandler"
      :style="{ ...floatingStyles, 'position-anchor': '--c-select-label-' + id } as any"
      v-if="!isSmall">
      <li class="c-select-option"
        v-for="(option, index) in options"
        @click="selectOption(option)"
        :key="option.value as any"
        :class="{'selected': modelValue === option.value}"
      >
        <slot name="option" :option="option" :index="index" :selected="modelValue === option.value">
          <div class="option-label">{{ option.label }}</div>
          <div class="option-subtitle">{{ option.subtitle }}</div>
        </slot>
      </li>
    </ul>
    <c-picker
      v-else
      :options="options"
      :visible="optionsVisible && isSmall"
      :model-value="modelValue"
      :title="title"
      @select="selectOption"
      @close="optionsVisible=false"
    >
      <template v-slot:option="{ option, index, selected }">
        <slot name="option" :option="option" :index="index" :selected="selected"></slot>
      </template>
    </c-picker>
  </div>
</template>

<script setup lang="ts" generic="T extends any = any">
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';
import { useFloating, offset, shift, flip } from '@floating-ui/vue';
import CPicker from './CPicker.vue';
import { isSmall } from '@/utils/env';

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

const id = useId();
const el = useTemplateRef('el')
const reference = useTemplateRef('reference')
const floating = useTemplateRef('floating');
const { floatingStyles, update, placement } = useFloating(reference, floating, { placement: 'bottom', middleware: [offset(12), flip(), shift({ padding: 12 })] });

const currentLabel = computed(() => {
  const selectedOption = props.options.find(option => option.value === modelValue.value)
  return selectedOption?.label || ''
})

const optionsVisible = ref(false)

watch(optionsVisible, async (val) => {
  if (val) {
    await nextTick()
    floating.value?.showPopover()
    update()
  } else {
    floating.value?.hidePopover()
  }
})

const toggleHandler = (event: ToggleEvent) => {
  optionsVisible.value = event.newState === 'open'
}

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
.c-select-popover {
  // CSS Anchor Positioning 尚不成熟，position-try-fallbacks 会导致 popover 显示时的过渡效果失效
  // 浏览器的支持也还有提升空间，暂时不使用此方案，待后续支持

  position-anchor: --c-select-label;

  // 方案一: 使用 position-area
  // position-area: bottom span-left;
  // position-try/position-try-fallbacks + calc-size 会导致 popover 显示时的过渡效果失效
  // position-try: left;

  // 方案二: 使用 position
  // position: absolute;
  // top: anchor(bottom);
  // // left: anchor(left);
  // right: anchor(right);
  min-width: anchor-size(width);
  max-height: 30vh;
  // justify-self: anchor-center;

  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 12px);
  margin: 0;
  border: none;
}
.c-select-options {
  z-index: 1;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  interpolate-size: allow-keywords;
  transition: display .2s, overlay .2s, clip-path .2s;
  transition-behavior: allow-discrete;
  // overflow: hidden;
  border: 1px solid var(--border-color);
  text-align: left;
  height: fit-content;
  clip-path: rect(0 100% 0 0);
  &:popover-open {
    clip-path: rect(0 100% 100% 0);
    @starting-style {
      clip-path: rect(0 100% 0 0);
    }
  }
  &.top {
    clip-path: rect(100% 100% 100% 0);
    &:popover-open {
      clip-path: rect(0 100% 100% 0);
      @starting-style {
        clip-path: rect(100% 100% 100% 0);
      }
    }
  }
  .c-select-option {
    background: light-dark(#fff, #000);
    padding: 4px 16px;
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
  .option-label {
    font-size: 14px;
    white-space: nowrap;
    color: inherit;
  }
  .option-subtitle {
    font-size: 12px;
    opacity: 0.6;
    white-space: nowrap;
  }
}
</style>
