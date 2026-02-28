<template>
  <c-dialog
    :visible="visible"
    class="thought-edit-dialog"
    @close="visible = false"
  >
    <div class="quote-info">
      <div class="pre-line"></div>
      <div class="quote-text">{{ editingMark?.text }}</div>
    </div>
    <div class="thought-input-wrapper">
      <span class="material-symbols-outlined thought-icon">record_voice_over</span>
      <c-textarea
        v-if="editingMark"
        class="thought-input"
        placeholder="写下这一刻的想法"
        ref="input"
        v-model="editingMark.thought"
        :max-height="90"
      ></c-textarea>
      <button class="save-btn" @click="saveThought">保存</button>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from "./common/CDialog.vue";
import CTextarea from "./common/CTextarea.vue";
import { marks } from "@/services/storage";
import { nextTick, ref, toRaw, useTemplateRef } from "vue";

const emits = defineEmits<{
  success: [IMarkEntity]
}>()

const inputEl = useTemplateRef('input')
const visible = ref(false);

const editingMark = ref<IMarkEntity>()

const saveThought = async () => {
  const { id, ...rest } = toRaw(editingMark.value!)
  console.log(editingMark.value, rest, toRaw(editingMark.value))
  if (id) {
    await marks.update(id, rest)
  } else {
    await marks.add(rest)
  }
  visible.value = false;

  emits('success', editingMark.value!)
}

defineExpose({
  async open(mark: IMarkEntity) {
    editingMark.value = mark
    visible.value = true
    // create invisible dummy input to receive the focus first
    const fakeInput = document.createElement('input')
    fakeInput.setAttribute('type', 'text')
    fakeInput.style.position = 'absolute'
    fakeInput.style.opacity = '0'
    fakeInput.style.height = '0'
    fakeInput.style.fontSize = '16px' // disable auto zoom

    // you may need to append to another element depending on the browser's auto
    // zoom/scroll behavior
    document.body.prepend(fakeInput)

    await nextTick()
    inputEl.value?.focus();
    fakeInput.remove()
  }
})

</script>

<style lang="scss" scoped>
.quote-info {
  display: flex;
}
.pre-line {
  width: 3px;
  flex-shrink: 0;
  margin-top: 2px;
  background: var(--card-light-bg-color-1);
  margin-right: 6px;
  border-radius: 999px;
}
.quote-text {
  opacity: 0.6;
}

.thought-input-wrapper {
  padding: 12px 0;
  display: flex;
  align-items: flex-end;
  width: auto;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
  .thought-icon {
    margin-right: 8px;
    font-size: 22px;
    margin-bottom: 8px;
  }
}

.thought-input {
  flex: 1;
  font-size: 16px;
  line-height: 1.4;
}
.save-btn {
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  padding: 0 8px;
  height: 34px;
  line-height: 34px;
  margin-bottom: 1px;
}
</style>
