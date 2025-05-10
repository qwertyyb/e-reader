import type { Directive } from "vue";

export const click: Directive = {
  mounted(el, binding) {
    el.addEventListener('pointerdown', () => {
      el.dataset.pointerdownTime = Date.now().toString()
    })
    el.addEventListener('pointermove', () => {
      el.dataset.pointerdownTime = '0'
    })
    el.addEventListener('pointerup', () => {
      const pointerdownTime = Number(el.dataset.pointerdownTime)
      if (pointerdownTime && Date.now() - pointerdownTime < 200) {
        binding.value()
      }
    })
  }
}

export const longtap: Directive = {
  mounted(el, binding) {
    el.addEventListener('pointerdown', (event: PointerEvent) => {
      event.preventDefault()
      el.longtapTimeout = setTimeout(() => {
        binding.value()
      }, 600)
    })
    el.addEventListener('pointermove', () => {
      if (el.longtapTimeout) {
        clearTimeout(el.longtapTimeout);
      }
    })
    el.addEventListener('pointerup', () => {
      if (el.longtapTimeout) {
        clearTimeout(el.longtapTimeout);
      }
    })
  }
}
