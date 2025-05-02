<template>
  <book-animation ref="anim" class="read-view book-read-view">
    <control-wrapper class="control-wrapper book-anim-main" ref="control-wrapper"
      v-if="chapter"
      :book-id="+id"
      :chapter-id="+chapter.id"
      :get-next-read-element="getNextReadElement"
      @prev-page="pageHandler('prev')"
      @next-page="pageHandler('next')"
      @scroll-vertical="scrollVertical"
      @jump="jump"
    >
      <template v-slot:chapterList>
        <chapter-list-vue
          :chapter-list="chapterList"
          :cur-chapter-index="curChapterIndex"
          @tap="jumpToChapter"
        ></chapter-list-vue>
      </template>
      <template v-slot="{ settings }">
        <chapter-contents
          v-if="chapterList.length && defaultProgress"
          :data-font="settings.fontFamily"
          :style="{
            fontSize: settings.fontSize + 'px',
            fontWeight: settings.fontWeight,
            lineHeight: settings.lineHeight
          }"
          :chapter-list="chapterList"
          :default-chapter-id="defaultProgress.chapterId"
          :default-cursor="defaultProgress.cursor"
          :load-chapter="loadChapter"
          @load="loadChapter"
          @progress="updateProgress"
          ref="chapter-contents"
        ></chapter-contents>
      </template>
    </control-wrapper>
  </book-animation>
</template>

<script setup lang="ts">
import ControlWrapper from '@/components/ControlWrapper.vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { localBookService as dataService } from '@/services/LocalBookService';
import { showToast } from '@/utils';
import { readingStateStore } from '@/services/storage';
import BookAnimation from '@/components/BookAnimation.vue';
import { onBeforeRouteLeave } from 'vue-router';
import { renderChapter } from '@/utils/chapter';
import ChapterContents from '@/components/ChapterContents.vue';
import ChapterListVue from '@/components/ChapterList.vue';

const props = defineProps<{
  id: string
}>()

const chapterList = ref<IChapterItem[]>([])
const curChapterIndex = ref(0)
const animRef = useTemplateRef('anim')
const controlWrapperRef = useTemplateRef('control-wrapper')
const chapterContentsRef = useTemplateRef('chapter-contents')
const defaultProgress = ref<{ chapterId: string, cursor: number } | null>(null)

const chapter = computed(() => chapterList.value[curChapterIndex.value])

const pageHandler = (direction: 'prev' | 'next') => {
  console.log('pageHandler', direction)
}

const scrollVertical = (distance: number) => {
  chapterContentsRef.value?.scroll(distance)
}

const jumpToChapter = async (chapter: IChapter, index: number) => {
  curChapterIndex.value = index
  chapterContentsRef.value?.jump({ chapterId: chapter.id, cursor: chapter.cursorStart })
  controlWrapperRef.value?.closeDialog()
}
const loadChapter = async (chapter: IChapterItem, chapterIndex: number) => {
  if (chapter.content) return;
  chapter.status = 'loading'
  const text = await dataService.getChapter(props.id as string)
  const content = renderChapter(chapter, text, chapterIndex)
  chapter.content = content
  chapter.status = 'loaded'
  await nextTick()
}
const updateProgress = (progress: { chapter: IChapterItem, cursor: number, chapterIndex: number }) => {
  curChapterIndex.value = progress.chapterIndex

  readingStateStore.update(props.id, {
    chapterId: progress.chapter.id,
    cursor: progress.cursor,
    lastReadTime: Date.now(),
  })
}

const fetchChapterList = async () => {
  const catalog = await dataService.getChapterList(props.id)
  if (!catalog) {
    return showToast(`获取目录失败: ${props.id}`)
  }
  chapterList.value = catalog.map(item => ({
    ...item,
    status: 'default', // default | loading | loaded
    content: '',
  }))
}
const fetchReadProgress = async () => {
  const progress = await readingStateStore.get(props.id)
  if (!progress) return;
  defaultProgress.value = { chapterId: progress.chapterId, cursor: progress.cursor }
}

const jump = async (options: { chapterId: string, cursor: number }) => {
  chapterContentsRef.value?.jump(options)
  controlWrapperRef.value?.closeDialog()
}

const getNextReadElement = (current?: HTMLElement) => {
  return chapterContentsRef.value?.getNextReadElement(current) || null
}

const init = async () => {
  await Promise.all([
    fetchChapterList(),
    fetchReadProgress()
  ])
  if (!defaultProgress.value) {
    const chapter = chapterList.value[0]
    defaultProgress.value = { chapterId: chapter.id, cursor: chapter.cursorStart }
  }
  readingStateStore.update(props.id, { lastReadTime: Date.now() })
}

init()

onBeforeRouteLeave((to, from, next) => {
  animRef.value?.closeBook()
  next()
})
</script>

<style lang="scss" scoped>
.read-view {
  --read-view-content-height: 100vh;
  width: 100vw;
  position: relative;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
}
</style>
