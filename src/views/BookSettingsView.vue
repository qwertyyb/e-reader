<template>
  <navigation-bar title="书籍设置"></navigation-bar>
  <div class="book-settings-view">
    <section class="settings-section">
      <h2 class="settings-section-title">目录设置</h2>
      <ul class="toc-settings settings-content">
        <li class="setting-item" v-for="(reg, index) in bookConfig.toc" :key="index">
          <div class="setting-item-header">
            <h3 class="setting-item-label">{{ index + 1 }}级目录</h3>
            <span class="material-symbols-outlined icon"
              v-if="index > 0"
              @click="upTocItem(index)"
            >arrow_upward</span>
            <span class="material-symbols-outlined icon"
              v-if="index < bookConfig.toc.length - 1"
              @click="downTocItem(index)"
            >arrow_downward</span>
          </div>
          <input type="text" class="setting-input" v-model.trim="bookConfig.toc[index]">
        </li>
        <li class="setting-item btns-item">
          <button class="preview-toc-btn btn" @click="addToc">添加</button>
          <button class="preview-toc-btn btn" @click="previewToc">预览</button>
          <button class="save-toc-btn btn primary-btn" @click="saveToc(true)">保存</button>
        </li>
      </ul>
    </section>
    <c-dialog
      height="90vh"
      title="预览目录"
      :visible="dialog === 'chapterList'"
      @close="dialog=null"
      body-style="padding:0"
    >
      <template #header>
        <div class="preview-header">
          <h3 class="preview-title">预览目录</h3>
          <button class="btn primary-btn" @click="saveToc(false)">确认</button>
        </div>
      </template>
      <ChapterList :chapter-list="chapterList"></ChapterList>
    </c-dialog>
  </div>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import ChapterList from '@/components/ChapterList.vue'
import { chapterListStore, contentStore } from '@/services/storage';
import { parseChapterList } from '@/services/txt-file';
import { showToast } from '@/utils';
import { ref, toRaw } from 'vue';
import NavigationBar from '@/components/NavigationBar.vue';
import { defaultTocRegList } from '@/config';

const props = defineProps<{ id: string | number }>()

const bookConfig = ref({
  toc: defaultTocRegList.map(reg => reg.source)
})

const dialog = ref<string | null>('')
const chapterList = ref<IChapter[]>([])
const getToc = async () => {
  const regList: RegExp[] = []
  bookConfig.value.toc.forEach(reg => {
    try {
      regList.push(new RegExp(reg))
    } catch(err) {
      showToast('一级目录不正确')
      throw err
    }
  })
  if (!regList.length) {
    showToast('请至少配置一个目录')
    throw new Error('no avaliable toc config')
  }
  const result = await contentStore.get(Number(props.id))
  const content = result.content
  return parseChapterList(content, { regList })
}
const previewToc = async () => {
  chapterList.value = await getToc()
  dialog.value = 'chapterList'
}
const saveToc = async (refreshToc: boolean) => {
  if (refreshToc) {
    chapterList.value = await getToc()
  }
  dialog.value = null
  chapterListStore.update(Number(props.id), { chapterList: toRaw(chapterList.value) })
}

const upTocItem = (index: number) => {
  const cur = bookConfig.value.toc[index]
  const prev = bookConfig.value.toc[index - 1]
  bookConfig.value.toc[index] = prev
  bookConfig.value.toc[index - 1] = cur
}
const downTocItem = (index: number) => {
  const cur = bookConfig.value.toc[index]
  const next = bookConfig.value.toc[index + 1]
  bookConfig.value.toc[index] = next
  bookConfig.value.toc[index + 1] = cur
}
const addToc = () => {
  bookConfig.value.toc.push('')
}

</script>

<style lang="scss" scoped>
.book-settings-view {
  padding: 16px;
}
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
  }
  .icon {
    margin-left: 12px;
  }
}
.setting-item-label {
  font-size: 14px;
  opacity: 0.6;
}
.settings-section-title {
  font-size: 14px;
  opacity: 0.6;
  margin: 0 0 8px 12px;
}
.settings-content {
  background: #fff;
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
}
.btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  font-weight: 500;
  &.primary-btn {
    background: rgb(56, 66, 255);
    color: #fff;
    border: none;
  }
  &.text-btn {
    color: rgb(56, 66, 255);
    border: none;
  }
  & + .btn {
    margin-left: 12px;
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
