import { ref } from "vue"

export const env = {
  isPwa: () => window.matchMedia('(display-mode: standalone)').matches,
  isBooxLeaf: () => navigator.userAgent.includes('Leaf'),
  isHorizontal: () => navigator.userAgent.includes('Leaf') || location.href.includes('ink=1'),
  isInk: () => navigator.userAgent.includes('Leaf') || location.href.includes('ink=1'),
}

export const getSafeAreaTop = () => window.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sait"), 10)


let mediaMatch: MediaQueryList | null = null

export const enableAnim = ref(true)

export const initEnableAnim = () => {
  if (mediaMatch) {
    return;
  }
  mediaMatch = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = () => {
    enableAnim.value = location.href.includes('disAnim=1') ? false : !mediaMatch?.matches
    if (enableAnim.value && !document.documentElement.classList.contains('enable-anim')) {
      document.documentElement.classList.add('enable-anim')
    } else if (!enableAnim.value && document.documentElement.classList.contains('enable-anim')) {
      document.documentElement.classList.remove('enable-anim')
    }
  }

  mediaMatch.addEventListener('change', handler)

  handler()
}
