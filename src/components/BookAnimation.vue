<template>
  <div class="book-animation" :class="{ animting: !noAnim && direction !== 'none', closing: !noAnim && direction === 'reverse' }">
    <div class="book-anim">
      <div class="book-cover book-anim-cover">
        <img class="book-cover-img" :src="animData.cover || book?.cover" :alt="animData.title" />
        <div class="book-cover-backface"></div>
      </div>
      <div class="book-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, shallowRef, type Ref } from 'vue';
import { disableAnim } from '@/utils/env';
import { useRoute } from 'vue-router';
import { useWindowSize } from '@/hooks/windowSize';

const route = useRoute()

const book = inject<Ref<ILocalBook>>('book')

const animData = shallowRef({ cover: '', title: '' })

const noAnim = computed(() => {
  return disableAnim.value || route.query.noAnim
})

const direction = ref<'normal' | 'reverse' | 'none'>('normal')

/**
 * 在手机屏幕场景中，默认状态为书打开状态，书封那一半在屏幕之外。
 * 
 * 在宽屏场景中，默认状态为书打开状态，书封那一半在屏幕左半边。
 */

const COVER_SIZE = 100

const centerSize = Math.min(COVER_SIZE * 3, Math.min(window.innerWidth, window.innerHeight) / 2)
const centerScale = Math.min(3, centerSize / window.innerWidth)

console.log(centerSize, centerScale)

const { isSmall } = useWindowSize()

const getOriginalRect = (origin?: HTMLElement | null) => {
  return origin?.getBoundingClientRect() || {
    top: (window.innerHeight - COVER_SIZE / 3 * 4) / 2,
    left: (window.innerWidth - COVER_SIZE) / 2,
    width: COVER_SIZE,
    height: COVER_SIZE / 3 * 4,
  }
}

const calcToOriginTransform = (origin?: HTMLElement | null) => {
  const { top, left, width } = getOriginalRect(origin)
  if (isSmall.value) {
    const offsetX = left + width / 2 - window.innerWidth / 2
    const offsetY = top
    const scale = width / window.innerWidth;
    return {
      offsetX,
      offsetY,
      scale
    }
  }
  const offsetX = left - window.innerWidth / 2
  const offsetY = top
  const scale = width * 2 / window.innerWidth
  return {
    offsetX,
    offsetY,
    scale,
  }
}

