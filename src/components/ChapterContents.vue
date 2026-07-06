<template>
  <div class="chapter-contents" ref="el">
    <div class="chapter-contents-wrapper"></div>
  </div>
</template>

<script setup lang="ts">
import BScroll from '@better-scroll/core';
import MouseWheel from '@better-scroll/mouse-wheel'
import { settings } from '@/stores/settings';
import { showToast, throttle } from '@/utils';
import { renderChapter } from '@/utils/chapter';
import { disableAnim, getSafeAreaTop } from '@/utils/env';
import Logger from 'js-logger';
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

BScroll.use(MouseWheel)

const logger = Logger.get('ChapterContents')

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

let updateAbortController: AbortController | null = null

const renderChapterContents = (contents: HTMLElement[]) => {
  // vue 的渲染不太可控，自行渲染
  if (!el.value) {
    console.warn('dom未挂载')
    return;
  }
  const wrapper = el.value.querySelector<HTMLElement>('.chapter-contents-wrapper')!
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
  bscroll?.stop()
  wrapper.replaceChildren(...contents)
  bscroll?.refresh()

  // 4. 获取新的章节位置
  const newChapterEl = el.value.querySelector<HTMLDivElement>(`.chapter[data-id="${progress.chapter.id}"]`)
  if (!newChapterEl) return;
  const { top: newTop } = newChapterEl.getBoundingClientRect()
  // 这里 scrollBy 与 Element.scrollBy 的参数相反，所以需要用 oldTop - newTop
  bscroll?.scrollBy(0, oldTop - newTop, 0)
}

