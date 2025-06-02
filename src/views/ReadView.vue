<template>
  <book-animation ref="anim" class="read-view book-read-view">
    <control-wrapper class="control-wrapper book-anim-main" ref="control-wrapper"
      v-if="chapter"
      :book-id="+id"
      :chapter-id="chapter.id"
      :title="chapter?.title"
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
          enable-settings
          enable-search
          @settings="openTocSettings"
          @search="openSearchDialog"
          @tap="jumpToChapter"
        ></chapter-list-vue>
      </template>
      <template v-slot="{ settings }" v-if="chapterList.length && progress">
        <horizational-chapter-contents
          v-if="settings.turnPageType === 'horizontal-scroll'"
          :data-font="settings.fontFamily"
          :style="{
            fontSize: settings.fontSize + 'px',
            fontWeight: settings.fontWeight,
            lineHeight: settings.lineHeight,
            '--read-text-color': settings.colorScheme?.textColor,
            '--read-bg-color': settings.colorScheme?.backgroundColor,
            '--read-bg-image': settings.colorScheme ? 'none' : undefined
          }"
          :chapter-list="chapterList"
          :default-chapter-id="progress.chapter.id"
          :default-cursor="progress.cursor"
          :load-chapter="loadChapter"
          @progress="updateProgress"
          ref="chapter-contents"
        ></horizational-chapter-contents>
        <chapter-contents
          v-else
          :data-font="settings.fontFamily"
          :style="{
            fontSize: settings.fontSize + 'px',
            fontWeight: settings.fontWeight,
            lineHeight: settings.lineHeight,
            '--read-text-color': settings.colorScheme?.textColor,
            '--read-bg-color': settings.colorScheme?.backgroundColor,
            '--read-bg-image': settings.colorScheme ? 'none' : undefined
          }"
          :chapter-list="chapterList"
          :default-chapter-id="progress.chapter.id"
          :default-cursor="progress.cursor"
          :load-chapter="loadChapter"
          @progress="updateProgress"
          ref="chapter-contents"
        ></chapter-contents>
      </template>
    </control-wrapper>
  </book-animation>
</template>

<script setup lang="ts">
import ControlWrapper from '@/components/ControlWrapper.vue';
import { computed, onBeforeUnmount, provide, ref, useTemplateRef } from 'vue';
import { localBookService as dataService } from '@/services/LocalBookService';
import { showToast } from '@/utils';
import { readingStateStore } from '@/services/storage';
import BookAnimation from '@/components/BookAnimation.vue';
import { onBeforeRouteLeave } from 'vue-router';
import ChapterContents from '@/components/ChapterContents.vue';
import HorizationalChapterContents from '@/components/HorizationalChapterContents.vue';
import ChapterListVue from '@/components/ChapterList.vue';
import { ReadingTime } from '@/actions/reading-time';

const props = defineProps<{
  id: string
}>()

const chapterList = ref<IChapter[]>([])
const curChapterIndex = ref(0)
const animRef = useTemplateRef('anim')
const controlWrapperRef = useTemplateRef('control-wrapper')
const chapterContentsRef = useTemplateRef<InstanceType<typeof ChapterContents> | InstanceType<typeof HorizationalChapterContents>>('chapter-contents')

const chapter = computed(() => chapterList.value[curChapterIndex.value])
const progress = ref<{ chapter: IChapter, chapterIndex: number, cursor: number, duration: number } | null>(null)
const book = ref<ILocalBook>()

let readingTime: ReadingTime | null = null

provide('chapter', chapter)
provide('progress', progress)
provide('book', book)
provide('chapterList', chapterList)

const pageHandler = (direction: 'prev' | 'next') => {
  if (!chapterContentsRef.value) return;
  if (direction === 'prev') {
    if ('prevPage' in chapterContentsRef.value) {
      chapterContentsRef.value?.prevPage()
    }
  } else {
    if ('nextPage' in chapterContentsRef.value) {
      chapterContentsRef.value?.nextPage()
    }
  }
}

const scrollVertical = (distance: number) => {
  chapterContentsRef.value?.scroll(distance)
}

const jumpToChapter = async (chapter: IChapter, index: number) => {
  curChapterIndex.value = index
  chapterContentsRef.value?.jump({ chapterId: chapter.id, cursor: chapter.cursorStart })
  controlWrapperRef.value?.closeDialog()
}

const chapterLoadState = new WeakMap<IChapter, Promise<string>>()
const loadChapter = async (chapter: IChapter) => {
  // 如果正在加载或已加载完毕，直接返回之前的结果
  if (!chapterLoadState.get(chapter)) {
    chapterLoadState.set(chapter, dataService.getChapterContent(props.id as string, chapter))
  }
  return chapterLoadState.get(chapter)!
}

const updateReadingState = () => {
  if (!progress.value) return
  return readingStateStore.update(props.id, {
    chapterId: progress.value.chapter.id,
    cursor: progress.value.cursor,
    duration: progress.value.duration,
    lastReadTime: Date.now(),
  })
}
const updateProgress = (info: { chapter: IChapter, cursor: number, chapterIndex: number }) => {
  curChapterIndex.value = info.chapterIndex
  progress.value = { ...progress.value!, ...info }

  updateReadingState()
}

const fetchChapterList = async () => {
  const [bookInfo, toc] = await Promise.all([
    dataService.getBook(props.id),
    dataService.getChapterList(props.id)
  ])
  if (!toc) {
    showToast(`获取目录失败: ${props.id}`)
    return []
  }
  book.value = bookInfo
  chapterList.value = toc
  return toc
}

const jump = async (options: { chapterId: string, cursor: number }) => {
  chapterContentsRef.value?.jump(options)
  controlWrapperRef.value?.closeDialog()
}

const getNextReadElement = (current?: HTMLElement) => {
  return chapterContentsRef.value?.getNextReadElement(current) || null
}

const openTocSettings = () => {
  controlWrapperRef.value?.openDialog('tocSettings')
}

const openSearchDialog = () => {
  controlWrapperRef.value?.openDialog('search')
}

const init = async () => {
  const [chapterList, readingState] = await Promise.all([
    fetchChapterList(),
    readingStateStore.get(props.id)
  ])
  const chapterIndex = readingState?.chapterId
    ? chapterList.findIndex(chapter => chapter.id === readingState.chapterId) || 0
    : 0

  progress.value = {
    chapter: chapterList[chapterIndex],
    chapterIndex,
    cursor: readingState?.cursor || 0,
    duration: readingState?.duration || 0
  }

  readingStateStore.update(props.id, { lastReadTime: Date.now() })
  readingTime = new ReadingTime(readingState?.duration || 0, time => {
    progress.value = { ...progress.value!, duration: time }
    updateReadingState()
  })
}

init()

onBeforeUnmount(() => {
  readingTime?.destroy()
})

onBeforeRouteLeave((to, from, next) => {
  controlWrapperRef.value?.closeDialog()
  animRef.value?.closeBook()
  next()
})
</script>

<style lang="scss" scoped>
.read-view {
  width: 100vw;
  position: relative;
  background: var(--bg-color);
}
</style>
