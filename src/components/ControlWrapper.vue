<template>
  <div class="control-wrapper">
    <div class="control-mask" v-show="panelVisible" @pointerup.self="maskClickHandler"></div>
    <transition name="slide-down" :css="!disableAnim" v-if="!isSmall">
      <web-read-control
        :title="title"
        ref="read-control"
        v-show="panelVisible && !selectMenuShowed"
        :get-next-read-element="getNextReadElement"
        @open-chapter-list="dialog='chapterList'"
        @scroll-vertical="$emit('scroll-vertical', $event)"
        @next-page="$emit('next-page')"
      >
      </web-read-control>
    </transition>
    <transition name="slide-down" :css="!disableAnim" v-if="isSmall">
      <navigation-bar class="navigator"
        v-show="panelVisible && !selectMenuShowed"
        :title="title"
        @menu="dialog='bookMenu'"
      >
      </navigation-bar>
    </transition>

    <c-dialog :visible="dialog==='chapterList'"
      height="var(--page-height)"
      width="min(85vw, 375px)"
      :position="isSmall ? 'left' : 'right'"
      body-style="padding-left:0;padding-right:0"
      @close="dialog=null">
      <slot name="chapterList"></slot>
    </c-dialog>

    <book-menu-dialog
      :visible="dialog==='bookMenu'"
      :book-id="bookId"
      @close="dialog=null"
      @action="onAction"
    >
    </book-menu-dialog>

    <search-dialog
      :visible="dialog==='search'"
      @close="dialog=null"
      :book-id="bookId"
      @jump="dialog=null;emits('jump', $event)"
    ></search-dialog>

    <book-info-dialog
      :visible="dialog==='info'"
      @close="dialog=null"
    ></book-info-dialog>

    <book-toc-settings-dialog
      :visible="dialog==='tocSettings'"
      @close="dialog=null"
      :book-id="bookId"
    ></book-toc-settings-dialog>

    <book-share-dialog
      :visible="dialog==='share'"
      @close="dialog=null"
      v-bind="dialogProps"
    ></book-share-dialog>

    <marks-dialog
      :book-id="bookId"
      :visible="dialog==='marksViewer'"
      @close="dialog=null;refreshMarks()"
      @mark-tap="jumpToMark"
    >
    </marks-dialog>


    <div class="content-container" ref="content"
      @touchstart="touchstartHandler"
      @tap="contentPointerUpHandler"
    >
      <selection-menu
        :book-id="bookId"
        :chapterId="chapterId"
        @show="selectMenuShowed = true"
        @hide="selectMenuShowed = false"
        @share="shareTextHandler"
      >
        <slot :settings="settings"></slot>
      </selection-menu>
    </div>

    <transition name="slide-up" :css="!disableAnim" v-if="isSmall">
      <read-control
        ref="read-control"
        v-show="panelVisible && !selectMenuShowed"
        :get-next-read-element="getNextReadElement"
        @open-chapter-list="dialog='chapterList'"
        @scroll-vertical="$emit('scroll-vertical', $event)"
        @next-page="$emit('next-page')"
      ></read-control>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, useTemplateRef, type ComputedRef, type Ref } from 'vue';
import CDialog from '@/components/common/CDialog.vue';
import SelectionMenu from '@/components/SelectionMenu.vue';
import BookMenuDialog from '@/components/BookMenuDialog.vue';
import MarksDialog from '@/components/MarksDialog.vue';
import SearchDialog from '@/components/SearchDialog.vue';
import BookInfoDialog from '@/components/BookInfoDialog.vue';
import BookTocSettingsDialog from '@/components/BookTocSettingsDialog.vue';
import BookShareDialog from '@/components/BookShareDialog.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import ReadControl from '@/components/ReadControl.vue';
import WebReadControl from './WebReadControl.vue';
import { settings } from '@/stores/settings';
import type { GetNextElement } from '@/actions/read-speak';
import { disableAnim, isSmall } from '@/utils/env';
import { useRouter } from 'vue-router';
import Logger from 'js-logger';

const logger = Logger.get('ControlWrapper');

const props = defineProps<{
  bookId: number
  chapterId: string,
  title?: string,
  getNextReadElement: GetNextElement
}>()

const emits = defineEmits<{
  'prev-page': [],
  'next-page': [],
  'scroll-vertical': [number],
  'jump': [{ cursor: number, chapterId: string }],
}>()

const panelVisible = ref(false)
const readControlRef = useTemplateRef('read-control')
const dialog = ref<string | null>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dialogProps = ref<any>(null)
const selectMenuShowed = ref(false)
const book = inject<Ref<IBook>>('book')
const chapter = inject<ComputedRef<IChapter>>('chapter')

const contentRef = useTemplateRef('content')
const router = useRouter()

const refreshMarks = () => {
  const chapterEls = contentRef.value!.querySelectorAll<HTMLElement>('.chapter')
  chapterEls.forEach(el => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).chapterMark?.refresh()
  })
}

const jumpToMark = (mark: IMarkEntity) => {
  if (mark.start) {
    emits('jump', { chapterId: mark.chapterId, cursor: mark.start.cursor })
    return
  }
  // 之前的旧数据，没有保存 cursor, 无法跳转过去
}

const shareTextHandler = (mark: { text: string, chapterId: string, chapterIndex: number }) => {
  dialogProps.value = {
    mode: 'text', bookId: props.bookId,
    text: mark.text, chapterId: mark.chapterId, chapterIndex: mark.chapterIndex
  }
  dialog.value = 'share'
}

const onAction = (name: string) => {
  if (name === 'share') {
    dialogProps.value = { mode: 'book', bookId: props.bookId }
    dialog.value = 'share'
    return
  }
  if (name === 'ai') {
    dialog.value = null
    router.push({
      name: 'ai-chat',
      params: { id: props.bookId },
      query: { bookTitle: book?.value.title || '', chapterTitle: chapter?.value.title || '' }
    })
    return
  }

  dialog.value = name
}

const touchstartHandler = (e: TouchEvent) => {
  const p = e.changedTouches[0]
  if (p.pageX < 20 || p.pageX > window.innerWidth - 20) {
    e.preventDefault()
  }
}


const maskClickHandler = () => {
  panelVisible.value = false
}

const contentPointerUpHandler = (event: PointerEvent) => {
  logger.info('contentPointerUpHandler', event.target)
  if (panelVisible.value) return;
  panelVisible.value = true;
  event.stopPropagation()
  if (readControlRef.value?.isAutoPlaying()) {
    readControlRef.value.openPanel('autoPlay')
  }
}

defineExpose({
  closeDialog() {
    dialog.value = null
    panelVisible.value = false
  },
  openDialog(name: 'search' | 'tocSettings') {
    panelVisible.value = false
    dialog.value = name
  }
})

</script>

<style lang="scss" scoped>
.control-wrapper {
  height: 100%;
  flex: 1;
  position: relative;
  .control-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.05);
    z-index: 5;
  }
}
.control-wrapper .content-container {
  overflow: auto;
  touch-action: none;
  height: 100%;
}

.control-wrapper .navigator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
:global(.ai-chat-dialog .ai-chat-view.container) {
  height: 70vh;
  padding: 0;
}
</style>
