<template>
  <div class="read-view book-read-view">
    <div class="book-anim">
      <div class="book-cover book-anim-cover">
        <img class="book-cover-img" :src="book?.cover" :alt="book?.title" />
        <div class="book-cover-backface"></div>
      </div>
      <control-wrapper class="control-wrapper book-anim-main" ref="control-wrapper"
        v-if="chapter"
        :book-id="+id"
        :chapter-id="+chapter.id"
        @prev-page="pageHandler('prev')"
        @next-page="pageHandler('next')"
        @scroll-vertical="scrollVertical"
        @jump="jump"
      >
        <template v-slot:catalog>
          <virtual-list
            class="catalog-content-wrapper"
            data-key="id"
            :data-sources="chapterList"
            ref="catalog"
            :estimate-size="48">
            <template v-slot="{ source, index }">
              <div class="catalog-item"
                @click="readChapter(source, index)"
                :class="{active: index === curChapterIndex}"
                :data-catalog-level="source.level || 1"
                :data-catalog-id="source.id">
                <div class="catalog-label">{{ source.title }}</div>
              </div>
            </template>
          </virtual-list>
        </template>
        <template v-slot="{ settings }">
          <div class="content-wrapper" ref="contentWrapper" @scroll="vScrollHandler">
            <div class="content" :data-font="settings.fontFamily"
              :style="{
                fontSize: settings.fontSize + 'px',
                fontWeight: settings.fontWeight
              }"
              :class="{ column: env.isInk() }"
              @scroll="hScrollHandler"
              v-html="content">
            </div>
          </div>
        </template>
      </control-wrapper>
    </div>
  </div>
</template>

<script setup lang="ts">
import ControlWrapper from '@/components/ControlWrapper.vue';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import { localBookService as dataService } from '@/services/LocalBookService';
import { env } from '@/utils/env';
import { showToast } from '@/utils';
import { lastReadBook, lastReadBooks } from '@/utils/last-read';

interface IChapter {
  id: string
  status: 'default' | 'loading' | 'loaded',
  content?: string
}

const props = defineProps<{
  id: string
}>()

let inited = false
let book: IBookEntity | null = null
const chapterList = ref<IChapter[]>([])
const startChapterIndex = ref(0)
const curChapterIndex = ref(0)

const chapter = computed(() => chapterList.value[curChapterIndex.value])

const contentChapterList = computed(() => {
  const results: Required<IChapter>[] = []
  for(let i = startChapterIndex.value; i < chapterList.value.length; i += 1) {
    const chapter = chapterList.value[i]
    if (chapter.status === 'loaded') {
      results.push(chapter as Required<IChapter>)
    } else {
      break
    }
  }
  return results
})

const content = computed(() => {
  return contentChapterList.value.map(chapter => chapter.content).filter(i => i).join('\n') || '<div class="placeholder">正在加载</div>'
})

const contentWrapperRef = useTemplateRef('contentWrapper')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogRef = useTemplateRef<any>('catalog')

watch(curChapterIndex, () => {
  catalogRef.value?.scrollToIndex(Math.max(0, curChapterIndex.value - 2))
})

const pageHandler = (direction: 'prev' | 'next') => {
  console.log('pageHandler', direction)
}

const scrollVertical = (distance: number) => {
  contentWrapperRef.value!.scrollTop += distance
}

const readChapter = async (item: IChapter, index: number) => {
  startChapterIndex.value = index
  curChapterIndex.value = index
  await loadChapter(curChapterIndex.value)
  await nextTick()
  contentWrapperRef.value!.scrollTo(0, 0)
  updateProgress()
}
const loadChapter = async (chapterIndex: number) => {
  const chapter = chapterList.value[chapterIndex]
  chapter.status = 'loading'
  const content = await dataService.getChapter(props.id as string, chapter.id, chapterIndex)
  chapter.content = content
  chapter.status = 'loaded'
}
const updateProgress = () => {
  if (!inited) return;
  const { chapter, cursor, chapterIndex } = getCurrentProgress() || {}
  if (!chapter || !cursor || !chapterIndex && chapterIndex !== 0) return;

  curChapterIndex.value = chapterIndex

  // lastReadBooks.set(Number(props.id), { catalogId: chapter.id, cursor })
}

const getCurrentProgress = () => {
  // 1. 找到当前的章节
  const content = contentWrapperRef.value?.querySelector('.content')
  const chapterEls = content!.querySelectorAll<HTMLDivElement>('.chapter')
  const chapterEl = Array.from(chapterEls)
    .reverse()
    .find((el) => {
      const { top, left } = el.getBoundingClientRect()
      return top < 0 || left < 0
    }) || chapterEls[0]
  if (!chapterEl) return

  // 2. 找到章节中最靠近上方的段落
  const els = Array.from(chapterEl.querySelectorAll<HTMLDivElement>('.content [data-cursor]'))
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
    chapter: chapterList.value[Number(chapterEl.dataset.chapterIndex)],
    cursor: Number((target as HTMLDListElement | null)?.dataset.cursor)
  }
}

const needAppendNextChapter = () => {
  if (env.isInk()) {
    const content = contentWrapperRef.value?.querySelector('.content')
    const pageWidth = content!.getBoundingClientRect().width
    const curPage = Math.round(content!.scrollLeft / pageWidth)
    const totalPage = Math.round(content!.scrollWidth / pageWidth)
    return totalPage - curPage <= 2
  }
  const contentWrapper = contentWrapperRef.value!
  return contentWrapper.scrollHeight - contentWrapper.scrollTop - contentWrapper.clientHeight <= 50
}

