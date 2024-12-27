<script setup lang="ts">
import { useReadingStore } from '@/stores/reading'
import { RouterView } from 'vue-router'

let bookRect: DOMRect | null

let initialScale = 1

const COVER_SIZE = 100

let leaveCb: () => void

const getReadingRect = () => {
  return document.querySelector('.book-item.is-reading .book-cover')?.getBoundingClientRect() ?? new DOMRect(100, 100, 0, 0);
}

const calcToRectTransform = (bookRect: DOMRect) => {
  const { top, left, width, height } = bookRect!
  const offsetX = left + width / 2 - window.innerWidth / 2
  const offsetY = top + height / 2 - window.innerWidth / 3 * 4 / 2
  const scale = width / window.innerWidth;
  return `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;
}

// 在元素被插入到 DOM 之前被调用
// 用这个来设置元素的 "enter-from" 状态
function onBeforeEnter(el: Element) {
  if (el.classList.contains('read-view') && bookRect) {
    const readView = el.querySelector<HTMLElement>('div.open-book-anim')!
    // 设置初始位置
    el.classList.add('anim');

    const { top, left, width, height } = bookRect!
    const offsetX = left + width / 2 - window.innerWidth / 2
    const offsetY = top + height / 2 - window.innerWidth / 3 * 4 / 2
    const scale = COVER_SIZE / window.innerWidth;
    initialScale = scale
    readView.style.transform = `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;
  }
}

const openBook = async (bookEl: HTMLElement, originRect: DOMRect) => {
  // 动画1. 把从书架上拿出来
  const targetScale = Math.min(window.innerWidth / 2 / originRect.width * initialScale, 2)
  const offsetY = window.innerHeight / 2 - window.innerWidth / 3 * 4 / 2
  await bookEl.animate([
    { transform: bookEl.style.transform },
    { transform: `scale(${targetScale}) translate(0, ${offsetY / targetScale}px)` }
  ], { easing: 'ease', duration: 400, fill: 'both' }).finished

  // 动画2. 翻页
  const cover = bookEl.querySelector<HTMLElement>('.open-book-anim-cover')!
  await cover.animate([
    { transform: 'rotateY(0)' },
    { transform: 'rotateY(-180deg)' }
  ], { easing: 'ease', duration: 600, fill: 'both' }).finished

  // 动画3. 缩放书本内容
  await bookEl.animate([
    { transform: `scale(${targetScale}) translate(0, ${offsetY / targetScale}px)` },
    { transform: 'none' },
  ], { duration: 400, easing: 'ease', fill: 'both' }).finished

  // 动画4. 拉长页面，适配设备高度
  await bookEl.animate([
    { height: 'calc(100vw / 3 * 4)' },
    { height: '100vh' }
  ], { duration: 200, easing: 'ease' }).finished
}

const closeBook = async (bookEl: HTMLElement) => {
  // 动画4. 缩短书页高度。
  await bookEl.animate([
    { height: 'calc(100vw / 3 * 4)' },
    { height: '100vh' }
  ], { duration: 200, easing: 'ease', direction: 'reverse', fill: 'both' }).finished

  // 动画3. 缩放书本内容
  const offsetY = window.innerHeight / 2 - window.innerWidth / 3 * 4 / 2
  const targetScale = Math.min(window.innerWidth / 2 / COVER_SIZE * (COVER_SIZE / window.innerWidth), 2)
  await bookEl.animate([
    { transform: `scale(${targetScale}) translate(0, ${offsetY / targetScale}px)` },
    { transform: 'none' },
  ], { duration: 400, easing: 'ease', direction: 'reverse', fill: 'both' }).finished

  // 动画2. 翻开书封面
  const cover = bookEl.querySelector<HTMLElement>('.open-book-anim-cover')!
  await cover.animate([
    { transform: 'rotateY(0)' },
    { transform: 'rotateY(-180deg)' }
  ], { easing: 'ease', duration: 600, direction: 'reverse', fill: 'both' }).finished

  await bookEl.animate([
    { transform: calcToRectTransform(getReadingRect()) },
    { transform: `scale(${targetScale}) translate(0, ${offsetY / targetScale}px)` }
  ], { easing: 'ease', duration: 400, direction: 'reverse', fill: 'both' }).finished
}

// 在元素被插入到 DOM 之后的下一帧被调用
// 用这个来开始进入动画
async function onEnter(el: Element, done: () => void) {
  // 调用回调函数 done 表示过渡结束
  // 如果与 CSS 结合使用，则这个回调是可选参数
  if (!el.classList.contains('read-view') || !bookRect) return done();
  const readView = el.querySelector<HTMLElement>('div.open-book-anim')!
  await openBook(readView, bookRect)
  el.classList.remove('anim')
  leaveCb()
  done()
}

// 在 leave 钩子之前调用
// 大多数时候，你应该只会用到 leave 钩子
function onBeforeLeave(el: Element) {
  if (el.classList.contains('read-view') && bookRect) {
    el.classList.add('anim')
    el.querySelector<HTMLElement>('.open-book-anim')!.style.height = '100vh'
  }
}

// 在离开过渡开始时调用
// 用这个来开始离开动画
async function onLeave(el: Element, done: () => void) {
  // 调用回调函数 done 表示过渡结束
  // 如果与 CSS 结合使用，则这个回调是可选参数
  if (el.classList.contains('read-view') && bookRect) {
    await closeBook(el.querySelector<HTMLElement>('.open-book-anim')!, bookRect)
    useReadingStore().clear()
    return done()
  }

  const reading = el.querySelector<HTMLElement>('.book-item.is-reading .book-cover')
  if (!reading) return done()
  bookRect = reading.getBoundingClientRect()
  leaveCb = done
}

</script>

<template>
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
</template>

<style lang="scss" scoped>
</style>
