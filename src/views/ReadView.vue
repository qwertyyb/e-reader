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
            '--text-indent': settings.textIndent,
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
            '--text-indent': settings.textIndent,
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
import { readingStateStore, readTimeStore } from '@/services/storage';
import BookAnimation from '@/components/BookAnimation.vue';
import ChapterContents from '@/components/ChapterContents.vue';
import HorizationalChapterContents from '@/components/HorizationalChapterContents.vue';
import ChapterListVue from '@/components/ChapterList.vue';
import { ReadingTime } from '@/actions/reading-time';
import { preferences } from '@/stores/preferences';
import * as wakeLock from '@/utils/wake-lock'
import { onBackFrom, onBackTo, onForwardFrom, onForwardTo } from '@/router/hooks';
import { LAST_READ_BOOK_STORAGE_KEY } from '@/constant';
import Logger from 'js-logger';
import { appRouter } from '@/router';
import { getRemoteProgress, setRemoteProgress } from '@/services/sync';

const logger = Logger.get('ReadView')

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

const updateReadingState = (durationDelta?: number) => {
  if (!progress.value) return
  readingStateStore.update(props.id, {
    chapterId: progress.value.chapter.id,
    cursor: progress.value.cursor,
    duration: progress.value.duration,
    lastReadTime: Date.now(),
  })
  if (durationDelta) {
    readTimeStore.addDuration({
      bookId: props.id,
      date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      duration: durationDelta
    })
  }
}
const updateProgress = (info: { chapter: IChapter, cursor: number, chapterIndex: number }) => {
  curChapterIndex.value = info.chapterIndex
  progress.value = { ...progress.value!, ...info }

  updateReadingState()

  if (syncEnabled(book.value)) {
    const data = {
      ...preferences.value.sync,
      document: book.value!.title,
      progress: JSON.stringify({ chapterId: progress.value.chapter.id, cursor: progress.value.cursor }),
      percentage: progress.value.cursor / book.value!.maxCursor,
    }
    logger.info('同步进度到远端', data)
    setRemoteProgress(data)
  }
}

