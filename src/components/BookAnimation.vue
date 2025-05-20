<template>
  <div class="book-animation" :class="{ animting: direction !== 'none', closing: direction === 'reverse' }">
    <div class="book-anim">
      <div class="book-cover book-anim-cover">
        <img class="book-cover-img" :src="animData.cover" :alt="animData.title" />
        <div class="book-cover-backface"></div>
      </div>
      <div class="book-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { animData, setWait } from '@/stores/bookAnim';

const direction = ref<'normal' | 'reverse' | 'none'>('normal')

const COVER_SIZE = 100

const centerSize = Math.min(COVER_SIZE * 2, Math.min(window.innerWidth, window.innerHeight) / 2)
const centerScale = Math.min(2, centerSize / window.innerWidth)
const offsetY = window.innerHeight / 2 - window.innerWidth / 3 * 4 / 2

const getOriginalRect = () => {
  return document.querySelector(`[data-book-trace=${JSON.stringify(animData.value.trace)}] .book-cover img`)?.getBoundingClientRect() || {
    top: (window.innerHeight - COVER_SIZE / 3 * 4) / 2,
    left: (window.innerWidth - COVER_SIZE) / 2,
    width: COVER_SIZE,
    height: COVER_SIZE / 3 * 4,
  }
}

const calcToRectTransform = () => {
  const { top, left, width, height } = getOriginalRect()
  const offsetX = left + width / 2 - window.innerWidth / 2
  const offsetY = top + height / 2 - window.innerWidth / 3 * 4 / 2
  const scale = width / window.innerWidth;
  return `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;
}

const runBookAnimation = async (options: {
  direction: 'normal' | 'reverse',
}) => {
  const mask = document.querySelector('.book-animation')
  const bookEl = document.querySelector('.book-animation > .book-anim')
  if (!bookEl || !mask) return

  // 动画1. 把从书架上拿出来
  const anim1 = async () => {
    await Promise.all([
      bookEl.animate([
        { transform: calcToRectTransform() },
        { transform: `scale(${centerScale}) translate(0, ${offsetY / centerScale}px)` }
      ], { easing: 'ease-in', duration: 600, fill: 'both', direction: options.direction }).finished,
      // 背景渐入
      mask.animate([
        { backgroundColor: 'rgba(0,0,0,0)' },
        { backgroundColor: 'rgba(0,0,0,0.65)' }
      ], { easing: 'ease-in', duration: 400, fill: 'both', direction: options.direction }).finished
    ])
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
      { '--read-view-content-height': '100dvh' }
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

const { promise: waitOpen, resolve: openDone } = Promise.withResolvers<void>()
const { promise: waitClose, resolve: closeDone } = Promise.withResolvers<void>()

const openBook = async () => {
  direction.value = 'normal'
  await runBookAnimation({ direction: 'normal' })
  direction.value = 'none'
  openDone()
}

const closeBook = async () => {
  direction.value = 'reverse'
  await runBookAnimation({ direction: 'reverse' })
  direction.value = 'none'
  closeDone()
}

setWait({ waitOpen, waitClose })

onMounted(() => {
  openBook()
})

defineExpose({
  openBook,
  closeBook,
})
</script>

<style lang="scss" scoped>
@property --read-view-content-height {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 100dvh;
}
@property --cover-rotate {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
.book-animation {
  --read-view-content-height: var(--page-height);
  --read-view-background-image: url("../assets/text-bg.png");
  width: 100vw;
  position: relative;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  &.animting {
    height: var(--page-height);
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0);
    z-index: 10;
    transform-style: preserve-3d;
    perspective: 1000px;
    --read-view-content-height: calc(100vw / 3 * 4);
    &.closing {
      --read-view-content-height: var(--page-height);
      --cover-rotate: -180deg;
    }
    .book-anim {
      width: 100vw;
      height: var(--read-view-content-height);
      perspective: 140vw;
    }
    .book-content {
      aspect-ratio: 3 / 4;
    }
    .book-cover {
      display: block;
    }
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
  :global(html.dark-mode .book-animation .book-cover .book-cover-backface) {
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
.book-content {
  width: 100%;
  position: relative;
  z-index: 0;
  height: var(--read-view-content-height);
  overflow: hidden;
}
</style>
