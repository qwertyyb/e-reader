<template>
  <div class="book-animation" :class="{ animting: direction !== 'none', closing: direction === 'reverse' }">
    <div class="book-anim" ref="bookRef">
      <div class="book-cover book-anim-cover">
        <img class="book-cover-img" :src="cover" :alt="title" />
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

const props = defineProps<{
  cover: string,
  title?: string,
  originalRect: { top: number, left: number, width: number, height: number },
}>();

const direction = ref<'normal' | 'reverse' | 'none'>('normal')

const COVER_SIZE = 100

const centerSize = Math.min(COVER_SIZE * 2, Math.min(window.innerWidth, window.innerHeight) / 2)
const centerScale = Math.min(2, centerSize / window.innerWidth)
const offsetY = window.innerHeight / 2 - window.innerWidth / 3 * 4 / 2

const bookRef = ref<HTMLElement | null>(null)

const calcToRectTransform = () => {
  const { top, left, width, height } = props.originalRect
  const offsetX = left + width / 2 - window.innerWidth / 2
  const offsetY = top + height / 2 - window.innerWidth / 3 * 4 / 2
  const scale = width / window.innerWidth;
  return `scale(${scale}) translate(${offsetX / scale}px, ${offsetY / scale}px)`;
}

const runBookAnimation = async (options: {
  direction: 'normal' | 'reverse',
}) => {
  const bookEl = bookRef.value
  if (!bookEl) return
  // 动画1. 把从书架上拿出来
  const anim1 = async () => {
    await bookEl.animate([
      { transform: calcToRectTransform() },
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

const openBook = async () => {
  direction.value = 'normal'
  await runBookAnimation({ direction: 'normal' })
  direction.value = 'none'
}

const closeBook = async () => {
  direction.value = 'reverse'
  await runBookAnimation({ direction: 'reverse' })
  direction.value = 'none'
}

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
  initial-value: 100vh;
}
@property --cover-rotate {
  syntax: "<angle>";
  inherits: true;
  initial-value: 0deg;
}
.book-animation {
  --read-view-content-height: 100vh;
  --read-view-background-image: url("../assets/text-bg.png");
  width: 100vw;
  position: relative;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  &.animting {
    height: 100vh;
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10;
    transform-style: preserve-3d;
    perspective: 1000px;
    --read-view-content-height: calc(100vw / 3 * 4);
    &.closing {
      --read-view-content-height: 100vh;
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
