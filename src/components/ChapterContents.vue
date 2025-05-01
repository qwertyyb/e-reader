<template>
  <div class="chapter-contents" ref="el">
    <div class="chapter-contents-wrapper" @scroll="scrollHandler"></div>
    <!-- <div class="chapter-wrapper"></div> -->
  </div>
</template>

<script setup lang="ts">
import { getSafeAreaTop } from '@/utils/env';
import { nextTick, ref, useTemplateRef, watch } from 'vue';

const props = defineProps<{
  chapterList: IChapterItem[],
  defaultChapterId: string,
  defaultCursor: number,
  loadChapter: (chapter: IChapterItem, chapterIndex: number) => Promise<void>
}>()

const emits = defineEmits<{
  progress: [{ chapter: IChapterItem, cursor: number, chapterIndex: number }]
}>()

const el = useTemplateRef('el')

const startChapterIndex = ref(-1)
const keeps = 5

const renderChapterList = () => {
  // vue 的渲染不太可控，自行渲染
  if (!el.value) {
    console.warn('dom未挂载')
    return;
  }
  const wrapper = el.value.querySelector('.chapter-contents-wrapper')!
  if (!wrapper.childElementCount) {
    // 如果是空的，直接插入进去就行，不需要考虑其他
    wrapper.innerHTML = props.chapterList
      .slice(startChapterIndex.value, startChapterIndex.value + keeps)
      .map(item => item.content)
      .join('\n')
    return
  }
  // 如果非空，需要考虑替换 DOM 时，要保持可视区域不变
  // 主要要考虑在可视区域之前的 DOM 替换
  // 1. 需要先定位到目前在可视区域的章节
  const progress = getCurrentProgress()
  if (!progress) {
    throw new Error('获取当前进度失败')
  }

  // 2. 获取章节在容器内的相对位置和容器的滚动跨度
  const chapterEl = el.value.querySelector<HTMLDivElement>(`.chapter[data-id="${progress.chapter.id}"]`)
  if (!chapterEl) {
    throw new Error('获取当前章节 DOM 失败')
  }
  // const top = chapterEl.offsetTop
  // const scrollTop = el.value.scrollTop
  const { top: oldTop } = chapterEl.getBoundingClientRect()
  wrapper.innerHTML = props.chapterList
    .slice(startChapterIndex.value, startChapterIndex.value + keeps)
    .map(item => item.content)
    .join('\n')
  const newChapterEl = el.value.querySelector<HTMLDivElement>(`.chapter[data-id="${progress.chapter.id}"]`)
  if (!newChapterEl) return;
  const { top: newTop } = newChapterEl.getBoundingClientRect()
  const distance = newTop - oldTop
  wrapper.scrollTop += distance
}

watch(startChapterIndex, renderChapterList)

const loadContents = async (chapterId: string) => {
  // 如果指定了 ChapterId，则加载 ChapterId 前后的几个章节
  const targetIndex = Math.max(0, props.chapterList.findIndex(chapter => chapter.id === chapterId))
  const startIndex = Math.max(0, targetIndex - 2)
  await Promise.all(
    props.chapterList.slice(startIndex, startIndex + 5).map((chapter, i) => props.loadChapter(chapter, startIndex + i))
  )
  startChapterIndex.value = startIndex
}

const scrollToCursor = async (cursor: number) => {
  await nextTick()
  el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`)?.scrollIntoView()
  console.log(el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`))
  el.value?.querySelector('.chapter-contents-wrapper')?.scrollBy(0, -getSafeAreaTop())
}

const updateProgress = () => {
  const progress = getCurrentProgress()
  if (!progress) return;

  emits('progress', progress)
}

const getCurrentProgress = () => {
  if (!el.value) return;
  // 1. 找到当前的章节
  const visibleRect = el.value.getBoundingClientRect()
  const chapterEls = el.value.querySelectorAll<HTMLDivElement>('.chapter') || []
  const chapterEl = Array.from(chapterEls)
    .reverse()
    .find((el) => {
      const { top, left } = el.getBoundingClientRect()
      return Math.round(top) < Math.round(visibleRect.top) || Math.round(left) < Math.round(visibleRect.left)
    }) || chapterEls[0]
  if (!chapterEl) return

  // 2. 找到章节中最靠近上方的段落
  const els = Array.from(chapterEl.querySelectorAll<HTMLDivElement>('[data-cursor]'))
  let minLeft = Number.MAX_SAFE_INTEGER
  let minTop = Number.MAX_SAFE_INTEGER
  let target: HTMLDivElement | null = null
  els.forEach(el => {
    const rect = el.getBoundingClientRect()
    if (Math.round(rect.top) >= Math.round(visibleRect.top)
      && Math.round(rect.left) >= Math.round(visibleRect.left)
      && Math.round(rect.bottom) <= Math.round(visibleRect.bottom)
      && Math.round(rect.right) <= Math.round(visibleRect.right)) {
        // 在屏幕内
        if (Math.round(rect.left) < minLeft || Math.round(rect.top) < minTop) {
          minTop = Math.round(rect.top)
          minLeft = Math.round(rect.left)
          target = el
        }
      }
  })
  return {
    chapterIndex: Number(chapterEl.dataset.chapterIndex),
    chapter: props.chapterList[Number(chapterEl.dataset.chapterIndex)],
    cursor: Number((target as HTMLDListElement | null)?.dataset.cursor)
  }
}

const scrollHandler = () => {
  updateProgress()
}

const init = async () => {
  await loadContents(props.defaultChapterId)
  scrollToCursor(props.defaultCursor)
}

init()

defineExpose({
  async jump(options: { chapterId: string, cursor: number }) {
    await loadContents(options.chapterId)
    scrollToCursor(options.cursor)
  },
  scroll(distance: number) {
    if (!el.value) return;
    el.value.scrollTop += distance
  }
})
</script>

<style lang="scss" scoped>
.chapter-contents, .chapter-contents-wrapper {
  height: 100%;
  overflow: auto;
  position: relative;
}
.chapter-contents :deep(.chapter-contents-wrapper) {
  box-sizing: border-box;
  margin-left: 12px;
  margin-right: 12px;
  padding-top: var(--sait);
  padding-bottom: var(saib);
  width: calc(100% - 24px);
  line-height: 1.6;
  font-size: inherit;
  user-select: text;
  -webkit-user-select: text;
  &.column {
    margin-top: 20px;
    margin-bottom: 20px;
    column-gap: 0;
    column-width: calc(100vw - 40px);
    overflow: hidden;
    height: calc(100% - 40px);
  }
  .placeholder {
    width: 100%;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chapter {
    padding-bottom: max(var(--saib), 16em);
  }
  p {
    text-indent: 2em;
    word-break: break-all;
    /* content-visibility: auto; */
  }
  p + p {
    margin-top: 0.8em;
  }

  h4.chapter-title {
    padding-top: var(--sait);
  }
  p.reading {
    background: yellow;
  }
}
</style>
