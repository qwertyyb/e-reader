<template>
  <c-dialog title="目录设置" :visible="visible"
    @close="$emit('close')"
    height="60vh"
  >
    <book-toc-settings @confirm="previewToc" v-model="tocSettings"></book-toc-settings>
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
import { ref, toRaw, watch } from 'vue';
import { showToast } from '@/utils';
import { booksStore, chapterListStore, contentStore } from '@/services/storage';
import { parseChapterList } from '@/services/parser/txt-file';

const props = defineProps<{ visible: boolean, bookId: number | string }>()
defineEmits<{ close: [] }>()

const chapterDialogVisible = ref(false)
const chapterList = ref<IChapter[]>([])
const tocSettings = ref<string[]>([])

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
  return parseChapterList(content, { regList }).chapterList
}

const previewToc = async (tocSettings: string[]) => {
  chapterList.value = await getToc(tocSettings)
  chapterDialogVisible.value = true
}

const saveToc = async () => {
  await chapterListStore.update(Number(props.bookId), { chapterList: toRaw(chapterList.value) })
  const info = await booksStore.get(Number(props.bookId))
  await booksStore.update(Number(props.bookId), { ...info, tocRegList: tocSettings.value.map(i => new RegExp(i)) })
  location.reload()
}

watch(() => props.visible, async (val) => {
  if (val) {
    const info = await booksStore.get(Number(props.bookId))
    tocSettings.value = (info?.tocRegList || []).map(i => i.source)
    tocSettings.value = tocSettings.value.length ? tocSettings.value : ['^第\\d+章\\s+.*$']
  }
})

</script>

<style lang="scss" scoped>
.preview-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
