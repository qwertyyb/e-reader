import CPicker from '@/components/common/CPicker.vue'
import jschardet from 'jschardet'
import { createApp, h, ref } from 'vue'

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

export const dirPath = (filePath: string) => {
  const arr = filePath.split('/')
  arr.pop()
  return arr.join('/')
}

export const pathJoin = (base: string, relativePath: string) => {
  if (relativePath.startsWith('/')) return relativePath
  if (!base) return relativePath
  return `${base}/${relativePath}`
}

export const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const downloadWithProgress = async (url: string, onUpdate?: (progress: number, total: number) => void) => {
  const response = await fetch(url)
  const total = Number(response.headers.get('Content-Length')) || 0
  const result = []
  let progress = 0
  const reader = response.body!.getReader()
  while(true) {
    const { done, value } = await reader.read()
    if (done) {
      break;
    }
    result.push(value)
    progress += value.length
    onUpdate?.(progress, total)
  }

  const data = new Uint8Array(progress)

  let position = 0
  result.forEach(item => {
    data.set(item, position)
    position += item.length
  })

  return data
}

export const decodeText = (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 10000));
  let binary = ''
  bytes.forEach(item => {
    binary += String.fromCharCode(item)
  })
  const { encoding } = jschardet.detect(binary)
  const decoder = new TextDecoder(encoding, { fatal: true })
  try {
    return decoder.decode(arrayBuffer).replace(/\r\n/g, '\n')
  } catch {
    throw new Error('解码失败')
  }
}

export const showPicker = (() => {
  const pickerOptions = ref<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: { label: string, value: any }[]
    visible: boolean,
    title?: string,
    onClose: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSelect: (option: { label: string, value: any }) => void
  } | null>(null)
  return <V extends string = string>(
    options: { label: string, value: V }[],
    config?: { title: string }
  ) => {
    return new Promise<V>((resolve, reject) => {
      if (pickerOptions.value) {
        pickerOptions.value = {
          options,
          visible: true,
          title: config?.title,
          onClose: () => {
            pickerOptions.value!.visible = false
            reject(new Error('user cancel'));
          },
          onSelect: (option: { label: string, value: V }) => resolve(option.value)
        }
      } else {
        pickerOptions.value = {
          options,
          visible: false,
          title: config?.title,
          onClose: () => {
            pickerOptions.value!.visible = false
            reject(new Error('user cancel'));
          },
          onSelect: (option: { label: string, value: string | number }) => resolve(option.value as V)
        }
        const app = createApp({
          render: () => h(CPicker<V>, pickerOptions.value)
        })
        const div = document.createElement('div')
        document.body.appendChild(div)
        app.mount(div)
        pickerOptions.value.visible = true
      }
    })
  }
})()
