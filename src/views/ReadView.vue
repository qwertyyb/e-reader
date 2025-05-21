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
      <template v-slot="{ settings }" v-if="chapterList.length && defaultProgress">
          <horizational-chapter-contents
            v-if="settings.turnPageType === 'horizontal-scroll'"
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
            @progress="updateProgress"
            ref="chapter-contents"
          ></horizational-chapter-contents>
          <chapter-contents
            v-else
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
            @progress="updateProgress"
            ref="chapter-contents"
          ></chapter-contents>
      </template>
    </control-wrapper>
    <book-toc-settings-dialog :visible="dialog==='tocSettings'" @close="dialog=null" :book-id="id"></book-toc-settings-dialog>
  </book-animation>
</template>

<script setup lang="ts">
import ControlWrapper from '@/components/ControlWrapper.vue';
import { computed, provide, ref, useTemplateRef } from 'vue';
import { localBookService as dataService } from '@/services/LocalBookService';
import { showToast } from '@/utils';
import { readingStateStore } from '@/services/storage';
import BookAnimation from '@/components/BookAnimation.vue';
import { onBeforeRouteLeave } from 'vue-router';
import ChapterContents from '@/components/ChapterContents.vue';
import HorizationalChapterContents from '@/components/HorizationalChapterContents.vue';
import ChapterListVue from '@/components/ChapterList.vue';
import BookTocSettingsDialog from '@/components/BookTocSettingsDialog.vue';

const props = defineProps<{
  id: string
}>()

const chapterList = ref<IChapter[]>([])
const curChapterIndex = ref(0)
const animRef = useTemplateRef('anim')
const controlWrapperRef = useTemplateRef('control-wrapper')
const chapterContentsRef = useTemplateRef<InstanceType<typeof ChapterContents> | InstanceType<typeof HorizationalChapterContents>>('chapter-contents')
const defaultProgress = ref<{ chapterId: string, cursor: number } | null>(null)
const dialog = ref<string | null>(null)

const chapter = computed(() => chapterList.value[curChapterIndex.value])
const progress = ref<{ chapter: IChapter, chapterIndex: number, cursor: number } | null>(null)
const book = ref<ILocalBook>()

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
const updateProgress = (info: { chapter: IChapter, cursor: number, chapterIndex: number }) => {
  curChapterIndex.value = info.chapterIndex
  progress.value = { ...info }
  // 默认状态也更新一下，这样在切换横竖滚动的时候，进度才不会丢失
  defaultProgress.value = { chapterId: info.chapter.id, cursor: info.cursor }

  readingStateStore.update(props.id, {
    chapterId: info.chapter.id,
    cursor: info.cursor,
    lastReadTime: Date.now(),
  })
}

const fetchChapterList = async () => {
  const [bookInfo, toc] = await Promise.all([
    dataService.getBook(props.id),
    dataService.getChapterList(props.id)
  ])
  if (!toc) {
    return showToast(`获取目录失败: ${props.id}`)
  }
  book.value = bookInfo
  chapterList.value = toc
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

const openTocSettings = () => {
  controlWrapperRef.value?.closeDialog()
  dialog.value = 'tocSettings'
}

const openSearchDialog = () => {
  controlWrapperRef.value?.openDialog('search')
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
  controlWrapperRef.value?.closeDialog()
  animRef.value?.closeBook()
  next()
})
</script>

<style lang="scss" scoped>
.read-view {
  width: 100vw;
  position: relative;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
}
</style>
