<template>
  <div class="horizontal-chapter-contents" ref="el">
    <div class="chapter-contents-wrapper">
    </div>
  </div>
</template>

<script setup lang="ts">
import { renderChapter } from '@/utils/chapter';
import { nextTick, useTemplateRef } from 'vue'

const props = defineProps<{
  chapterList: IChapter[],
  defaultChapterId: string,
  defaultCursor: number,
  loadChapter: (chapter: IChapter, chapterIndex: number) => Promise<string>
}>()

const emits = defineEmits<{
  progress: [{ chapter: IChapter, cursor: number, chapterIndex: number }]
}>()

const el = useTemplateRef('el')
const keeps = 5

console.log(props, emits, keeps, )

const loadContents = async (chapterId: string) => {
  const chapterIndex = props.chapterList.findIndex(chapter => chapter.id === chapterId)
  const chapter = props.chapterList[chapterIndex]
  const text = await props.loadChapter(chapter, chapterIndex)
  const html = renderChapter(chapter, text, chapterIndex)
  el.value?.querySelector('.chapter-contents-wrapper')?.replaceChildren(html)
}

const scrollToCursor = async (cursor: number) => {
  await nextTick()
  const target = el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`)
  if (!target) return
  // 此处不能使用 scrollIntoView ，因为段落可能跨两列，scrollIntoView 会导致落点不正确
  // const rects = target.getClientRects()
  // const rect = rects.item(0)
  // if (!rect) return;
  // 计算这个矩形落在哪一页
  const distance = Math.round(target.offsetLeft / (window.innerWidth)) * (window.innerWidth - 12)
  el.value?.querySelector<HTMLElement>(`.chapter-contents-wrapper`)?.scrollTo({ left: distance })
  console.log('scrollToCursor', el.value?.querySelector('.chapter-contents-wrapper')?.scrollLeft)
}

const init = async () => {
  await loadContents(props.defaultChapterId)
  scrollToCursor(props.defaultCursor)
}

init()

</script>

<style lang="scss" scoped>
.horizontal-chapter-contents {
  display: flex;
  align-items: center;
  width: 100%;
  user-select: none;
}
.chapter-contents-wrapper {
  column-width: 100vw;
  width: 100vw;
  padding: 12px;
  column-gap: 12px;
  height: 100vh;
  background-image: url("../assets/text-bg.png");
  background-size: cover;
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
  overflow-x: auto;
  position: relative;
}
.horizontal-chapter-contents :deep(.chapter-contents-wrapper) {
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

  h3.chapter-title {
    font-size: 1.2em;
  }
  p.reading {
    color: light-dark(blue, rgb(94, 94, 255))
  }
}
</style>
