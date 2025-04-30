<template>
  <div class="chapter-content-list" ref="el">
    <virtual-list
      :data-sources="chapterList"
      data-key="id"
      :keeps="5"
      @scroll="scrollHandler"
      class="chapter-content-virutal-list"
      :estimate-size="600"
      :start="startChapterIndex"
      ref="virtual-list"
    >
      <template v-slot="{ source }">
        <div class="chapter-wrapper" v-html="source.content" :chapter-id="source.id"></div>
      </template>
    </virtual-list>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue';

const props = defineProps<{
  chapterList: IChapterItem[],
  defaultChapterId: string,
  defaultCursor: number,
  loadChapter: (chapter: IChapterItem, chapterIndex: number) => Promise<void>
}>()

const emits = defineEmits<{
  load: [IChapterItem, number],
  progress: [{ chapter: IChapterItem, cursor: number, chapterIndex: number }]
}>()

interface IChapterItem extends IChapter {
  status: 'default' | 'loading' | 'loaded',
  content?: string
}

const el = useTemplateRef('el')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const virtualListRef = useTemplateRef<any>('virtual-list')
const startChapterIndex = ref(0)

const loadContents = (chapterId: string) => {
  // 如果指定了 ChapterId，则加载 ChapterId 前后的几个章节
  const targetIndex = Math.max(0, props.chapterList.findIndex(chapter => chapter.id === chapterId))
  const startIndex = Math.max(0, targetIndex - 2)
  startChapterIndex.value = startIndex
  console.log('loadDefaultContents', startChapterIndex)
  return Promise.all(
    props.chapterList.slice(startIndex, startIndex + 5).map((chapter, i) => props.loadChapter(chapter, startIndex + i))
  )
}

const scrollToCursor = async (cursor: number) => {
  await nextTick()
  const p = el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`)
  if (!p) return;
  // const visibleRect = el.value
  virtualListRef.value?.scrollToOffset(p.offsetTop + virtualListRef.value!.getOffset() - 16)
}

const updateProgress = () => {
  const { chapter, cursor, chapterIndex } = getCurrentProgress() || {}
  console.log(chapter, cursor)
  if (!chapter || !cursor || !chapterIndex && chapterIndex !== 0) return;

  console.log('checkProgress', cursor)
  emits('progress', { chapter, cursor, chapterIndex })
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
  }
})
</script>

<style lang="scss" scoped>
.chapter-content-list, .chapter-content-virutal-list {
  height: 100%;
  overflow: auto;
}
.chapter-content-list :deep(.chapter-wrapper) {
  box-sizing: border-box;
  margin-left: 12px;
  margin-right: 12px;
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
    padding-bottom: max(env(safe-area-inset-bottom), 16em);
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
    padding-top: env(safe-area-inset-top);
  }
  p.reading {
    background: yellow;
  }
}
</style>
