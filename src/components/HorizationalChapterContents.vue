<template>
  <div class="horizontal-chapter-contents" ref="el" @tap="tapHandler" :style="{'--column-count': columnCount}">
    <div class="chapter-contents-wrapper" @scroll="scrollHandler"></div>
  </div>
</template>

<script setup lang="ts">
import { debounce, showToast } from '@/utils';
import { renderChapter } from '@/utils/chapter';
import { disableAnim, env, isSmall } from '@/utils/env';
import { computed, nextTick, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import Logger from 'js-logger'
import { createGesture } from '@/utils/gesture';
import { settings } from '@/stores/settings';
import { VolumeButtons } from '@capacitor-community/volume-buttons'
import { preferences } from '@/stores/preferences';

const logger = Logger.get('HorizationalChapterContents')

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
const keeps = 3
const columnCount = computed(() => isSmall.value ? 1 : 2);
const getPageWidth = () => window.innerWidth / columnCount.value;

let startScrollLeft = 0
let touching = false

const renderContents = (contents: HTMLElement[]) => {
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
  const { left: oldLeft } = chapterEl.getBoundingClientRect()

  // 3. 更新章节
  wrapper.replaceChildren(...contents)

  // 4. 获取新的章节位置
  const newChapterEl = el.value.querySelector<HTMLDivElement>(`.chapter[data-id="${progress.chapter.id}"]`)
  if (!newChapterEl) return;
  const { left: newLeft } = newChapterEl.getBoundingClientRect()

  // 5. 计算需要滚动的位置并滚动
  const distance = newLeft - oldLeft
  wrapper.scrollLeft += distance
}

let lastLoadChapterId: string | null = null
const loadContents = async (chapterId: string) => {
  if (lastLoadChapterId === chapterId) return;
  lastLoadChapterId = chapterId
  const chapterIndex = props.chapterList.findIndex(chapter => chapter.id === chapterId)
  const targetIndex = Math.max(0, chapterIndex)
  const startIndex = Math.max(0, targetIndex - Math.floor(keeps / 2))
  const contents = await Promise.all(
    props.chapterList.slice(startIndex, startIndex + keeps).map(async (chapter, i) => {
      const text = await props.loadChapter(chapter, startIndex + i)
      return renderChapter(chapter, text, startIndex + i)
    })
  )
  if (touching) return;
  renderContents(contents)
}

const scrollToCursor = async (cursor: number, options: { anim: boolean } = { anim: false }) => {
  await nextTick()
  const target = el.value?.querySelector<HTMLElement>(`[data-cursor="${cursor}"]`)
  if (!target) return
  // 计算这个矩形落在哪一页
  const pageWidth = getPageWidth()
  const distance = Math.round(target.offsetLeft / pageWidth) * pageWidth
  el.value?.querySelector<HTMLElement>(`.chapter-contents-wrapper`)?.scrollTo({ left: distance, behavior: options.anim && !disableAnim.value ? 'smooth' : 'instant' })
}

const getCurrentProgress = () => {
  // 获取当前在可视区域的是哪一个章节
  const wrapperRect = el.value?.querySelector<HTMLElement>('.chapter-contents-wrapper')?.getBoundingClientRect()
  if (!wrapperRect) return;
  const centerEl = document.elementFromPoint(wrapperRect.left + wrapperRect.width / 2, wrapperRect.top + wrapperRect.height / 2)
  let chapterEl = centerEl?.matches('.chapter') ? centerEl as HTMLElement : centerEl?.closest<HTMLElement>('.chapter')
  chapterEl = chapterEl ? chapterEl : Array.from(el.value?.querySelectorAll<HTMLElement>('.chapter') || []).find(item => {
    const rect = item.getBoundingClientRect()
    return (rect.left > wrapperRect.left && rect.left < wrapperRect.right)
      || (rect.right > wrapperRect.left && rect.right < wrapperRect.right)
      || (rect.left < wrapperRect.left && rect.right > wrapperRect.right)
  })
  if (!chapterEl) {
    console.error('获取正在阅读的章节失败', centerEl)
    return;
  }
  const els = Array.from(chapterEl.querySelectorAll<HTMLDivElement>('[data-cursor]'))
  const target = els.find(cursorEl => {
    const rect = cursorEl.getBoundingClientRect()
    return rect.left > 0
  }) || els[els.length - 1]
  if (!target) {
    console.error('获取正在阅读的进度失败')
    return
  }
  return {
    chapterIndex: Number(chapterEl.dataset.chapterIndex),
    chapter: props.chapterList[Number(chapterEl.dataset.chapterIndex)],
    cursor: Number((target as HTMLElement | null)?.dataset.cursor)
  }
}

let gesture: ReturnType<typeof createGesture> | null = null
watch(isSmall, async (val) => {
  if (!val) {
    gesture?.clean()
  } else {
    if (!el.value) {
      // DOM 可能尚未 ready, 等待下一个 tick
      await nextTick()
      if (!el.value) return;
    }
    console.log('createGesture')
    gesture = createGesture({
      el: el.value,
      onStart() {
        logger.info('gesture.onStart')
        touching = true
        if (window.getSelection()?.toString()) return false;
        startScrollLeft = el.value?.querySelector<HTMLElement>('.chapter-contents-wrapper')?.scrollLeft || 0
      },
      onMove(detail) {
        logger.info('gesture.onMove', detail)
        if (window.getSelection()?.toString()) return;
        el.value?.querySelector<HTMLElement>('.chapter-contents-wrapper')?.scrollTo({ left: startScrollLeft - detail.deltaX })
      },
      onEnd(detail) {
        logger.info('gesture.onEnd', detail)
        const wrapper = el.value!.querySelector<HTMLElement>('.chapter-contents-wrapper')!
        const pw = getPageWidth()
        let scrollLeft = 0
        if (detail.velocityX > 0.2) {
          scrollLeft = Math.max(0, Math.round(startScrollLeft / pw) - 1) * pw
        } else if (detail.velocityX < -0.2) {
          scrollLeft = (Math.round(startScrollLeft / pw) + 1) * pw
        } else {
          // 以当前落点计算应该滚动的位置
          scrollLeft = Math.round(wrapper.scrollLeft / pw) * pw
        }
        wrapper.scrollTo({ left: scrollLeft, behavior: disableAnim.value ? 'instant' : 'smooth' })
        touching = false
      },
    })
  }
}, { immediate: true })

onBeforeUnmount(() => {
  gesture?.clean()
  VolumeButtons.clearWatch()
})

const scrollHandler = debounce(() => {
  logger.info('scrollHandler', { touching }, getCurrentProgress())
  if (touching) return;
  const progress = getCurrentProgress()
  if (!progress) return;

  loadContents(progress.chapter.id)

  emits('progress', progress)
}, 100)

const scrollToPage = (getNextPage?: (page: number) => number) => {
  const wrapper = el.value?.querySelector<HTMLElement>('.chapter-contents-wrapper')
  if (!wrapper) return;
  const pageWidth = getPageWidth()
  const curPage = Math.round(wrapper.scrollLeft / pageWidth)
  const scrollLeft = (getNextPage?.(curPage) ?? curPage) * pageWidth
  wrapper.scrollTo({ left: scrollLeft, behavior:  disableAnim.value ? 'instant' : 'smooth' })
}

const nextPage = () => scrollToPage(page => page + 1)
const prevPage = () => scrollToPage(page => Math.max(0, (page - 1)))

const init = async () => {
  await loadContents(props.defaultChapterId)

  await Promise.all([
    loadContents(props.defaultChapterId),
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
  if (env.isApp() && ['normal', 'reverse'].includes(preferences.value.volumeControl)) {
    VolumeButtons.clearWatch()
    VolumeButtons.watchVolume({ disableSystemVolumeHandler: true, suppressVolumeIndicator: true }, (event) => {
      const shouldNext = preferences.value.volumeControl === 'normal' ? event.direction === 'down' : event.direction === 'up'
      if (shouldNext) {
        nextPage()
      } else {
        prevPage()
      }
    })
  }
}

init()

const tapHandler = (event: PointerEvent) => {
  logger.info('tapHandler', window.getSelection()?.toString(), event)
  if (window.getSelection()?.toString()) return;
  const pageWidth = window.innerWidth;
  const pageHeight = window.innerHeight;
  /**
   * 把点击区域分为九个区域，如下
   * 1|2|3
   * 4|5|6
   * 7|8|9
   * 先计算在点击落于哪个区域
   */
  const x = event.clientX
  const y = event.clientY
  const centerLeft = pageWidth / 3
  const centerRight = 2 * centerLeft
  const centerTop = pageHeight / 3
  const centerBottom = 2 * centerTop
  let area = -1
  if (y <= centerTop) {
    area = x < centerLeft ? 1 : x < centerRight ? 2 : 3
  } else if (y <= centerBottom) {
    area = x < centerLeft ? 4 : x < centerRight ? 5 : 6
  } else {
    area = x < centerLeft ? 7 : x < centerRight ? 8 : 9
  }

  const nextPageArea = [3, 6, 9]
  const prevPageArea = [1, 4, 7]
  if (nextPageArea.includes(area)) {
    nextPage()
    event.stopPropagation();
  } else if (prevPageArea.includes(area)) {
    prevPage();
    event.stopPropagation();
  }
}

defineExpose({
  prevPage,
  nextPage,
  async jump(options: { chapterId: string, cursor: number }) {
    await loadContents(options.chapterId)
    scrollToCursor(options.cursor)
  },
  scroll(distance: number) {
    throw new Error(`what's wrong, this shouldn't happen, ${distance}`)
  },
  getNextReadElement(current?: HTMLElement) {
    if (!current) {
      const progress = getCurrentProgress()
      if (!progress) {
        const msg = '获取当前进度失败'
        showToast(msg);
        throw new Error;
      }
      return {
        nextEl: el.value?.querySelector<HTMLElement>(`[data-cursor="${progress.cursor}"]`),
        scrollIntoView: () => scrollToCursor(progress.cursor, { anim: true })
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
      scrollIntoView: () => nextEl?.dataset.cursor && scrollToCursor(Number(nextEl.dataset.cursor), { anim: true })
    }
  }
})

</script>

<style lang="scss" scoped>
.horizontal-chapter-contents {
  display: flex;
  align-items: center;
  width: 100%;
  --column-count: 1;
  --column-width: calc(100vw / var(--column-count) * 0.88);
  --column-gap: calc(var(--column-width) * 0.12);
}
.chapter-contents-wrapper {
  column-width: var(--column-width);
  width: 100vw;
  padding: var(--sait) calc(var(--column-gap) / 2) var(--saib) calc(var(--column-gap) / 2);
  column-gap: var(--column-gap);
  height: var(--page-height);
  background-image: var(--read-bg-image);
  background-size: cover;
  background-color: var(--read-bg-color);
  overflow-x: hidden;
  position: relative;
  user-select: text;
  -webkit-user-select: text;
  * {
    color: var(--read-text-color);
  }
}
.horizontal-chapter-contents :deep(.chapter-contents-wrapper) {
  .placeholder {
    width: 100%;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .chapter {
    min-height: 100%;
    break-after: column;
  }
  p {
    text-indent: var(--text-indent);
    word-break: break-all;
    /* content-visibility: auto; */
  }
  p + p {
    margin-top: 0.8em;
  }

  h3.chapter-title {
    font-size: 1.2em;
    // 如果章节只有标题，没有内容，则把标题居中
    text-align: center;
    padding-top: 40vh;
    // 如果章节有非空内容，则把标题居左并移除上边距
    &:has(~ p:not(:empty)) {
      text-align: left;
      padding-top: 0;
    }
  }
  p.reading {
    color: var(--reading-text-color);
    background: var(--reading-bg-color);
  }
}
</style>
