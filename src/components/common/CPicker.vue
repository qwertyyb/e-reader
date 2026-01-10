<template>
  <c-dialog
    :visible="visible"
    @close="$emit('close')"
    class="c-picker"
    body-style="padding: 16px 0"
    :title="title"
  >
    <template v-slot:header>
      <h2 class="c-picker-title" v-if="title">{{ title }}</h2>
      <span class="material-symbols-outlined close-icon pointer" @click="$emit('close')">keyboard_arrow_down</span>
    </template>
    <div class="c-option-list">
      <div
        v-for="(option, index) in options"
        :key="option.value as any"
        class="c-option"
        :class="{selected: modelValue === option.value}"
        @click="$emit('select', option)"
      >
        <slot name="option" :option="option" :index="index" :selected="modelValue === option.value">
          <div class="option-label">{{ option.label }}</div>
          <div class="option-subtitle">{{ option.subtitle }}</div>
        </slot>
      </div>
    </div>
  </c-dialog>
</template>

<script setup lang="ts" generic="V extends any = any">
import CDialog from './CDialog.vue';

const modelValue = defineModel<V>();

defineProps<{
  options: { value: V, label: string, subtitle?: string }[],
  title?: string
  visible: boolean
}>()

defineEmits<{
  select: [{ value: V, label: string }],
  close: []
}>()
</script>

<style lang="scss" scoped>
.c-picker-title {
  width: 100%;
  text-align: center;
  font-size: 16px;
  font-weight: normal;
}
.close-icon {
  position: absolute;
  top: 6px;
  right: 16px;
  font-size: 22px;
  padding: 4px;
}
.c-option-list {
  max-height: calc(100vh - 300px);
  overflow: auto;
  overscroll-behavior: contain;
}
.c-option {
  padding: 12px 16px;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
}
.option-label {
  color: inherit;
}
.option-subtitle {
  font-size: 12px;
  opacity: 0.6;
  color: inherit;
}
</style>
