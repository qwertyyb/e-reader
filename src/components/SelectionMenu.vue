<template>
<div class="selection-menu">
    <div class="selection-menu-content-wrapper" @click.capture="contentTapHandler" ref="contentWrapper">
      <slot></slot>
    </div>
    <ul class="selection-menu-list" @pointerdown.prevent :style="{top: rect.top + 'px', left: rect.left + 'px'}" v-show="visible">
      <li class="selection-menu-item" @click="actionHandler($event, 'thought')">
        <div class="menu-item-wrapper">
          <span class="material-icons menu-icon">lightbulb</span>
          <span class="menu-item-label">想法</span>
        </div>
      </li>
      <li class="selection-menu-item"
        v-if="selectedMark && selectedMark.type === MarkType.UNDERLINE">
        <div class="menu-item-wrapper"
          @click="actionHandler($event, 'removeUnderline')">
          <span class="material-icons menu-icon">format_underlined</span>
          <span class="menu-item-label">删除划线</span>
        </div>
        <ul class="underline-submenu-list">
          <li class="underline-submenu-item mark-style"
            v-for="style in MarkStyles"
            @click="actionHandler($event, 'update', { style })"
            :style="{color: selectedMark.style === style ? selectedMark.color : ''}"
            :key="style">
            <span class="material-symbols-outlined style-icon">
            {{ MarkStyleIcons[style] }}
            </span>
          </li>
          <li class="divider"></li>
          <li class="underline-submenu-item"
            v-for="color in MarkColors"
            @click="actionHandler($event, 'update', { color })"
            :key="color"
            :style="{background: color}">
            <span class="material-symbols-outlined" v-if="selectedMark.color===color">
            check
            </span>
          </li>
        </ul>
      </li>
      <li class="selection-menu-item"
        v-else
        @click="actionHandler($event, 'underline')">
        <div class="menu-item-wrapper">
          <span class="material-icons menu-icon">format_color_text</span>
          <span class="menu-item-label">划线</span>
        </div>
      </li>
      <li class="selection-menu-item"
        v-if="selectedMark"
        @click="actionHandler($event, 'viewMark')">
        <div class="menu-item-wrapper">
          <span class="material-symbols-outlined menu-icon">visibility</span>
          <span class="menu-item-label">查看</span>
        </div>
      </li>
    </ul>
    <c-dialog :visible="dialog==='thoughtInput'" class="thought-input-dialog" @close="dialog=null">
      <div class="thought-input-wrapper">
        <textarea class="thought-input" placeholder="写下这一刻的想法" ref="input" v-model="mark.thought"></textarea>
        <button class="save-btn" @click="saveThought">保存</button>
      </div>
    </c-dialog>
    <marks-dialog
      :visible="dialog==='marks'"
      @close="dialog=null"
      @mark-removed="markRemovedHandler"
      v-bind="dialogProps">
    </marks-dialog>
  </div>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue'
import { marks } from '@/services/storage';
import { MarkColors, MarkData, MarkStyleIcons, MarkStyles, MarkType } from '@/utils/mark'
import { computed, onMounted, onUnmounted, ref, toRaw, useTemplateRef } from 'vue'

const props = defineProps<{ bookId: number, chapterId: number }>()

const rect = ref({ top: 0, left: 0 })
const dialog = ref<string | null>(null)
const dialogProps = ref({})
const mark = ref<MarkData | null>(null)
const selectedMark = ref<IMarkEntity | null>(null)

const contentWrapperRef = useTemplateRef('contentWrapper')
const inputRef = useTemplateRef('input')

const chapterMark = computed(() => {
  return contentWrapperRef.value!.querySelector(`.chapter[data-id="${this.chapter.id}"]`)?.chapterMark
})
const visible = computed(() {
  return !this.dialog && (this.mark.text || this.selectedMark)
})

onMounted(() => {
  document.addEventListener('selectionchange', this.selectionChangeHandler)
  registerMutationObserver()
})
onUnmounted(() => {
  document.removeEventListener('selectionchange', this.selectionChangeHandler)
  unregisterMutationObserver()
})
let observer: MutationObserver | null = null
const registerMutationObserver = () => {
  observer = new MutationObserver(() => {
    const chapterEls = contentWrapperRef.value!.querySelectorAll<HTMLElement>('.chapter')
    chapterEls.forEach(chapterEl => {
      if (chapterEl.chapterMark) return
      chapterEl.chapterMark = new ChapterMark(this.book.id, chapterEl.dataset.id, chapterEl)
      chapterEl.chapterMark.refresh()
    })
  })
  observer.observe(this.$refs.contentWrapper, {
    childList: true,
    subtree: true
  })
}
const markRemovedHandler = (mark: IMarkEntity) => {
  if (mark.id === selectedMark.value?.id) {
    selectedMark.value = null
  }
  refreshMark()
}
const refreshMark = () => {
  chapterMark.value.refresh()
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

  const md = new MarkData({
    range,
    bookId: props.bookId,
    chapterId: props.chapterId
  })
  mark.value = md

  const { bottom, left, width } = range.getBoundingClientRect()
  selectedMark.value = null
  rect.value = {
    top: bottom + 10,
    left: left + width / 2,
  }
}
const underlineActionHandler = async () => {
  if (!mark.value) return;
  mark.value.type = MarkType.UNDERLINE
  await marks.add({
    ...toRaw(mark.value),
  })
  chapterMark.value.refresh()
  window.getSelection()?.empty()
  mark.value = null
}
const removeUnderlineHandler = async () => {
  await marks.remove(selectedMark.value!.id)
  chapterMark.value.refresh()
  selectedMark.value = null
}
const updateSelectedMarkHandler = async (newData: Partial<IMarkEntity>) => {
  const newMark = {
    ...toRaw(selectedMark.value!),
    ...newData
  }
  await marks.update(selectedMark.value!.id, newMark)
  selectedMark.value = newMark
  chapterMark.value.refresh()
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
},
const saveThought = async () => {
  mark.value!.type = MarkType.THOUGHT
  await marks.add(toRaw(mark.value!))
  chapterMark.value.refresh()
  dialog.value = null
  mark.value!.text = ''
}
const contentTapHandler = async (e: MouseEvent) => {
  selectedMark.value = null
  const markEl = e.target.nodeName === 'MARK' ? e.target : e.target.closest('mark')
  if (!markEl) return
  e.preventDefault()
  e.stopImmediatePropagation()
  e.stopPropagation()
  const mark = await marks.get(parseInt(markEl.dataset.id, 10))
  if (!mark) return
  selectedMark.value = mark
  const { bottom, left, width } = markEl.getBoundingClientRect()
  rect.value = {
    top: bottom + 10,
    left: left + width / 2
  }
  if (mark.type === MarkType.THOUGHT) {
    dialog.value = 'marks'
    dialogProps.value = {
      range: mark.range
    }
  }
}
const actionHandler = async (event: Event, action: string, params: Partial<MarkData>) => {
  event.preventDefault()
  // action: thought | underline
  if (action === 'underline') {
    underlineActionHandler()
  } else if (action === 'thought') {
    thoughtActionHandler()
  } else if (action === 'removeUnderline') {
    removeUnderlineHandler()
  } else if (action === 'viewMark') {
    event.stopImmediatePropagation()
    event.stopPropagation()
    dialog.value = 'marks'
    const mark = await marks.get(selectedMark.value!.id)
    selectedMark.value = mark
    dialogProps.value = {
      range: mark.range
    }
  } else if (action === 'update') {
    updateSelectedMarkHandler(params)
  }
}
</script>
