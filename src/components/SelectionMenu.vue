<template>
  <div class="selection-menu">
    <div class="selection-menu-content-wrapper"
      @pointerdown.capture="isPointerDown = true"
      @pointerup.capture="pointerUpHandler"
      @pointercancel.capture="pointerUpHandler"
      @tap.capture="contentTapHandler"
      ref="contentWrapper">
      <slot></slot>
    </div>
    <teleport to="#app">
      <div class="selection-menu-list-wrapper"
        @pointerdown.prevent
        :style="floatingStyles"
        v-show="visible"
        ref="floating">
        <div class="arrow"
          ref="floating-arrow"
          :style="{
            position: 'absolute',
            left:
              middlewareData.arrow?.x != null
                ? `${middlewareData.arrow.x}px`
                : '',
            top:
              middlewareData.arrow?.y != null
                ? `${middlewareData.arrow.y}px`
                : '',
          }"
        ></div>
        <ul class="selection-menu-list"
          :class="{ 'count-3': mark?.id }"
        >
          <li class="selection-menu-item" @click="actionHandler($event, 'thought')">
            <div class="menu-item-wrapper">
              <span class="material-symbols-outlined menu-icon">lightbulb</span>
              <span class="menu-item-label">想法</span>
            </div>
          </li>
          <li class="selection-menu-item" v-if="mark?.id && mark?.style !== MarkStyles.NONE">
            <mark-style-menu
              :mark="mark"
              :key="mark.id"
              @update="updateMarkHandler"
              @remove-underline="removeUnderlineHandler"
            ></mark-style-menu>
          </li>
          <li class="selection-menu-item" v-else
            @click="actionHandler($event, 'underline')">
            <div class="menu-item-wrapper">
              <span class="material-symbols-outlined menu-icon">format_color_text</span>
              <span class="menu-item-label">划线</span>
            </div>
          </li>
          <li class="selection-menu-item"
            v-if="mark?.id"
            @click="actionHandler($event, 'viewMark')">
            <div class="menu-item-wrapper">
              <span class="material-symbols-outlined menu-icon">visibility</span>
              <span class="menu-item-label">查看</span>
            </div>
          </li>
          <li class="selection-menu-item"
            @click="actionHandler($event, 'share')">
            <div class="menu-item-wrapper">
              <span class="material-symbols-outlined menu-icon">open_in_new</span>
              <span class="menu-item-label">分享</span>
            </div>
          </li>
        </ul>
      </div>
    </teleport>
    <c-dialog
      :visible="dialog==='thoughtInput'"
      class="thought-input-dialog"
      @close="dialog=null"
    >
      <div class="thought-input-wrapper">
        <span class="material-symbols-outlined thought-icon">record_voice_over</span>
        <c-textarea
          v-if="mark"
          class="thought-input"
          placeholder="写下这一刻的想法"
          ref="input"
          v-model="mark.thought"
          :max-height="90"
        ></c-textarea>
        <button class="save-btn" @click="saveThought">保存</button>
      </div>
    </c-dialog>
    <range-marks-dialog
      :visible="dialog==='marks'"
      @close="dialog=null"
      @mark-removed="markRemovedHandler"
      :book-id="bookId"
      :chapter-id="chapterId"
      :range="marksRange"
    >
    </range-marks-dialog>
  </div>
</template>

<script setup lang="ts">
import { useFloating, offset, shift, arrow } from '@floating-ui/vue';
import CDialog from '@/components/common/CDialog.vue'
import RangeMarksDialog from '@/components/RangeMarksDialog.vue';
import MarkStyleMenu from '@/components/MarkStyleMenu.vue';
import { marks } from '@/services/storage';
import { ChapterMark, MarkColors, MarkStyles } from '@/utils/mark'
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw, useTemplateRef, watch } from 'vue'
import { parseSelectionRange } from '@/utils/chapter';
import CTextarea from '@/components/common/CTextarea.vue';
import Logger from 'js-logger'

const logger = Logger.get('SelectionMenu')