const appendNextChapter = async () => {
  let nextIndex = -1
  for (let i = curChapterIndex.value; i < chapterList.value.length; i += 1) {
    if (chapterList.value[i].status === 'loading') {
      break;
    }
    if (chapterList.value[i].status === 'default') {
      nextIndex = i;
      break;
    }
  }
  if (nextIndex < 0) return;

  await loadChapter(nextIndex)
}

const hScrollHandler = () => {
  if (!env.isInk()) return;
  updateProgress()
  if (needAppendNextChapter()) {
    appendNextChapter()
  }
}
const vScrollHandler = () => {
  updateProgress()
  if (needAppendNextChapter()) {
    appendNextChapter()
  }
}

const fetchBook = async () => {
  const bk = await dataService.getBook(props.id)
  if (!bk) {
    return showToast(`获取book失败: ${props.id}`)
  }
  const catalog = await dataService.getChapterList(props.id)
  if (!catalog) {
    return showToast(`获取目录失败: ${props.id}`)
  }
  chapterList.value = catalog.map(item => ({
    ...item,
    status: 'default', // default | loading | loaded
    content: '',
  }))
  book = bk
}
const startRead = async () => {
  const { catalogId = chapterList.value[0].id, cursor = 0 } = lastReadBooks.get(Number(props.id)) || {}

  let index = chapterList.value.findIndex(item => `${item.id}` === `${catalogId}`)
  index = index >= 0 ? index : 0
  await readChapter(chapterList.value[index], index)

  await nextTick()

  const el = document.querySelector(`.content [data-cursor="${cursor}"]`)
  el?.scrollIntoView()

  // 等待滚动到位置后再监听滚动事件
  setTimeout(() => {
    inited = true
  }, 300)
}

const jump = async (options: { chapterId: string, cursor: number }) => {
  const index = chapterList.value.findIndex(item => String(item.id) === String(options.chapterId))
  if (index < 0) return;
  startChapterIndex.value = index
  curChapterIndex.value = index
  await loadChapter(index)
  await nextTick()
  const el = document.querySelector(`.content [data-cursor="${options.cursor}"]`)
  el?.scrollIntoView()
}

const init = async () => {
  await fetchBook()
  await startRead()
  lastReadBook.set(Number(props.id))
  // books.updateLastReadTime(Number(props.id))
  await nextTick()
  catalogRef.value?.scrollToIndex(Math.max(0, curChapterIndex.value - 2))
}

init()

</script>

<style lang="scss" scoped>
@property --read-view-content-height {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 100vh;
}
@property --cover-rotate {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
.read-view {
  --read-view-content-height: 100vh;
  --read-view-background-image: url("../assets/text-bg.png");
  width: 100vw;
  position: relative;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  &.anim {
    height: 100vh;
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10;
    transform-style: preserve-3d;
    perspective: 1000px;
    --read-view-content-height: calc(100vw / 3 * 4);
    &.close-anim {
      --read-view-content-height: 100vh;
      --cover-rotate: -180deg;
    }
    .book-anim {
      width: 100vw;
      height: var(--read-view-content-height);
      perspective: 140vw;
    }
    .control-wrapper {
      aspect-ratio: 3 / 4;
    }
    .book-cover {
      display: block;
    }
  }
  .book-anim {
    transform-origin: center center;
  }
  .book-cover {
    width: 100%;
    aspect-ratio: 3 / 4;
    height: var(--read-view-content-height);
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    transform-origin: left;
    transform: rotateY(var(--cover-rotate));
    display: none;
    transform-style: preserve-3d;
    .book-cover-backface {
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;
      background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
      background-image: var(--read-view-background-image);
      background-size: cover;
      transform: rotateY(-180deg);
      transform: translateZ(1px);
      z-index: 1;
    }
    :global(html.dark-mode .read-view .book-cover .book-cover-backface) {
      background-image: none;
    }
    .book-cover-img {
      backface-visibility: hidden;
      width: 100%;
      height: auto;
      vertical-align: top;
      position: relative;
      transform: translateZ(2px);
      z-index: 2;
    }
  }
  .control-wrapper {
    width: 100%;
    position: relative;
    z-index: 0;
    height: var(--read-view-content-height);
    overflow: hidden;
  }
}

.mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9;
}
.content-wrapper {
  width: 100%;
  height: var(--read-view-content-height);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  background-clip: border-box;
  overflow: auto;
  position: relative;
  z-index: 2;
  background-image: var(--read-view-background-image);
  background-size: contain;
  background-attachment: local;
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
}

:global(html.dark-mode .content-wrapper) {
  background-image: none;
}
.content-wrapper :deep(.content) {
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

.catalog-content-wrapper {
  flex: 1;
  overflow: auto;
  overscroll-behavior: contain;
  content-visibility: auto;
  box-sizing: border-box;
}
.catalog-item {
  padding: 0 10px;
  border-bottom: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 48px;
  cursor: pointer;
}
.catalog-item[data-catalog-level="1"] .catalog-label {
  margin-left: 1em;
}
.catalog-item .catalog-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.catalog-item.active .catalog-label {
  color: rgb(29, 132, 146);
  font-weight: bold;
}
</style>
