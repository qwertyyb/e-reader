<template>
  <div class="book-toc-settings">
    <ul class="toc-settings settings-content">
      <li class="setting-item" v-for="(reg, index) in tocSettings" :key="index">
        <div class="setting-item-header">
          <h3 class="setting-item-label">{{ index + 1 }}级目录</h3>
          <span class="material-symbols-outlined icon"
            v-if="index > 0"
            @click="upTocItem(index)"
          >arrow_upward</span>
          <span class="material-symbols-outlined icon"
            v-if="index < tocSettings.length - 1"
            @click="downTocItem(index)"
          >arrow_downward</span>
          <span class="material-symbols-outlined icon"
            @click="deleteTocItem(index)"
          >delete</span>
          <span class="material-symbols-outlined icon"
            @click="insertBefore(index)"
          >arrow_insert</span>
          <span class="material-symbols-outlined icon add-after-icon"
            @click="insertAfter(index)"
          >arrow_insert</span>
        </div>
        <input type="text" class="setting-input" v-model.trim="tocSettings[index]">
      </li>
      <li class="setting-item btns-item">
        <button class="preview-toc-btn btn" @click="$emit('preview', tocSettings)">预览</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { level1ChapterRegexp, level2ChapterRegexp } from '@/config';

defineEmits<{ preview: [string[]] }>()
const tocSettings = defineModel<string[]>('model-value', {
  default: () => ([level1ChapterRegexp, level2ChapterRegexp])
})

const upTocItem = (index: number) => {
  const cur = tocSettings.value[index]
  const prev = tocSettings.value[index - 1]
  tocSettings.value[index] = prev
  tocSettings.value[index - 1] = cur
}
const downTocItem = (index: number) => {
  const cur = tocSettings.value[index]
  const next = tocSettings.value[index + 1]
  tocSettings.value[index] = next
  tocSettings.value[index + 1] = cur
}
const deleteTocItem = (index: number) => {
  tocSettings.value.splice(index, 1)
}

const insertBefore = (index: number) => {
  tocSettings.value.splice(index, 0, '')
}
const insertAfter = (index: number) => {
  tocSettings.value.splice(index + 1, 0, '')
}

</script>

<style lang="scss" scoped>
.toc-settings {
  list-style: none;
}
.setting-item + .setting-item {
  margin-top: 24px;
}
.setting-item-header {
  display: flex;
  align-items: center;
  height: 30px;
  margin-bottom: 8px;
  .icon {
    font-size: 20px;
    color: inherit;
    cursor: pointer;
    border: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
    border-radius: 4px;
    aspect-ratio: 1 / 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    margin-right: 12px;
  }
  .add-after-icon {
    transform: rotateX(180deg);
  }
}
.setting-item-label {
  font-size: 16px;
  opacity: 0.6;
}
.settings-section-title {
  font-size: 14px;
  opacity: 0.6;
  margin: 0 0 8px 12px;
}
.settings-content {
  background-color: var(--card-bg-color);
  border-radius: 4px;
  padding: 16px;
}
.setting-input {
  font-size: 14px;
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  outline: none;
  padding-bottom: 4px;
  font-weight: 500;
  background: none;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
