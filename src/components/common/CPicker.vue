<template>
  <c-dialog
    :visible="visible"
    @close="$emit('close')"
    class="c-picker"
    body-style="padding: 16px 0"
    :title="title"
  >
    <div class="c-option-list">
      <div
        v-for="(option, index) in options"
        :key="option.value as any"
        class="c-option"
        :class="{selected: modelValue === option.value}"
        @click="$emit('select', option)"
      >
        <slot name="option" :option="option" :index="index" :selected="modelValue === option.value">
          {{ option.label }}
        </slot>
      </div>
    </div>
  </c-dialog>
</template>

<script setup lang="ts" generic="V extends any = any">
import CDialog from './CDialog.vue';

const modelValue = defineModel<V>();

defineProps<{
  options: { value: V, label: string }[],
  title?: string
  visible: boolean
}>()

defineEmits<{
  select: [{ value: V, label: string }],
  close: []
}>()
</script>

<style lang="scss" scoped>
.c-option {
  padding: 12px 16px;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
}
</style>