const runBookAnimation = async (options: {
  direction: 'normal' | 'reverse',
  origin?: HTMLElement | null
}) => {
  const mask = document.querySelector('.book-animation')
  const bookEl = document.querySelector<HTMLElement>('.book-animation > .book-anim')
  const bookContent = document.querySelector<HTMLElement>('.book-animation > .book-anim > .book-content')
  const bookCover = document.querySelector<HTMLElement>('.book-animation > .book-anim > .book-cover')
  const bookCoverImg = document.querySelector<HTMLElement>('.book-animation > .book-anim > .book-cover > .book-cover-img');
  if (!bookEl || !mask || !bookContent) return

  const originTransform = calcToOriginTransform(options.origin)
  const centerOffsetY = window.innerHeight / 2 - centerScale * window.innerHeight / 2

  // 动画1. 把从书架上拿出来
  const anim1 = async () => {
    const windowRatio = window.innerWidth / 2 / window.innerHeight;
    let expectRatio = 1;
    if (windowRatio > 3 / 4) {
      // 屏幕比较宽，高度会超出,高度占满，把封面图往两边延伸
    } else if (windowRatio < 3 / 4 && !isSmall.value) {
      // 屏幕比较高，高度占满，封面图往两边延伸
      expectRatio = window.innerHeight * COVER_SIZE / window.innerWidth * 2 / (COVER_SIZE / 3 * 4)
    }
    bookContent.style.opacity = '0'
    await Promise.all([
      bookEl.animate([
        { transform: `translate(${originTransform.offsetX}px, ${originTransform.offsetY}px) scale(${originTransform.scale})` },
        { transform: `translate(0, ${centerOffsetY}px) scale(${centerScale}) ` }
      ], { easing: 'ease-in', duration: 600, fill: 'both', direction: options.direction }).finished,
      // 背景渐入
      mask.animate([
        { backgroundColor: 'rgba(0,0,0,0)' },
        { backgroundColor: 'rgba(0,0,0,0.65)' }
      ], { easing: 'ease-in', duration: 400, fill: 'both', direction: options.direction }).finished,
      // 封面图尺寸拉到和屏幕宽高比一致
      bookCoverImg?.animate([
        { transform: 'translateZ(2px)' },
        { transform: `translateZ(2px) scale(${expectRatio})`}
      ], { easing: 'ease-in', duration: 600, fill: 'both', direction: options.direction }).finished
    ])
  }

  // 动画2. 翻页
  const anim2 = async () => {
    if (options.direction === 'normal') {
      bookContent.style.opacity = '1'
    }
    await bookCover?.animate([
      { 'transform': 'rotateY(0deg)' },
      { 'transform': 'rotateY(-180deg)' },
    ], { easing: 'ease', duration: 600, fill: 'both', direction: options.direction }).finished
    if (options.direction === 'reverse') {
      bookContent.style.opacity = '0'
    }
  }

  // 动画3. 缩放书本内容
  const anim3 = async () => {
    await bookEl.animate([
      { transform: `translate(0, ${centerOffsetY}px) scale(${centerScale}) ` },
      { transform: 'none' },
    ], { duration: 400, easing: 'ease', fill: 'both', direction: options.direction }).finished
  }

  // 动画4. 拉长页面，适配设备高度
  const anim4 = async () => {
    if (isSmall.value) {
      await bookEl.animate([
        { '--read-view-content-height': 'calc(100vw / 3 * 4)' },
        { '--read-view-content-height': '100dvh' }
      ], { duration: 200, easing: 'ease', fill: 'both', direction: options.direction }).finished
    }
  }

  const animations = [anim1, anim2, anim3, anim4]
  if (options.direction === 'reverse') {
    animations.reverse()
  }

  for (let i = 0; i < animations.length; i += 1) {
    await animations[i]()
  }
}


const openBook = async (from?: HTMLImageElement | null) => {
  animData.value = {
    cover: from?.src || '',
    title: from?.title || from?.alt || ''
  }
  if (noAnim.value) {
    return
  }
  direction.value = 'normal'
  await runBookAnimation({ direction: 'normal', origin: from })
  direction.value = 'none'
}

const closeBook = async (to?: HTMLElement | null) => {
  if (noAnim.value) {
    return
  }
  direction.value = 'reverse'
  await runBookAnimation({ direction: 'reverse', origin: to })
  direction.value = 'none'
}

defineExpose({
  openBook,
  closeBook,
})
</script>

<style lang="scss" scoped>
@use "../styles/variables";

@property --read-view-content-height {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 100dvh;
}
@property --content-translate-x {
  syntax: "<length-percentage>";
  inherits: true;
  initial-value: 0;
}
@property --cover-rotate {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
.book-animation {
  --read-view-content-height: var(--page-height);
  --read-view-background-image: url("../assets/text-bg.png");
  width: 100dvw;
  height: 100dvh;
  position: relative;
  background: var(--bg-color);
  &.animting {
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
      width: 100dvw;
      height: 100dvh;
      perspective: 140vw;
    }
    .book-cover {
      display: block;
    }
  }
}
.book-anim {
  transform-origin: top center;
}
.book-cover {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  transform-origin: left;
  transform: rotateY(var(--cover-rotate));
  display: none;
  transform-style: preserve-3d;
  transition: --cover-rotate .2s;
  .book-cover-backface {
    backface-visibility: hidden;
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background-color: var(--bg-color);
    background-image: var(--read-view-background-image);
    background-size: cover;
    transform: rotateY(-180deg);
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
  background-color: var(--bg-color);
  background-size: cover;
  transform: translateX(var(--content-translate-x));
  .book-content-main {
    height: 100%;
    overflow: hidden;
    width: 100%;
  }
}


@media (width > variables.$MAX_SMALL_WIDTH) {
  .book-animation.animting {
    .book-cover {
      left: 50vw;
      width: 50%;
      height: 100dvh;
      .book-cover-img {
        transform-origin: top;
      }
    }
    .book-content {
      --read-view-content-height: 100dvh;
      clip-path: xywh(50% 0 50% 100%);
    }
  }
}
</style>