const fetchBookInfo = async () => {
  const [bookInfo, cl] = await Promise.all([
    dataService.getBook(props.id),
    dataService.getChapterList(props.id)
  ])
  if (!cl) {
    showToast(`获取目录失败: ${props.id}`)
    return { book: bookInfo, chapterList: [] }
  }
  book.value = bookInfo
  chapterList.value = cl
  return { book: bookInfo, chapterList: cl }
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

const syncEnabled = (book?: ILocalBook) => {
  // 进度同步启用的必需配置可用
  const { enabled, server, username, password } = preferences.value.sync
  return enabled && server && username && password && book?.title
}

const getProgress = (
  local: IReadingState | undefined | null,
  remote: { progress: string, timestamp: number, percentage: number } | null,
  { chapterList, book }: { chapterList: IChapter[], book: ILocalBook }
): { type: 'local' | 'remote', progress: IReadingState } | null => {
  logger.info('getProgress', local, remote)
  if (!remote) {
    return local ? {
      type: 'local',
      progress: local
    } : null
  }
  if ((local?.lastReadTime ?? 0) >= remote.timestamp && local?.cursor) {
    return {
      type: 'local',
      progress: local!
    }
  }
  // 远程比较新
  // 首先尝试从 progress 中解析出章节和位置
  try {
    const { chapterId, cursor } = JSON.parse(remote.progress)
    const chapter = chapterList.find(chapter => chapter.id === chapterId)
    if (chapter && chapter.cursorStart <= cursor && ((chapter.cursorEnd && cursor <= chapter.cursorEnd) || !chapter?.cursorEnd)) {
      return {
        type: 'remote',
        progress: {
          bookId: book.id,
          chapterId,
          cursor,
          duration: local?.duration ?? 0,
          lastReadTime: remote.timestamp
        }
      }
    }
  } catch (err) {
    logger.error('解析远程 progress 失败', err, '从 percentage 中计算章节 id 和 cursor')
    const cursor = Math.round(remote.percentage * book.maxCursor)
    const chapter = chapterList.find(chapter => {
      return chapter.cursorStart <= cursor && (chapter.cursorEnd && chapter.cursorEnd >= cursor || !chapter.cursorEnd)
    })
    if (chapter) {
      return {
        type: 'remote',
        progress: {
          bookId: book.id,
          chapterId: chapter.id,
          cursor,
          duration: local?.duration ?? 0,
          lastReadTime: remote.timestamp
        }
      }
    }
  }
  return null
}

const init = async () => {
  const [{ book, chapterList }, readingState] = await Promise.all([
    fetchBookInfo(),
    readingStateStore.get(props.id),
  ])
  let finalReadingState: IReadingState | undefined | null = readingState
  if (syncEnabled(book)) {
    let remotePosition: { progress: string, timestamp: number, percentage: number } | null = null
    try {
      remotePosition = await getRemoteProgress({
        server: preferences.value.sync.server,
        username: preferences.value.sync.username,
        password: preferences.value.sync.password,
        document: book.title
      });
      logger.info('远端进度', remotePosition)
    } catch (err) {
      logger.error('获取远程进度失败', err)
    }

    const result = getProgress(readingState, remotePosition, { chapterList, book })
    logger.info('getProgress result', result)
    finalReadingState = result?.progress
  }
  logger.info('finalReadingState', finalReadingState)
  const chapterIndex = finalReadingState?.chapterId
    ? chapterList.findIndex(chapter => chapter.id === finalReadingState.chapterId) || 0
    : 0

  progress.value = {
    chapter: chapterList[chapterIndex],
    chapterIndex,
    cursor: finalReadingState?.cursor || 0,
    duration: finalReadingState?.duration || 0
  }

  readingStateStore.update(props.id, { lastReadTime: Date.now() })
  readingTime = new ReadingTime((time, delta) => {
    progress.value = { ...progress.value!, duration: (finalReadingState?.duration || 0) + time }
    updateReadingState(delta)
  })
}

const requestWakeLock = () => {
  if (preferences.value.screenKeepAlive === 'reading') {
    wakeLock.request()
  }
}

const releaseWakeLock = () => {
  if (preferences.value.screenKeepAlive === 'reading') {
    wakeLock.release()
  }
}

init().catch((err) => {
  logger.error('获取书籍信息失败', err)
  showToast('获取书籍信息失败')
  appRouter.back()
})
requestWakeLock()

onBeforeUnmount(() => {
  releaseWakeLock()
  readingTime?.destroy()
  localStorage.removeItem(LAST_READ_BOOK_STORAGE_KEY)
})

onForwardTo((to) => {
  if (to.location.query.trace && !to.location.query.noForwardAnim) {
    const cover = document.querySelector<HTMLImageElement>(`img[data-book-cover-trace=${JSON.stringify(to.location.query.trace)}]`)
    cover?.classList.add('is-reading')
    cover?.style.setProperty('opacity', '0')
    animRef.value?.openBook(cover)
  }
  if (to.location.params.id) {
    localStorage.setItem(LAST_READ_BOOK_STORAGE_KEY, JSON.stringify({
      name: 'read',
      params: { id: to.location.params.id },
      query: to.location.query
    }))
  }
})

onBackFrom(async (current) => {
  if (current.location.query.trace) {
    controlWrapperRef.value?.closeDialog()
    let cover = document.querySelector<HTMLImageElement>(`img[data-book-cover-trace=${JSON.stringify(current.location.query.trace)}]`)
    if (cover) {
      cover?.classList.add('is-reading')
      cover.style.setProperty('opacity', '0')
    }
    await animRef.value?.closeBook(() => document.querySelector<HTMLImageElement>(`img[data-book-cover-trace=${JSON.stringify(current.location.query.trace)}]`))
    cover = document.querySelector<HTMLImageElement>(`img[data-book-cover-trace=${JSON.stringify(current.location.query.trace)}]`)
    cover?.classList.remove('is-reading')
    cover?.style.removeProperty('opacity')
  }
  localStorage.removeItem(LAST_READ_BOOK_STORAGE_KEY)
})

onBackTo(() => {
  // 从其它页面 pop 回当前页面时，执行此回调
  requestWakeLock()
  readingTime?.start()
})

onForwardFrom(() => {
  // 从当前页面 push 跳到新的页面时，执行此回调
  releaseWakeLock()
  readingTime?.pause()
})
</script>

<style lang="scss" scoped>
.read-view {
  width: 100vw;
  position: relative;
  background: var(--bg-color);
}
</style>