const props = defineProps<{ bookId: number, chapterId: string }>()

const emits = defineEmits<{
  show: [],
  hide: [],
  share: [{ text: string, chapterId: string, chapterIndex: number }]
}>()

const dialog = ref<string | null>(null)
const marksRange = ref<{ start: number, length: number } | null>(null)
const mark = ref<Omit<IMarkEntity, 'id'> & { id?: number } | null>(null)
const reference = ref<{ getBoundingClientRect: () => DOMRect }>()
const floating = useTemplateRef('floating')
const arrowEl = useTemplateRef('floating-arrow')
const { floatingStyles, update: updateMenuRect, middlewareData, update: updateFloating } = useFloating(reference, floating, {
  placement: 'bottom',
  middleware: [offset(12), shift({ padding: 12 }), arrow({ element: arrowEl, padding: 6 })]
});

const contentWrapperRef = useTemplateRef('contentWrapper')
const inputRef = useTemplateRef('input')
const isPointerDown = ref(false)

const visible = computed(() => {
  return !isPointerDown.value && mark.value
})

watch(() => visible.value || dialog.value, (val) => val ? emits('show') : emits('hide'))

logger.info('state', isPointerDown, mark)

onMounted(() => {
  document.addEventListener('selectionchange', selectionChangeHandler)
  registerMutationObserver()
})
onUnmounted(() => {
  document.removeEventListener('selectionchange', selectionChangeHandler)
  unregisterMutationObserver()
})

let observer: MutationObserver | null = null
const chaptersMarks = new WeakMap<HTMLElement, ChapterMark>()
const registerMutationObserver = () => {
  observer = new MutationObserver(() => {
    const chapterEls = contentWrapperRef.value!.querySelectorAll<HTMLElement>('.chapter')
    chapterEls.forEach(chapterEl => {
      if (chaptersMarks.get(chapterEl)) return
      const chapterMark = new ChapterMark(props.bookId, chapterEl.dataset.id!, chapterEl)
      chaptersMarks.set(chapterEl, chapterMark)
      chapterMark.refresh()
    })
  })
  observer.observe(contentWrapperRef.value!, {
    childList: true,
    subtree: true
  })
}
const markRemovedHandler = () => {
  mark.value = null
  refreshMark()
}
const refreshMark = () => {
  contentWrapperRef.value!.querySelectorAll<HTMLElement>('.chapter').forEach((chapterEl) => {
    chaptersMarks.get(chapterEl)?.refresh()
  })
}
const unregisterMutationObserver = () => {
  observer?.disconnect()
}
const selectionChangeHandler = () => {
  logger.info('selectionChangeHandler', window.getSelection()?.toString().length)
  if (dialog.value === 'thoughtInput') return

  const selection = window.getSelection()

  let text = ''
  let range = null

  if (selection?.rangeCount) {
    // 现代浏览器只支持一个range
    range = selection?.getRangeAt(0)
    text = range.toString()

    if (range.startContainer.nodeType !== Node.TEXT_NODE || range.endContainer.nodeType !== Node.TEXT_NODE) {
      text = ''
    }
  }

  if (!range || !text) {
    if (mark.value && !mark.value?.id) {
      mark.value = null
      dialog.value = null
    }
    return;
  }

  const markRange = parseSelectionRange(range)
  logger.info('selection markRange', markRange)
  if (!markRange) return
  const { chapterId, chapterIndex, startOffset, length, start, end } = markRange
  mark.value = {
    bookId: props.bookId,
    chapterId,
    chapterIndex,
    start,
    end,
    range: {
      start: startOffset,
      length
    },
    text,
    thought: '',
    style: MarkStyles.NONE,
    color: MarkColors.YELLOW
  }

  const rect = range.getBoundingClientRect()

  reference.value = {
    getBoundingClientRect() {
      return rect
    },
  };
  updateFloating()
}
const underlineActionHandler = async () => {
  if (!mark.value) return;
  mark.value = {
    ...toRaw(mark.value),
    style: MarkStyles.SOLID,
    color: MarkColors.YELLOW
  }
  const { id, ...rest } = toRaw(mark.value)
  if (id) {
    await marks.update(id, rest)
  } else {
    const id = await marks.add(rest)
    mark.value.id = id as number
  }
  refreshMark()
  window.getSelection()?.empty()
  updateMenuRect()
}
const removeUnderlineHandler = async () => {
  if (!mark.value?.id) return;
  const { thought, id, ...rest } = toRaw(mark.value)
  if (thought) {
    // 有想法的划线，只删除划线，保留想法内容
    await marks.update(id!, { thought, ...rest, style: MarkStyles.NONE, color: MarkColors.YELLOW })
  } else {
    // 没有想法的划线，直接删除
    await marks.remove(id!)
  }
  refreshMark()
  mark.value = null
}
const updateMarkHandler = async (newData: Partial<IMarkEntity>) => {
  if (!mark.value?.id) return
  const newMark = {
    ...toRaw(mark.value),
    ...newData
  }
  await marks.update(mark.value.id, newMark)
  mark.value = newMark
  refreshMark()
}
const thoughtActionHandler = async () => {
  dialog.value = 'thoughtInput'
  // create invisible dummy input to receive the focus first
  const fakeInput = document.createElement('input')
  fakeInput.setAttribute('type', 'text')
  fakeInput.style.position = 'absolute'
  fakeInput.style.opacity = '0'
  fakeInput.style.height = '0'
  fakeInput.style.fontSize = '16px' // disable auto zoom

  // you may need to append to another element depending on the browser's auto
  // zoom/scroll behavior
  document.body.prepend(fakeInput)

  // focus so that subsequent async focus will work
  fakeInput.focus()
  setTimeout(() => {
    inputRef.value!.focus()
    fakeInput.remove()
  }, 300)
}
const saveThought = async () => {
  const { id, ...rest } = toRaw(mark.value!)
  if (id) {
    await marks.update(id, rest)
  } else {
    await marks.add(rest)
  }
  refreshMark()
  dialog.value = null
  updateMenuRect()
}

