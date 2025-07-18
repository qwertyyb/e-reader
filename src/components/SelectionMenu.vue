<template>
  <div class="selection-menu">
    <div class="selection-menu-content-wrapper" @pointerdown.capture="pointerdownHandler" @pointerup.capture="contentTapHandler" ref="contentWrapper">
      <slot></slot>
    </div>
    <div class="selection-menu-list-wrapper"
      @pointerdown.prevent
      :style="floatingStyles"
      v-if="visible"
      ref="floating">
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
import { useFloating, offset, shift } from '@floating-ui/vue';
import CDialog from '@/components/common/CDialog.vue'
import RangeMarksDialog from '@/components/RangeMarksDialog.vue';
import MarkStyleMenu from '@/components/MarkStyleMenu.vue';
import { marks } from '@/services/storage';
import { ChapterMark, MarkColors, MarkStyles } from '@/utils/mark'
import { computed, onMounted, onUnmounted, ref, toRaw, useTemplateRef, watch } from 'vue'
import { parseSelectionRange } from '@/utils/chapter';
import CTextarea from '@/components/common/CTextarea.vue';

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
const floating = ref(null);
const { floatingStyles, update: updateMenuRect } = useFloating(reference, floating, { placement: 'bottom', middleware: [offset(12), shift({ padding: 12 })] });

const contentWrapperRef = useTemplateRef('contentWrapper')
const inputRef = useTemplateRef('input')

const visible = computed(() => {
  return !dialog.value && mark.value
})

watch(() => visible.value || dialog.value, (val) => val ? emits('show') : emits('hide'))

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
  if (dialog.value === 'thoughtInput') return

  const selection = window.getSelection()
  if (!selection) return

  let text = ''
  let range = null

  if (selection.rangeCount) {
    // 现代浏览器只支持一个range
    range = selection.getRangeAt(0)
    text = range.toString()

    if (range.startContainer.nodeType !== Node.TEXT_NODE || range.endContainer.nodeType !== Node.TEXT_NODE) {
      text = ''
    }
  }

  if (!range) return

  if (!text) return

  const markRange = parseSelectionRange(range)
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

const pointerdownHandler = (e: PointerEvent) => {
  mark.value = null
  const markEl = ((e.target as HTMLElement).nodeName === 'MARK' ? e.target : (e.target as HTMLElement).closest('mark')) as HTMLElement
  if (!markEl) return
  e.preventDefault()
  e.stopImmediatePropagation()
  e.stopPropagation()
}

const contentTapHandler = async (e: MouseEvent) => {
  const markEl = ((e.target as HTMLElement).nodeName === 'MARK' ? e.target : (e.target as HTMLElement).closest('mark')) as HTMLElement
  if (!markEl) return
  e.preventDefault()
  e.stopImmediatePropagation()
  e.stopPropagation()
  const markValue = await marks.get(parseInt(markEl.dataset.id || '0', 10))
  if (!markValue) return
  mark.value = markValue
  const rect = markEl.getBoundingClientRect()
  reference.value = {
    getBoundingClientRect() {
      return rect
    },
  }
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
}
.selection-menu-list-wrapper {
  position: relative;
  z-index: 2;
  user-select: none;
  * {
    user-select: none;
  }
}

.selection-menu .selection-menu-list {
  position: relative;
  z-index: 2;
  background: light-dark(#fff, #000);
  border-radius: 12px;
  list-style: none;
  display: flex;
  box-shadow: 0 3px 7px light-dark(#ddd, #2a2a2a);
  justify-content: space-around;
  padding: 0 8px;
  animation: slide-down-scale .2s ease;
  pointer-events: none;
}
.selection-menu .selection-menu-list .selection-menu-item {
  position: relative;
  cursor: default;
  pointer-events: auto;
}
.selection-menu .selection-menu-list .selection-menu-item .menu-item-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  padding: 6px 10px;
}
.selection-menu .selection-menu-list .selection-menu-item .menu-item-wrapper > .menu-icon {
  font-size: 20px;
}
.selection-menu .selection-menu-list .menu-item-label {
  margin-top: 3px;
  white-space: nowrap;
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
