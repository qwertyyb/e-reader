<template>
  <div class="c-textarea">
    <textarea
      v-model="modelValue"
      ref="textarea"
      :placeholder="placeholder"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue';

const modelValue = defineModel<string>('model-value')

const props = defineProps<{
  autoSize?: boolean,
  placeholder?: string,
  maxHeight?: number
}>()

const textareaRef = useTemplateRef('textarea')

watch(modelValue, async () => {
  await nextTick()
  if (!textareaRef.value) return;
  textareaRef.value.style.height = ''
  let target = textareaRef.value.scrollHeight
  if (props.maxHeight) {
    target = Math.min(props.maxHeight, target)
  }
  textareaRef.value.style.height = target + 'px' || ''
}, { immediate: true })

defineExpose({
  focus() {
    textareaRef.value?.focus()
  }
})
</script>

<style lang="scss" scoped>
textarea {
  outline: none;
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  vertical-align: top;
  padding: 8px;
  font-size: 16px;
  height: calc(16px + 16px * 1.4);
  box-sizing: border-box;
  border-radius: inherit;
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