const pointerUpHandler = () => {
  logger.info('pointerUpHandler')
  isPointerDown.value = false
  updateFloating()
}

const contentTapHandler = async (e: PointerEvent) => {
  logger.info('contentTapHandler', window.getSelection()?.toString().length, mark.value)
  // 等待 selectionchange 事件触发后再显示
  setTimeout(async() => {
    isPointerDown.value = false
    await nextTick()
    updateFloating()
  }, 10)
  // 经过测试，选中文字后，点击取消选择时，在 Mac Chrome 和 Mac Safari 上，selectionchange 会早于 pointerup，而在移动端safari上，selectionchange 会晚于 pointerup 事件。
  // 所以至少在 Mac 上，在此处获取的 selection 选区状态已经是最新的了，而在移动端，此处获取的不一定是最新的(如果是调整选区就是最新的，如果是点击取消选择就不是最新的)
  if (window.getSelection()?.toString()) {
    e.stopPropagation()
    return;
  }
  // if (mark.value) {
  //   dialog.value = null
  //   mark.value = null
  //   e.preventDefault()
  //   e.stopPropagation()
  //   return;
  // }
  const markEl = ((e.target as HTMLElement).nodeName === 'MARK' ? e.target : (e.target as HTMLElement).closest('mark')) as HTMLElement
  if (!markEl) {
    if (mark.value) {
      e.stopPropagation()
      mark.value = null
    }
    return;
  }
  e.preventDefault()
  e.stopImmediatePropagation()
  e.stopPropagation()
  const markValue = await marks.get(parseInt(markEl.dataset.id || '0', 10))
  if (!markValue) return
  mark.value = markValue
  contentWrapperRef.value?.querySelectorAll(`mark[data-id=${JSON.stringify(markValue.id.toString())}]`).forEach(el => {
    el.classList.add('active')
    setTimeout(() => {
      el.classList.remove('active')
    }, 300)
  })
  reference.value = {
    getBoundingClientRect() {
      // 当 mark 跨段落时，可能有不止一个 mark 元素，使用 range 对多个 markEl 的元素位置作合并计算
      const markEls = contentWrapperRef.value!.querySelectorAll(`mark[data-id=${JSON.stringify(markValue.id.toString())}]`)
      const range = document.createRange()
      range.setStart(markEls.item(0).firstChild!, 0)
      range.setEnd(markEls.item(markEls.length - 1).lastChild!, markEls.item(markEls.length - 1).lastChild!.textContent!.length)
      return range.getBoundingClientRect()
    },
  }
  logger.info('isPointerDown', isPointerDown.value)
  if (mark.value.thought) {
    dialog.value = 'marks'
    marksRange.value = mark.value.range
  }
}
const actionHandler = async (event: Event, action: string) => {
  event.preventDefault()
  // action: thought | underline
  if (action === 'underline') {
    underlineActionHandler()
  } else if (action === 'thought') {
    thoughtActionHandler()
  } else if (action === 'viewMark') {
    if (!mark.value?.id) return
    event.stopImmediatePropagation()
    event.stopPropagation()
    dialog.value = 'marks'
    const markValue = await marks.get(mark.value.id)
    mark.value = markValue
    marksRange.value = markValue.range
  } else if (action === 'share' && mark.value?.text) {
    emits('share', mark.value)
    mark.value = null
    window.getSelection()?.empty()
  }
}
</script>

