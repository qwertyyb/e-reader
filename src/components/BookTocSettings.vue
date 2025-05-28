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
    </ul>
    <div class="setting-item btns-item">
      <button class="preview-toc-btn btn" @click="$emit('confirm', tocSettings)">确认</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defaultTocRegList } from '@/config';


defineEmits<{ confirm: [string[]] }>()
const tocSettings = defineModel<string[]>({
  default: () => defaultTocRegList.map(reg => reg.source)
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
  let newToc = tocSettings.value.with(index, next)
  newToc = newToc.with(index + 1, cur)
  tocSettings.value = newToc
}
const deleteTocItem = (index: number) => {
  tocSettings.value = tocSettings.value.filter((_, i) => i !== index)
}

const insertBefore = (index: number) => {
  tocSettings.value = [
    ...tocSettings.value.slice(0, index),
    '',
    ...tocSettings.value.slice(index)
  ]
}
const insertAfter = (index: number) => {
  tocSettings.value = [
    ...tocSettings.value.slice(0, index + 1),
    '',
    ...tocSettings.value.slice(index + 1)
  ]
}

</script>

<style lang="scss" scoped>
.book-toc-settings {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg-color);
}
.toc-settings {
  list-style: none;
  flex: 1;
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
    border: 1px solid var(--border-color);
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
  margin-right: 12px;
}
.settings-section-title {
  font-size: 14px;
  opacity: 0.6;
  margin: 0 0 8px 12px;
}
.settings-content {
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
.btns-item {
  display: flex;
  justify-content: center;
  margin: 12px 0;
  .btn {
    padding: 4px 18px;
  }
}
</style>
