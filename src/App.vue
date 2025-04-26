<script setup lang="ts">
import { useReadingStore } from '@/stores/reading'
import { RouterView } from 'vue-router'
import UpdateDialog from '@/components/UpdateDialog.vue'
import router from '@/router'

const COVER_SIZE = 100
// 在动画过程中，添加到 read-view 的类名
const BOOK_ANIM_ENABLE_CLASS = 'anim'

// 在进入阅读页面时，添加到 read-view 的类名
const BOOK_ANIM_OPEN_CLASS = 'open-anim'

// 在退出阅读页面时，添加到 read-view 的类名
const BOOK_ANIM_CLOSE_CLASS = 'close-anim'

// 在阅读页面时的动画主体选择器
const BOOK_ANIM_SELECTOR = '.book-anim'
// 动画主体内的封面选择器，用以控制旋转打开或合上封面
const BOOK_COVER_SELECTOR = '.book-anim-cover img'
// 书架上的正在阅读书的封面选择器，用来查询书架上书封面的位置以控制动画从这里开始，或者在这里结束。
const BOOK_SHELF_READING_COVER_SELECTOR = '.book-item.is-reading .book-cover img'

// 书架选择器，用以查询当前是否从书架进入到阅读页面，或者是否从阅读页面进入书架页面
const BOOK_SHELF_SELECTOR = '.book-shelf'
// 访问页面选择器，用以查询当前是否从阅读页面退出，或者是否要从书架进入阅读页面
const BOOK_READ_SELECTOR = '.book-read-view'

const centerSize = Math.min(COVER_SIZE * 2, Math.min(window.innerWidth, window.innerHeight) / 2)
const centerScale = Math.min(2, centerSize / window.innerWidth)
const offsetY = window.innerHeight / 2 - window.innerWidth / 3 * 4 / 2

let removeBookShelf: () => void

const getReadingRect = () => {
  return document.querySelector(BOOK_SHELF_READING_COVER_SELECTOR)?.getBoundingClientRect() ?? new DOMRect(10, 10, COVER_SIZE, COVER_SIZE);
}

const calcToRectTransform = (bookRect: DOMRect) => {
  const { top, left, width, height } = bookRect!
  const offsetX = left + width / 2 - window.innerWidth / 2
  const offsetY = top + height / 2 - window.innerWidth / 3 * 4 / 2
  const scale = width / window.innerWidth;
  return `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;
}

const runBookAnimation = async (bookEl: HTMLElement, options: {
  direction: 'normal' | 'reverse',
}) => {
  // 动画1. 把从书架上拿出来
  const anim1 = async () => {
    await bookEl.animate([
      { transform: calcToRectTransform(getReadingRect()) },
      { transform: `scale(${centerScale}) translate(0, ${offsetY / centerScale}px)` }
    ], { easing: 'ease-in', duration: 600, fill: 'both', direction: options.direction }).finished
  }

  // 动画2. 翻页
  const anim2 = async () => {
    await bookEl.animate([
      { '--cover-rotate': '0deg' },
      { '--cover-rotate': '-180deg' }
    ], { easing: 'ease', duration: 600, fill: 'both', direction: options.direction }).finished
  }

  // 动画3. 缩放书本内容
  const anim3 = async () => {
    await bookEl.animate([
      { transform: `scale(${centerScale}) translate(0, ${offsetY / centerScale}px)` },
      { transform: 'none' },
    ], { duration: 400, easing: 'ease', fill: 'both', direction: options.direction }).finished
  }

  // 动画4. 拉长页面，适配设备高度
  const anim4 = async () => {
    await bookEl.animate([
      { '--read-view-content-height': 'calc(100vw / 3 * 4)' },
      { '--read-view-content-height': '100vh' }
    ], { duration: 200, easing: 'ease', fill: 'both', direction: options.direction }).finished
  }

  const animations = [anim1, anim2, anim3, anim4]
  if (options.direction === 'reverse') {
    animations.reverse()
  }
  for (let i = 0; i < animations.length; i += 1) {
    await animations[i]()
  }
}

const openBook = async (bookEl: HTMLElement) => {
  // 先隐藏掉书架上的书
  const shelfBookCover = document.querySelector<HTMLImageElement>(BOOK_SHELF_READING_COVER_SELECTOR)
  if (shelfBookCover) {
    shelfBookCover.style.opacity = '0'
    bookEl.querySelector<HTMLImageElement>(BOOK_COVER_SELECTOR)?.setAttribute('src', shelfBookCover.src)
  }

  await runBookAnimation(bookEl, { direction: 'normal' })
}

// 在 leave 钩子之前调用
// 大多数时候，你应该只会用到 leave 钩子
function onBeforeLeave(el: Element) {
  if (el.matches(BOOK_READ_SELECTOR)) {
    // 退出阅读界面，设置初始状态
    el.classList.add(BOOK_ANIM_ENABLE_CLASS, BOOK_ANIM_CLOSE_CLASS)
  }
}

// 在离开过渡开始时调用
// 用这个来开始离开动画
async function onLeave(el: Element, done: () => void) {
  // 调用回调函数 done 表示过渡结束
  // 如果与 CSS 结合使用，则这个回调是可选参数
  if (el.matches(BOOK_READ_SELECTOR) && router.currentRoute.value.name === 'local') {
    // 从阅读页面退出，运行关书动画
    await runBookAnimation(el.querySelector<HTMLElement>(BOOK_ANIM_SELECTOR)!, {
      direction: 'reverse'
    })
    useReadingStore().clear()
    return done()
  }

  const reading = el.querySelector<HTMLElement>(BOOK_SHELF_READING_COVER_SELECTOR)
  if (!reading) return done()
  removeBookShelf = done
}

// 在元素被插入到 DOM 之前被调用
// 用这个来设置元素的 "enter-from" 状态
function onBeforeEnter(el: Element) {
  if (el.matches(BOOK_READ_SELECTOR) && document.querySelector(BOOK_SHELF_SELECTOR)) {
    // 设置阅读页面的初始状态
    const animBook = el.querySelector<HTMLElement>(BOOK_ANIM_SELECTOR)
    // 添加类名
    el.classList.add(BOOK_ANIM_ENABLE_CLASS, BOOK_ANIM_OPEN_CLASS);

    animBook?.style.setProperty('transform', calcToRectTransform(getReadingRect()))
  }
}

// 在元素被插入到 DOM 之后的下一帧被调用
// 用这个来开始进入动画
async function onEnter(el: Element, done: () => void) {
  // 调用回调函数 done 表示过渡结束
  // 如果与 CSS 结合使用，则这个回调是可选参数
  if (el.matches(BOOK_READ_SELECTOR) && document.querySelector(BOOK_SHELF_SELECTOR)) {
    // 从书架页到书本页
    const readView = el.querySelector<HTMLElement>(BOOK_ANIM_SELECTOR)!
    await openBook(readView)
    el.classList.remove(BOOK_ANIM_ENABLE_CLASS, BOOK_ANIM_OPEN_CLASS)
    // 开书动画执行完毕，可以移除书架了
    removeBookShelf()
    done()
  } else {
    done()
  }
}

</script>

<template>
  <div class="root-app">
    <router-view v-slot="{ Component }">
      <transition
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @before-leave="onBeforeLeave"
        @leave="onLeave"
        :css="false"
      >
        <component :is="Component" />
      </transition>
    </router-view>
    <update-dialog></update-dialog>
  </div>
</template>

<style lang="scss" scoped>
.root-app {
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
}

</style>
