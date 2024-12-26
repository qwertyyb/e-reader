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

<style lang="scss" scoped>
.marks-viewer {
  width: 100vw;
  box-sizing: border-box;
  padding: 10px 0 env(safe-area-inset-bottom) 16px;
  background: rgb(238, 238, 238);
  max-height: 80vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.marks-viewer .marks-viewer-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  height: 30px;
}
.marks-viewer .marks-viewer-title .more-icon {
  font-size: 16px;
}
.marks-viewer .mark-chapters {
  min-height: 60vh;
  height: calc(100% - 30px);
  overflow: auto;
}
.marks-viewer .mark-chapter-title {
  margin-bottom: 12px;
}
.marks-viewer .marks-viewer-list {
  margin-right: 16px;
}
</style>