<style lang="scss" scoped>
@keyframes slide-down-scale {
  0% {
    opacity: 0;
    transform: translateY(-60%) scale(1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.selection-menu {
  height: 100%;
  position: relative;
  z-index: 1;
}
.selection-menu .selection-menu-content-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  :deep(mark) {
    transition: text-shadow 0.1s ease;
    &.active {
      text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.5);
    }
  }
}
.selection-menu-list-wrapper {
  z-index: 2;
  user-select: none;
  position: absolute;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  * {
    user-select: none;
  }
  .arrow {
    position: absolute;
    top: -7px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid var(--card-bg-color);
  }
}
@keyframes pulse {
  0% { transform: scale(1) }
  50% { transform: scale(1.1) }
  100% { transform: scale(1) }
}
.selection-menu-list {
  position: relative;
  z-index: 2;
  background: var(--card-bg-color);
  border-radius: 4px;
  list-style: none;
  display: flex;
  justify-content: space-around;
  padding: 0 8px;
  animation: pulse .2s;
}
.selection-menu-list .selection-menu-item {
  position: relative;
  cursor: default;
  pointer-events: auto;
}
.selection-menu-list .selection-menu-item .menu-item-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  padding: 6px 10px;
}
.selection-menu-list .selection-menu-item .menu-item-wrapper > .menu-icon {
  font-size: 20px;
  width: 20px;
}
.selection-menu-list .menu-item-label {
  margin-top: 3px;
  white-space: nowrap;
}

.underline-submenu-list {
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.underline-submenu-item.mark-style .style-icon {
  color: inherit;
}
.underline-submenu-item + .underline-submenu-item {
  margin-left: 8px;
}
.underline-submenu-list .divider {
  width: 2px;
  height: 24px;
  background: #bbb;
  margin: 0 12px;
}

.thought-input-dialog .thought-input-wrapper {
  padding: 12px 0;
  display: flex;
  align-items: flex-end;
  width: auto;
  box-sizing: border-box;
  border-bottom: 1px solid var(--border-color);
  .thought-icon {
    margin-right: 8px;
    font-size: 22px;
    margin-bottom: 8px;
  }
}
.thought-input-dialog .thought-input {
  flex: 1;
  font-size: 16px;
  line-height: 1.4;
}
.thought-input-dialog .save-btn {
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  padding: 0 8px;
  height: 34px;
  line-height: 34px;
  margin-bottom: 1px;
}
</style>
