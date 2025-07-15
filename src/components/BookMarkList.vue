<template>
  <ul class="book-mark-list"  v-loading="loading">
    <li class="chapter-mark-list" v-for="chapter in chapterMarkList" :key="chapter.chapterId">
      <h4 class="mark-chapter-title">{{ chapter.title }}</h4>
      <mark-list :mark-list="chapter.markList" @remove="removeMark" @tap="$emit('mark-tap', $event)" class="mark-list"></mark-list>
    </li>
    <li class="empty-tips" v-if="!loading && !chapterMarkList.length">暂无笔记，快标注你的第一条笔记吧</li>
  </ul>
</template>

<script setup lang="ts">
import MarkList from "@/components/MarkList.vue"
import { localBookService } from "@/services/LocalBookService";
import { marks } from "@/services/storage";
import { showToast } from "@/utils";
import { getBookMarkList } from "@/utils/mark";
import { ref } from "vue"

const props = defineProps<{
  bookId: number,
}>()

const emits = defineEmits<{
  'mark-removed': [IMarkEntity],
  'mark-tap': [IMarkEntity]
}>()

const loading = ref(false)

const chapterMarkList = ref<{ chapterId: string, title: string, markList: IMarkEntity[] }[]>([])

const refresh = async () => {
  loading.value = true
  const [markList, chapterList] = await Promise.all([
    marks.getListByBook(props.bookId),
    localBookService.getChapterList(String(props.bookId)),
  ])
  loading.value = false

  chapterMarkList.value = getBookMarkList(markList, chapterList)
}

const removeMark = async (mark: IMarkEntity) => {
  await marks.remove(mark.id)
  showToast('已删除')
  refresh()
  emits('mark-removed', mark)
}

refresh()
</script>

<style lang="scss" scoped>
.book-mark-list {
  box-sizing: border-box;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.chapter-mark-list {
  margin-bottom: 16px;
}
.mark-chapter-title {
  margin-bottom: 12px;
}
.empty-tips {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 160px 0 0 0;
}
</style>
