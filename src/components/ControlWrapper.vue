<template>
  <div class="control-wrapper">
    <transition name="slide-down" :css="!disableAnim">
      <navigation-bar class="navigator"
        v-show="panelVisible && !selectMenuShowed"
        :title="title"
        @menu="dialog='bookMenu'"
      >
      </navigation-bar>
    </transition>

    <c-dialog :visible="dialog==='chapterList'"
      height="var(--page-height)"
      width="85vw"
      position="left"
      body-style="padding-left:0;padding-right:0"
      @close="dialog=null">
      <slot name="chapterList"></slot>
    </c-dialog>

    <book-menu-dialog
      :visible="dialog==='bookMenu'"
      :book-id="bookId"
      @close="dialog=null"
      @action="openShareDialog"
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

    <c-dialog
      title="AI问书"
      :visible="dialog==='ai'"
      class="ai-chat-dialog"
      @close="dialog=null"
      body-style="padding: 0"
    >
      <a-i-chat-view no-header></a-i-chat-view>
    </c-dialog>

    <marks-dialog
      :book-id="bookId"
      :visible="dialog==='marksViewer'"
      @close="dialog=null;refreshMarks()"
    >
    </marks-dialog>

    <selection-menu
      :book-id="bookId"
      :chapterId="chapterId"
      @show="selectMenuShowed = true"
      @hide="selectMenuShowed = false"
      @share="shareTextHandler"
    >
      <div class="content-container" ref="content" @touchstart="touchstartHandler">
          <slot :settings="settings"></slot>
      </div>
    </selection-menu>

    <transition name="slide-up" :css="!disableAnim">
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
import { defineAsyncComponent, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import CDialog from '@/components/common/CDialog.vue';
import SelectionMenu from '@/components/SelectionMenu.vue';
import BookMenuDialog from '@/components/BookMenuDialog.vue';
import MarksDialog from '@/components/MarksDialog.vue';
import SearchDialog from '@/components/SearchDialog.vue';
import BookInfoDialog from '@/components/BookInfoDialog.vue';
import BookTocSettingsDialog from '@/components/BookTocSettingsDialog.vue';
import BookShareDialog from '@/components/BookShareDialog.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import router from '@/router';
import ReadControl from '@/components/ReadControl.vue';
import Hammer from 'hammerjs';
import { settings } from '@/stores/settings';
import type { GetNextElement } from '@/actions/read-speak';
import { disableAnim } from '@/utils/env';

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

const AIChatView = defineAsyncComponent(() => import('@/views/AIChatView.vue'))

const panelVisible = ref(false)
const readControlRef = useTemplateRef('read-control')
const dialog = ref<string | null>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dialogProps = ref<any>(null)
const selectMenuShowed = ref(false)

const contentRef = useTemplateRef('content')

const refreshMarks = () => {
  const chapterEls = contentRef.value!.querySelectorAll<HTMLElement>('.chapter')
  chapterEls.forEach(el => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).chapterMark?.refresh()
  })
}

const shareTextHandler = (mark: { text: string, chapterId: string, chapterIndex: number }) => {
  dialogProps.value = {
    mode: 'text', bookId: props.bookId,
    text: mark.text, chapterId: mark.chapterId, chapterIndex: mark.chapterIndex
  }
  dialog.value = 'share'
}

const openShareDialog = () => {
  dialogProps.value = { mode: 'book', bookId: props.bookId }
  dialog.value = 'share'
}

const touchstartHandler = (e: TouchEvent) => {
  const p = e.changedTouches[0]
  if (p.pageX < 20 || p.pageX > window.innerWidth - 20) {
    e.preventDefault()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hammerInstance: any

const initHammer = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentTapHandler = (event: any) => {
    if (event.srcEvent.target.nodeName.toLowerCase() === 'mark') return
    if (settings.value.turnPageType === 'horizontal-scroll') {
      if (panelVisible.value) {
        panelVisible.value = false
        return;
      }
      /**
       * 把点击区域分为九个区域，如下
       * 1|2|3
       * 4|5|6
       * 7|8|9
       * 先计算在点击落于哪个区域
       */
      const { x, y } = event.center
      const centerLeft = window.innerWidth / 3
      const centerRight = 2 * centerLeft
      const centerTop = window.innerHeight / 3
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
        emits('next-page')
      } else if (prevPageArea.includes(area)) {
        emits('prev-page')
      } else {
        panelVisible.value = !panelVisible.value
      }
      return
    }
    if (readControlRef.value?.isAutoPlaying()) {
      readControlRef.value.openPanel('autoPlay')
    }
    panelVisible.value = !panelVisible.value
  }
  const hammer = new Hammer.Manager(contentRef.value!, {
    recognizers: [
      [Hammer.Tap],
      [Hammer.Swipe, { direction: Hammer.DIRECTION_ALL, threshold: 10 }]
    ]
  })
  hammer.on('swiperight', (() => {
    let backed = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (e: any) => {
      if (settings.value.turnPageType === 'horizontal-scroll') return;
      if ((window.getSelection()?.toString().length ?? 0) > 0) {
        return
      }
      const { center: { x }, deltaX } = e
      const startX = x - deltaX
      if (startX <= 80 && !backed) {
        backed = true
        router.back()
      }
    }
  })())
  hammer.on('swipeleft', () => {
    dialog.value = 'chapterList'
  })
  hammer.on('tap', contentTapHandler)
  hammerInstance = hammer
}

onMounted(() => {
  initHammer();
})

onUnmounted(() => { if (hammerInstance) { hammerInstance.destroy() } })

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
:global(.ai-chat-dialog .ai-chat-view) {
  height: 70vh;
  padding: 0;
}
</style>
