interface IGestureDetail {
  type: 'start' | 'move' | 'end'
  startX: number
  startY: number
  deltaX: number
  deltaY: number
  velocityX: number
  velocityY: number
}

export interface IGestureOptions {
  el: HTMLElement
  onStart?: (detail: IGestureDetail) => boolean | void
  onMove?: (detail: IGestureDetail) => void
  onEnd?: (detail: IGestureDetail) => void
}


export const createGesture = (options: IGestureOptions) => {
  const { el, onStart, onMove, onEnd } = options
  const startInfo = {
    startTime: 0,
    startX: 0, startY: 0,
    touching: false,
    preventTouchMove: null as (boolean | null)
  }

  const pointerDownHandler = (event: PointerEvent) => {
    startInfo.startX = event.screenX
    startInfo.startY = event.screenY
    startInfo.startTime = Date.now()
    startInfo.touching = false
    startInfo.preventTouchMove = null
    const shouldStart = onStart?.({
      type: 'start',
      startX: startInfo.startX,
      startY: startInfo.startY,
      deltaX: event.screenX - startInfo.startX,
      deltaY: event.screenY - startInfo.startY,
      velocityX: (event.screenX - startInfo.startX) / (Date.now() - startInfo.startTime),
      velocityY: (event.screenY - startInfo.startY) / (Date.now() - startInfo.startTime)
    })
    startInfo.touching = shouldStart !== false
  }
  const pointerMoveHandler = (event: PointerEvent) => {
    // 如果手势未开始，则无须执行回调
    if (!startInfo.touching || startInfo.preventTouchMove === false) return;

    if (startInfo.preventTouchMove === null) {
      startInfo.preventTouchMove = Math.abs(event.screenX - startInfo.startX) > Math.abs(event.screenY - startInfo.startY)
    }

    // 如果滑动的方向不是横向，即 needPreventTouchMove 为 false, 则无须执行回调
    if (!startInfo.preventTouchMove) return;
    onMove?.({
      type: 'move',
      startX: startInfo.startX,
      startY: startInfo.startY,
      deltaX: event.screenX - startInfo.startX,
      deltaY: event.screenY - startInfo.startY,
      velocityX: (event.screenX - startInfo.startX) / (Date.now() - startInfo.startTime),
      velocityY: (event.screenY - startInfo.startY) / (Date.now() - startInfo.startTime)
    })
  }
  const touchMoveHandler = (event: TouchEvent) => {
    if (startInfo.preventTouchMove) {
      event.preventDefault()
    }
  }
  const pointerUpOrCancelHandler = (event: PointerEvent) => {
    if (!startInfo.touching || !startInfo.preventTouchMove) return;
    onEnd?.({
      type: 'end',
      startX: startInfo.startX,
      startY: startInfo.startY,
      deltaX: event.screenX - startInfo.startX,
      deltaY: event.screenY - startInfo.startY,
      velocityX: (event.screenX - startInfo.startX) / (Date.now() - startInfo.startTime),
      velocityY: (event.screenY - startInfo.startY) / (Date.now() - startInfo.startTime)
    })
    startInfo.touching = false
    startInfo.preventTouchMove = null
  }

  el.addEventListener('pointerdown', pointerDownHandler)
  el.addEventListener('pointermove', pointerMoveHandler)
  el.addEventListener('touchmove', touchMoveHandler)
  el.addEventListener('pointerup', pointerUpOrCancelHandler)
  el.addEventListener('pointercancel', pointerUpOrCancelHandler)
  return {
    clean() {
      el.removeEventListener('pointerdown', pointerDownHandler)
      el.removeEventListener('pointermove', pointerMoveHandler)
      el.removeEventListener('touchmove', touchMoveHandler)
      el.removeEventListener('pointerup', pointerUpOrCancelHandler)
      el.removeEventListener('pointercancel', pointerUpOrCancelHandler)
    }
  }
}
