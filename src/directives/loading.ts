import type { Directive } from "vue";

export const loading: Directive = {
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
