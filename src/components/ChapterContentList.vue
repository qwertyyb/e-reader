<template>
  <div class="chapter-content-list" ref="el">
    <virtual-list
      :data-sources="chapterList"
      data-key="id"
      :keeps="5"
      @scroll="scrollHandler"
      class="chapter-content-virutal-list"
      :estimate-size="600"
      :start="start"
    >
      <template v-slot="{ source }">
        <div class="chapter-wrapper" v-html="source.content"></div>
      </template>
    </virtual-list>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue';

const props = defineProps<{
  chapterList: IChapterItem[],
  readingChapterId: string,
  readingCursor: number,
}>()

const emits = defineEmits<{
  load: [IChapterItem, number],
  progress: [{ chapter: IChapterItem, cursor: number }]
}>()

interface IChapterItem extends IChapter {
  status: 'default' | 'loading' | 'loaded',
  content?: string
}

const el = useTemplateRef('el')
const start = ref(0)

const loadDefaultContents = async () => {
  // 如果指定了 ChapterId，则加载 ChapterId 前后的几个章节
  const index = Math.max(0, props.chapterList.findIndex(chapter => chapter.id === props.readingChapterId))
  start.value = index
  console.log('loadDefaultContents', index, props.readingChapterId)
  // 加载当前章节和后两个章节
  props.chapterList.slice(index, index + 3).forEach((chapter, i) => {
    emits('load', chapter, index + i)
  })

  // 也往前加载两个章节
  for (let i = index - 1; i >= Math.max(0, index - 2); i--) {
    emits('load', props.chapterList[i], i)
  }

  if (getCurrentProgress()?.cursor !== props.readingCursor) {
    await nextTick()
    console.log('sddd', el.value?.querySelector(`[data-cursor="${props.readingCursor}"]`))
    el.value?.querySelector(`[data-cursor="${props.readingCursor}"]`)?.scrollIntoView()
  }
}

watch(() => props.readingChapterId, loadDefaultContents)

const checkProgress = () => {
  const { chapter, cursor, chapterIndex } = getCurrentProgress() || {}
  if (!chapter || !cursor || !chapterIndex && chapterIndex !== 0) return;

  emits('progress', { chapter, cursor })
}

const getCurrentProgress = () => {
  // 1. 找到当前的章节
  const chapterEls = el.value?.querySelectorAll<HTMLDivElement>('.chapter') || []
  const chapterEl = Array.from(chapterEls)
    .reverse()
    .find((el) => {
      const { top, left } = el.getBoundingClientRect()
      return top < 0 || left < 0
    }) || chapterEls[0]
  if (!chapterEl) return

  // 2. 找到章节中最靠近上方的段落
  const els = Array.from(chapterEl.querySelectorAll<HTMLDivElement>('[data-cursor]'))
  const screenRect = document.documentElement.getBoundingClientRect()
  let minLeft = Number.MAX_SAFE_INTEGER
  let minTop = Number.MAX_SAFE_INTEGER
  let target: HTMLDivElement | null = null
  els.forEach(el => {
    const rect = el.getBoundingClientRect()
    if (rect.top >= screenRect.top
      && rect.left >= screenRect.left
      && rect.bottom <= screenRect.bottom
      && rect.right <= screenRect.right) {
        // 在屏幕内
        if (rect.left < minLeft || rect.top < minTop) {
          minTop = rect.top
          minLeft = rect.left
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
  checkProgress()
}

loadDefaultContents()

</script>

<style lang="scss" scoped>
.chapter-content-list, .chapter-content-virutal-list {
  height: 100%;
  overflow: auto;
}
.chapter-content-list :deep(.content) {
  box-sizing: border-box;
  margin-left: 12px;
  margin-right: 12px;
  width: calc(100% - 24px);
  line-height: 1.6;
  font-size: 24px;
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
    margin-bottom: max(env(safe-area-inset-bottom), 16em);
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
