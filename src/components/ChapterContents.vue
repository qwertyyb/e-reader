<template>
  <div class="chapter-contents" ref="el">
    <div class="chapter-contents-wrapper" @scroll="scrollHandler" @touchstart="pointerDownHandler" @touchend="pointerUpHandler"></div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from '@/utils';
import { renderChapter } from '@/utils/chapter';
import { getSafeAreaTop } from '@/utils/env';
import { nextTick, useTemplateRef } from 'vue';

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

let touching = false
const pointerDownHandler = () => {
  touching = true
}
const pointerUpHandler = () => {
  touching = false
  updateProgress()
}

const renderChapterContents = (contents: HTMLElement[]) => {
  // vue 的渲染不太可控，自行渲染
  if (!el.value) {
    console.warn('dom未挂载')
    return;
  }
  const wrapper = el.value.querySelector('.chapter-contents-wrapper')!
  if (!wrapper.childElementCount) {
    // 如果是空的，直接插入进去就行，不需要考虑其他
    wrapper.replaceChildren(...contents)
    return
  }
  // 如果非空，需要考虑替换 DOM 时，要保持可视区域不变
  // 主要要考虑在可视区域之前的 DOM 替换
  // 1. 需要先定位到目前在可视区域的章节
  const progress = getCurrentProgress()
  if (!progress) {
    throw new Error('获取当前进度失败')
  }

  // 2. 获取当前章节的位置
  const chapterEl = el.value.querySelector<HTMLDivElement>(`.chapter[data-id="${progress.chapter.id}"]`)
  if (!chapterEl) {
    throw new Error('获取当前章节 DOM 失败')
  }
  const { top: oldTop } = chapterEl.getBoundingClientRect()

  // 3. 更新章节
  wrapper.replaceChildren(...contents)

  // 4. 获取新的章节位置
  const newChapterEl = el.value.querySelector<HTMLDivElement>(`.chapter[data-id="${progress.chapter.id}"]`)
  if (!newChapterEl) return;
  const { top: newTop } = newChapterEl.getBoundingClientRect()

  // 5. 计算需要滚动的位置并滚动
  const distance = newTop - oldTop
  wrapper.scrollTop += distance
}

let lastLoadChapterId: string | null = null
const loadContents = async (chapterId: string) => {
  if (chapterId === lastLoadChapterId) return;
  lastLoadChapterId = chapterId
  // 如果指定了 ChapterId，则加载 ChapterId 前后的几个章节
  const targetIndex = Math.max(0, props.chapterList.findIndex(chapter => chapter.id === chapterId))
  const startIndex = Math.max(0, targetIndex - Math.floor(keeps / 2))
  const contents: HTMLElement[] = []
  for (let i = startIndex; i < startIndex + keeps; i += 1) {
    const chapterEl = el.value?.querySelector<HTMLDivElement>(`.chapter[data-chapter-index="${i}"]`)
    if (chapterEl) {
      contents.push(chapterEl)
    } else {
      const chapter = props.chapterList[i]
      const text = await props.loadChapter(chapter, i)
      const html = renderChapter(chapter, text, i)
      contents.push(html)
    }
  }

  // 如果手指未离开屏幕，则不执行更新
  if (touching) return;

  renderChapterContents(contents.filter(Boolean) as HTMLElement[])
}

const scrollToCursor = async (cursor: number) => {
  await nextTick()
  el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`)?.scrollIntoView()
  el.value?.querySelector('.chapter-contents-wrapper')?.scrollBy(0, -getSafeAreaTop())
}

const updateProgress = () => {
  const progress = getCurrentProgress()
  if (!progress) return;
  loadContents(progress.chapter.id);

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
      const { top } = el.getBoundingClientRect()
      return Math.round(top) < Math.round(visibleRect.top)
    }) || chapterEls[0]
  if (!chapterEl) return

  // 2. 找到章节中最靠近上方的段落
  const els = Array.from(chapterEl.querySelectorAll<HTMLDivElement>('[data-cursor]'))
  const target: HTMLDivElement | null = els.find(el => {
    const { top } = el.getBoundingClientRect()
    return top > visibleRect.top
  }) || els[els.length - 1]
  if (!target) return;
  return {
    chapterIndex: Number(chapterEl.dataset.chapterIndex),
    chapter: props.chapterList[Number(chapterEl.dataset.chapterIndex)],
    cursor: Number((target as HTMLElement | null)?.dataset.cursor)
  }
}

// 经测试，发现 safari 在正在滚动时，无法接受滚动位置的突变，即修改 scrollTop 时，会出现非预期行为
// 所以此处需要等待滚动结束后再更新内容区域，具体实现为防抖(safari 目前暂不支持 scrollend 事件)
const scrollHandler = debounce(updateProgress)

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
  scroll: (() => {
    let totalDistance = 0;
    return (distance: number) => {
      const wrapper = el.value?.querySelector('.chapter-contents-wrapper')
      if (!wrapper) return;
      // 某些浏览器(如safari)上不支持小于 1 的滚动量，这里积累一下，每次滚动整数量
      totalDistance += distance
      const scrollDistance = Math.floor(totalDistance)
      totalDistance = totalDistance - scrollDistance
      if (scrollDistance <= 0) return;
      wrapper.scrollTo({ top: wrapper.scrollTop + scrollDistance })
    }
  })(),
  getNextReadElement(current?: HTMLElement) {
    if (!current) {
      const progress = getCurrentProgress()
      return el.value?.querySelector<HTMLElement>(`[data-cursor="${progress?.cursor}"]`)
    }
    const cursor = Number(current.dataset.cursor)
    // 找到下一个非空节点
    let nextCursor = cursor + 1
    let nextEl = el.value?.querySelector<HTMLElement>(`[data-cursor="${nextCursor}"]`)
    while(nextEl && !nextEl.textContent?.trim()) {
      nextCursor += 1
      nextEl = el.value?.querySelector<HTMLElement>(`[data-cursor="${nextCursor}"]`)
    }
    return nextEl
  }
})
</script>

<style lang="scss" scoped>
.chapter-contents, .chapter-contents-wrapper {
  height: 100%;
  overflow: auto;
  position: relative;
}
.chapter-contents-wrapper {
  height: 100%;
  z-index: 0;
  background-clip: border-box;
  overflow: auto;
  position: relative;
  background-image: url("../assets/text-bg.png");
  background-size: contain;
  background-attachment: local;
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
  padding-left: 12px;
  padding-right: 12px;
  padding-top: var(--sait);
  padding-bottom: var(--saib);
  line-height: inherit;
  font-size: inherit;
  user-select: text;
  -webkit-user-select: text;
}
:global(html.dark-mode .chapter-contents-wrapper) {
  background-image: none;
}
.chapter-contents :deep(.chapter-contents-wrapper) {
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
