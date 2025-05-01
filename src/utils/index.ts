export const formatSize = (size: number) => {
  const kB = size / 1024
  const mB = kB / 1024

  if (kB < 512) {
    return kB.toFixed(2) + 'KB'
  }
  return mB.toFixed(2) + 'MB'
}

export const showToast = (msg: string, duration = 1500) => {
  const div = document.createElement('div')
  div.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100;border:1px solid #000;border-radius:4px;padding:4px 10px;background:#000;color:#fff;'
  div.innerHTML = msg
  document.body.append(div)
  setTimeout(() => {
    div.remove()
  }, duration)
}

export const getNearestTopEl = (els: HTMLElement[] | HTMLCollection): HTMLElement | null => {
  const el = Array.from(els)
    .reverse()
    .find((el) => {
      const { top, left } = el.getBoundingClientRect()
      return top < 0 || left < 0
    }) || els[0]
  if (!el) return null
  if (!el.children.length) return el as HTMLElement
  return getNearestTopEl(el.children)
}

export const debounce = <F extends (...args: unknown[]) => unknown>(fn: F, duration: number = 200) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(fn, duration, ...args)
  }
}
