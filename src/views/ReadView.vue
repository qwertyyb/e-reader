<template>
  <book-animation ref="anim" class="read-view book-read-view">
    <control-wrapper class="control-wrapper book-anim-main" ref="control-wrapper"
      v-if="chapter"
      :book-id="+id"
      :chapter-id="+chapter.id"
      @prev-page="pageHandler('prev')"
      @next-page="pageHandler('next')"
      @scroll-vertical="scrollVertical"
      @jump="jump"
    >
      <template v-slot:chapterList>
        <c-virtual-list
          class="catalog-content-wrapper"
          data-key="id"
          :data-sources="chapterList"
          ref="catalog"
          :estimate-size="42"
          :active-index="curChapterIndex"
        >
          <template v-slot="{ source, index }">
            <div class="catalog-item"
              @click="readChapter(source, index)"
              :class="{active: index === curChapterIndex}"
              :data-catalog-level="source.level || 1"
              :data-catalog-id="source.id">
              <div class="catalog-label">{{ source.title }}</div>
            </div>
          </template>
        </c-virtual-list>
      </template>
      <template v-slot="{ settings }">
        <div
          class="content-wrapper"
          ref="contentWrapper"
          :data-font="settings.fontFamily"
          :style="{
            fontSize: settings.fontSize + 'px',
            fontWeight: settings.fontWeight
          }"
        >
          <chapter-content-list
            v-if="defaultProgress"
            :chapter-list="chapterList"
            :default-chapter-id="defaultProgress.chapterId"
            :default-cursor="defaultProgress.cursor"
            :load-chapter="loadChapter"
            @load="loadChapter"
            @progress="updateProgress"
            ref="chapter-content-list"
          ></chapter-content-list>
          <!-- <virtual-list
            :data-sources="chapterList"
            data-key="id"
            :keeps="3"
          >
            <template v-slot="{ source }">
              <div class="chapter-wrapper" v-html="source.content">
              </div>
            </template>
          </virtual-list> -->
          <!-- <div class="content" :data-font="settings.fontFamily"
            :style="{
              fontSize: settings.fontSize + 'px',
              fontWeight: settings.fontWeight
            }"
            :class="{ column: env.isInk() }"
            @scroll="hScrollHandler"
            v-html="content">
          </div> -->
        </div>
      </template>
    </control-wrapper>
  </book-animation>
</template>

<script setup lang="ts">
import ControlWrapper from '@/components/ControlWrapper.vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { localBookService as dataService } from '@/services/LocalBookService';
import { env } from '@/utils/env';
import { showToast } from '@/utils';
import { readingStateStore } from '@/services/storage';
import BookAnimation from '@/components/BookAnimation.vue';
import CVirtualList from '@/components/common/CVirtualList.vue';
import { onBeforeRouteLeave } from 'vue-router';
import { renderChapter } from '@/utils/chapter';
import ChapterContentList from '@/components/ChapterContentList.vue';

interface IChapterItem extends IChapter {
  status: 'default' | 'loading' | 'loaded',
  content?: string
}

const props = defineProps<{
  id: string
}>()

const chapterList = ref<IChapterItem[]>([])
const curChapterIndex = ref(0)
const animRef = useTemplateRef('anim')
const chapterContentListRef = useTemplateRef('chapter-content-list')
const defaultProgress = ref<{ chapterId: string, cursor: number } | null>(null)

const chapter = computed(() => chapterList.value[curChapterIndex.value])

const contentWrapperRef = useTemplateRef('contentWrapper')

const pageHandler = (direction: 'prev' | 'next') => {
  console.log('pageHandler', direction)
}

const scrollVertical = (distance: number) => {
  contentWrapperRef.value!.scrollTop += distance
}

const readChapter = async (chapter: IChapter, index: number) => {
  curChapterIndex.value = index
  chapterContentListRef.value?.jump({ chapterId: chapter.id, cursor: chapter.cursorStart })
}
const loadChapter = async (chapter: IChapterItem, chapterIndex: number) => {
  console.log('loadChapter', chapter)
  if (chapter.content) return;
  chapter.status = 'loading'
  const text = await dataService.getChapter(props.id as string)
  const content = renderChapter(chapter, text, chapterIndex)
  chapter.content = content
  chapter.status = 'loaded'
}
const updateProgress = (progress: { chapter: IChapterItem, cursor: number, chapterIndex: number }) => {
  console.log('updateProgress', progress)
  curChapterIndex.value = progress.chapterIndex

  readingStateStore.update(props.id, {
    chapterId: progress.chapter.id,
    cursor: progress.cursor,
    lastReadTime: Date.now(),
  })
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

  // await loadChapter(nextIndex)
}

const hScrollHandler = () => {
  if (!env.isInk()) return;
  // updateProgress()
  if (needAppendNextChapter()) {
    appendNextChapter()
  }
}
// const vScrollHandler = () => {
//   updateProgress()
//   if (needAppendNextChapter()) {
//     appendNextChapter()
//   }
// }

const fetchChapterList = async () => {
  const catalog = await dataService.getChapterList(props.id)
  if (!catalog) {
    return showToast(`获取目录失败: ${props.id}`)
  }
  chapterList.value = catalog.map(item => ({
    ...item,
    status: 'default', // default | loading | loaded
    content: '',
  }))
}
const startRead = async () => {
  const { chapterId = chapterList.value[0].id, cursor = 0 } = await readingStateStore.get(props.id) || {}
  defaultProgress.value = { chapterId, cursor }
  await nextTick()
}

const jump = async (options: { chapterId: string, cursor: number }) => {
  chapterContentListRef.value?.jump(options)
}

const init = async () => {
  await fetchChapterList()
  await startRead()
  readingStateStore.update(props.id, { lastReadTime: Date.now() })
  await nextTick()
}

init()

onBeforeRouteLeave((to, from, next) => {
  animRef.value?.closeBook()
  next()
})

defineExpose({
  closeBook: () => {
    return animRef.value?.closeBook()
  },
  openBook: () => {
    return animRef.value?.openBook()
  },
})

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
  height: 100vh;
  box-sizing: border-box;
  z-index: 0;
  // height: var(--read-view-content-height);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  background-clip: border-box;
  overflow: auto;
  position: relative;
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
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  content-visibility: auto;
  box-sizing: border-box;
}
.catalog-item {
  padding: 0 16px;
  border-bottom: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 42px;
  cursor: pointer;
  font-size: 15px;
}
.catalog-item[data-catalog-level="2"] .catalog-label {
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
