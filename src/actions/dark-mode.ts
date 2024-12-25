export class DarkMode extends EventTarget {
  static CHANGE_EVENT_NAME = 'change'

  constructor({ auto = true, changeHandler }: {
    auto: true,
    changeHandler: (event: CustomEvent<{ enabled: boolean }>) => void,
  }) {
    super()
    if (typeof changeHandler === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.addEventListener(DarkMode.CHANGE_EVENT_NAME, changeHandler as any)
    }
    if (auto) {
      const match = window.matchMedia('(prefers-color-scheme: dark)')
      match.addEventListener('change', this.#callback)
      if (match.matches) {
        this.enter()
      }
    }
  }

  #callback = (event: MediaQueryListEvent) => {
    if (event.matches) {
      this.enter()
    } else {
      this.exit()
    }
  }

  destroy() {
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.#callback)
  }

  #changeHandler() {
    this.dispatchEvent(new CustomEvent(DarkMode.CHANGE_EVENT_NAME, { detail: { enabled: this.isActivated() } }))
  }

  enter() {
    document.documentElement.classList.add('dark-mode')
    this.#changeHandler()
  }

  exit() {
    document.documentElement.classList.remove('dark-mode')
    this.#changeHandler()
  }

  isActivated() {
    return document.documentElement.classList.contains('dark-mode')
  }

  toggle() {
    return this.isActivated() ? this.exit() : this.enter()
  }
}
