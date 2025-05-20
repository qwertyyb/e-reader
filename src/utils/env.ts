export const env = {
  isPwa: () => window.matchMedia('(display-mode: standalone)').matches,
  isBooxLeaf: () => navigator.userAgent.includes('Leaf'),
  isHorizontal: () => navigator.userAgent.includes('Leaf') || location.hash.includes('ink=1'),
  isInk: () => navigator.userAgent.includes('Leaf') || location.hash.includes('ink=1')
}

export const getSafeAreaTop = () => window.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sait"), 10)
