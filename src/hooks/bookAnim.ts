import { ref, shallowRef } from "vue";

const defaultBookWrapperStyle: Record<string, number | string> = {
  height: '100vh',
  position: 'fixed',
  top: 0,
  right: 0,
  left: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  zIndex: 10,
  transformStyle: 'preserve-3d',
  perspective: '1000px',
  '--read-view-content-height': 'calc(100vw / 3 * 4)',
}

export const useBookAnim = () => {
  const COVER_SIZE = 100

  const centerSize = Math.min(COVER_SIZE * 2, Math.min(window.innerWidth, window.innerHeight) / 2)
  const centerScale = Math.min(2, centerSize / window.innerWidth)
  const offsetY = window.innerHeight / 2 - window.innerWidth / 3 * 4 / 2

  const bookRef = ref<HTMLElement | null>(null)
  const bookWrapperStyle = ref<Record<string, number | string>>({})

  const setWrapperInitialCloseStyle = () => {
    bookWrapperStyle.value = {
      ...defaultBookWrapperStyle,
      '--read-view-content-height': '100vh',
      '--cover-rotate': '-180deg'
    }
  }

  const originalRect = shallowRef({ left: 0, top: 0, width: 100, height: 133 });

  const calcToRectTransform = () => {
    const { top, left, width, height } = originalRect.value
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
    bookWrapperStyle.value = { ...defaultBookWrapperStyle}
    await runBookAnimation({ direction: 'normal' })
    bookWrapperStyle.value = {}
  }

  const closeBook = async () => {
    setWrapperInitialCloseStyle()
    await runBookAnimation({ direction: 'reverse' })
  }

  return { bookRef, originalRect, openBook, closeBook }
}
