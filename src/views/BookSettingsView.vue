<template>
  <navigation-bar title="书籍设置"></navigation-bar>
  <div class="book-settings-view">
    <section class="settings-section">
      <h2 class="settings-section-title">目录设置</h2>
      <ul class="toc-settings settings-content">
        <li class="setting-item">
          <h3 class="setting-item-label">一级目录</h3>
          <input type="text" class="setting-input" v-model.trim="bookConfig.toc.level1">
        </li>
        <li class="setting-item">
          <h3 class="setting-item-label">二级目录</h3>
          <input type="text" class="setting-input" v-model.trim="bookConfig.toc.level2">
        </li>
        <li class="setting-item btns-item">
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
import { level1ChapterRegexp, level2ChapterRegexp } from '@/config';
import NavigationBar from '@/components/NavigationBar.vue';

const props = defineProps<{ id: string | number }>()

const bookConfig = ref({
  toc: {
    level1: level1ChapterRegexp,
    level2: level2ChapterRegexp
  }
})

const dialog = ref<string | null>('')
const chapterList = ref<IChapter[]>([])
const getToc = async () => {
  const regList: RegExp[] = []
  if (bookConfig.value.toc.level1) {
    try {
      regList.push(new RegExp(bookConfig.value.toc.level1))
    } catch(err) {
      showToast('一级目录不正确')
      throw err
    }
  }
  if (bookConfig.value.toc.level2) {
    try {
      regList.push(new RegExp(bookConfig.value.toc.level2))
    } catch(err) {
      showToast('二级目录不正确')
      throw err
    }
  }
  if (!regList) {
    showToast('请至少配置一个目录')
    throw new Error('no avaliable toc config')
  }
  const content = await contentStore.get(Number(props.id))
  return parseChapterList(content.content, { regList })
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
.setting-item-label {
  font-size: 14px;
  margin-bottom: 8px;
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
