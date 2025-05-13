<template>
  <c-dialog title="目录设置" :visible="visible" @close="$emit('close')">
    <book-toc-settings @confirm="previewToc"></book-toc-settings>
    <c-dialog
      height="90vh"
      title="预览目录"
      :visible="chapterDialogVisible"
      @close="chapterDialogVisible = false"
      body-style="padding:0"
    >
      <template #header>
        <div class="preview-header">
          <h3 class="preview-title">预览目录</h3>
          <button class="btn primary-btn" @click="saveToc()">确认</button>
        </div>
      </template>
      <ChapterList :chapter-list="chapterList"></ChapterList>
    </c-dialog>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import BookTocSettings from '@/components/BookTocSettings.vue';
import ChapterList from '@/components/ChapterList.vue';
// import { level1ChapterRegexp, level2ChapterRegexp } from '@/config';
import { ref, toRaw } from 'vue';
import { showToast } from '@/utils';
import { chapterListStore, contentStore } from '@/services/storage';
import { parseChapterList } from '@/services/txt-file';

const props = defineProps<{ visible: boolean, bookId: number | string }>()
defineEmits<{ close: [] }>()

// const tocSettings = ref<string[]>([
//   level1ChapterRegexp, level2ChapterRegexp
// ])

const chapterDialogVisible = ref(false)
const chapterList = ref<IChapter[]>([])

const getToc = async (tocSettings: string[]) => {
  const regList: RegExp[] = []
  tocSettings.forEach(reg => {
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
  const result = await contentStore.get(Number(props.bookId))
  const content = result.content
  return parseChapterList(content, { regList })
}

const previewToc = async (tocSettings: string[]) => {
  chapterList.value = await getToc(tocSettings)
  chapterDialogVisible.value = true
}

const saveToc = async () => {
  chapterListStore.update(Number(props.bookId), { chapterList: toRaw(chapterList.value) })
}

</script>
