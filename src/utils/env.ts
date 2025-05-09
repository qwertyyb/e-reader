export const env = {
  isPwa: () => window.matchMedia('(display-mode: standalone)').matches,
  isBooxLeaf: () => navigator.userAgent.includes('Leaf'),
  isHorizontal: () => document.querySelector<HTMLElement>('.content')?.classList.contains('column'),
  isInk: () => navigator.userAgent.includes('Leaf')
}

export const getSafeAreaTop = () => window.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sait"), 10)