const loadContents = async (chapterId: string, options?: { signal: AbortSignal }) => {
  lastLoadChapterId = chapterId
  // 如果指定了 ChapterId，则加载 ChapterId 前后的几个章节
  const targetIndex = Math.max(0, props.chapterList.findIndex(chapter => chapter.id === chapterId))
  const startIndex = Math.max(0, targetIndex - Math.floor(keeps / 2))
  const contents: HTMLElement[] = []
  for (let i = startIndex; i < Math.min(startIndex + keeps, props.chapterList.length); i += 1) {
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

  // 如果已取消，就不再渲染了
  if (options?.signal.aborted || bscroll?.pending) {
    throw new Error('render cancelled')
  }

  renderChapterContents(contents.filter(Boolean) as HTMLElement[])
}

let lastLoadChapterId: string | null = null
const loadContentsWithSignal = (chapterId: string) => {
  // 当前的 chapterId 和即将要加载的 chapterId 一致，则无须加载
  if (chapterId === lastLoadChapterId) return;

  updateAbortController?.abort()
  updateAbortController = new AbortController()
  return loadContents(chapterId, { signal: updateAbortController.signal })
    .then((res) => {
      lastLoadChapterId = chapterId
      bscroll?.refresh()
      return res
    })
    .catch(err => {
      lastLoadChapterId = null
      throw err
    })
}

const scrollToCursor = async (cursor: number) => {
  await nextTick()
  const targetEl = el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`)
  if (!targetEl) return;
  bscroll?.scrollToElement(targetEl, 0, 0, -getSafeAreaTop()-5)
  console.log('scrollToCursor')
}

const updateProgress = (options: { loadContents: boolean}) => {
  const progress = getCurrentProgress()
  if (!progress) return;
  if (options.loadContents) {
    loadContentsWithSignal(progress.chapter.id)
  }

  emits('progress', progress)
}

const getCurrentProgress = () => {
  if (!el.value) return;
  // 1. 找到当前的章节
  const expectWidth = window.innerWidth
  const visibleRect = el.value.getBoundingClientRect()
  const scale = visibleRect.width / expectWidth

  // 这条线压着的段落或者位于这条线下方的第一个段落就是当前的进度，这条线可称之为进度线
  const visibleTop = Math.round(visibleRect.top + getSafeAreaTop() * scale)

  // 为了提高查找效率，先按章节计算位置查找到段落所在的章节
  const chapterEls = el.value.querySelectorAll<HTMLDivElement>('.chapter') || []
  const chapterEl = Array.from(chapterEls)
    .findLast((el) => {
      const { top } = el.getBoundingClientRect()
      // 两种情况
      // 1. 如果章节在进度线下方不远(不足 10px)，考虑到两个章节之间会有比较大的空间，可以认为上一章节已读完，所以进度落在下一个章节上
      // 2. 从下往上，找到第一个满足章节的起始位置在进度线之上的段落，则这个段落就是正在阅读的段落
      return top - visibleTop < 10 || Math.round(top) < visibleTop
    }) || chapterEls[0]
  if (!chapterEl) return

  // 2. 找到章节中最靠近上方进度线的段落
  const els = Array.from(chapterEl.querySelectorAll<HTMLDivElement>('[data-cursor]'))
  const target: HTMLDivElement | null = els.find(el => {
    const { top, bottom } = el.getBoundingClientRect()
    // 还是两种情况
    // 1. 进度线刚好压着某个段落
    // 2. 进度线未压着段落，找到第一个在进度线之下的段落(即top >= visibleTop)
    return (top <= visibleTop && bottom >= visibleTop) || top >= visibleTop
    // 如果都没有条件能满足，则可以认为进度线刚好落在了章节间的区域，则取本章节的最后一个段落作为进度
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
const updateContents = throttle(() => { updateProgress({ loadContents: true }) }, 500)

// 更新进度需要节流，不能防抖，否则在自动播放时，不会更新进度
const emitProgress = throttle(() => updateProgress({ loadContents: false }), 1000)


const scrollHandler = () => {
  logger.info('scrollHandler', bscroll?.y)
  emitProgress()
  updateContents()
}

const jump = async (options: { chapterId: string, cursor: number }) => {
  await loadContentsWithSignal(options.chapterId)
  bscroll?.refresh()
  scrollToCursor(options.cursor)
}

watch(() => ({ fontSize: settings.value.fontSize, lineHeight: settings.value.lineHeight }), async (val) => {
  logger.info('fontSize or lineHeight changed', val)
  const curProgress = getCurrentProgress()
  if (!curProgress) return;
  await nextTick()
  jump({ chapterId: curProgress.chapter.id, cursor: curProgress.cursor })
})

const init = async () => {
  await Promise.all([
    loadContentsWithSignal(props.defaultChapterId),
    new Promise<void>(resolve => {
      document.fonts.load(`${settings.value.fontWeight} ${settings.value.fontSize}px "${settings.value.fontFamily}"`)
        .then(() => resolve())
        .catch((err) => {
          resolve()
          throw err;
        })
      setTimeout(resolve, 1500)
    })
  ])
  scrollToCursor(props.defaultCursor)
}

const selectionChangeHandler = () => {
  logger.info('selectionChangeHandler', window.getSelection()?.isCollapsed)
  if (window.getSelection()?.isCollapsed) {
    bscroll?.enable()
  } else {
    bscroll?.disable()
  }
}

let bscroll: BScroll | null = null
onMounted(() => {
  bscroll = new BScroll(el.value!, {
    scrollX: false,
    scrollY: true,
    click: false,
    bounce: true,
    probeType: 3,
    deceleration: 0.001,
    useTransition: false, 
    mouseWheel: {
      speed: 20,
      invert: false,
      easeTime: 300
    },
    preventDefault: false
  })
  bscroll.on('scroll', scrollHandler)
  document.addEventListener('selectionchange', selectionChangeHandler)
  init()
})

onBeforeUnmount(() => {
  bscroll?.destroy()
  bscroll = null
  document.removeEventListener('selectionchange', selectionChangeHandler)
})

defineExpose({
  jump,
  scroll: (() => {
    let totalDistance = 0;
    return (distance: number) => {
      totalDistance += distance
      const scrollDistance = Math.floor(totalDistance)
      totalDistance = totalDistance - scrollDistance
      if (scrollDistance <= 0) return;
      bscroll?.scrollBy(0, -scrollDistance, 0)
    }
  })(),
  getNextReadElement(current?: HTMLElement) {
    if (!current) {
      const progress = getCurrentProgress()
      if (!progress) {
        const msg = '获取当前进度失败'
        showToast(msg);
        throw new Error;
      }
      const nextEl = el.value?.querySelector<HTMLElement>(`[data-cursor="${progress.cursor}"]`)
      return {
        nextEl,
        scrollIntoView: () => {
          if (!nextEl) return;
          bscroll?.scrollToElement(nextEl, disableAnim.value ? 0 : 300, 0, true)
        }
      }
    }
    const cursor = Number(current.dataset.cursor)
    // 找到下一个非空节点
    let nextCursor = cursor + 1
    let nextEl = el.value?.querySelector<HTMLElement>(`[data-cursor="${nextCursor}"]`)
    while(nextEl && !nextEl.textContent?.trim()) {
      nextCursor += 1
      nextEl = el.value?.querySelector<HTMLElement>(`[data-cursor="${nextCursor}"]`)
    }
    return {
      nextEl,
      scrollIntoView: () => {
        if (!nextEl) return;
        bscroll?.scrollToElement(nextEl, disableAnim.value ? 0 : 300, 0, true)
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.chapter-contents {
  height: 100%;
  overflow: hidden;
  position: relative;
}
.chapter-contents-wrapper {
  z-index: 0;
  background-clip: border-box;
  position: relative;
  background-image: var(--read-bg-image);
  background-size: contain;
  background-attachment: local;
  background-color: var(--read-bg-color);
  padding-left: 12px;
  padding-right: 12px;
  padding-top: var(--sait);
  padding-bottom: var(--saib);
  line-height: inherit;
  font-size: inherit;
  user-select: text;
  -webkit-user-select: text;
  * {
    color: var(--read-text-color);
  }
}
.chapter-contents :deep(.chapter-contents-wrapper) {
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
    text-indent: var(--text-indent);
    word-break: break-all;
    line-break: anywhere;
    /* content-visibility: auto; */
  }
  p + p {
    margin-top: 0.8em;
  }

  h3.chapter-title {
    font-size: 1.2em;
  }
  p.reading {
    color: var(--reading-text-color);
    background: var(--reading-bg-color);
  }
}
</style>
