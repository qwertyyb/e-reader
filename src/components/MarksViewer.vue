<template>
  <div class="marks-viewer">
    <h3 class="marks-viewer-title">笔记<span class="material-symbols-outlined more-icon">arrow_forward_ios</span></h3>
    <div class="mark-chapters">
      <div class="mark-chapter" v-for="chapter in chapterMarkList" :key="chapter.id">
        <h4 class="mark-chapter-title">{{ chapter.title }}</h4>
        <mark-list :mark-list="chapter.markList" @remove="removeMark" class="marks-viewer-list"></mark-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkList from "@/components/MarkList.vue"
import { marks } from "@/services/storage";
import { showToast } from "@/utils";
import { inject, ref } from "vue"

const props = defineProps<{
  bookId: number
}>()

const emits = defineEmits<{
  'mark-removed': [IMarkEntity]
}>()

const chapterMarkList = ref<{ id: number, title: string, markList: IMarkEntity[] }[]>([])

const chapterList = inject<{ cursor: number, title: string }[]>('chapterList')

const refresh = async () => {
  const markList = await marks.getListByBook(props.bookId)
  const chapterLabels = chapterList!.reduce<Record<string, string>>((acc, chapter) => {
    return {
      ...acc,
      [chapter.cursor]: chapter.title
    }
  }, {})
  const chapterIdMarkList = markList.reduce<Record<string, IMarkEntity[]>>((acc, mark) => {
    if (!acc[mark.chapterId]) {
      acc[mark.chapterId] = []
    }
    acc[mark.chapterId].push(mark)
    return acc
  }, {})
  const cml = Object.keys(chapterIdMarkList).map(chapterId => {
    return {
      id: Number(chapterId),
      title: chapterLabels[chapterId] || '未知章节',
      markList: chapterIdMarkList[chapterId]
    }
  }).sort((a, b) => a.id - b.id)

  chapterMarkList.value = cml
}

const removeMark = async (mark: IMarkEntity) => {
  await marks.remove(mark.id)
  showToast('已删除')
  refresh()
  emits('mark-removed', mark)
}
</script>
