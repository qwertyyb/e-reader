import { TypedEventTarget } from "@/lib/TypedEventTarget"
import Logger from "js-logger"
import { SystemBars, SystemBarsStyle } from '@capacitor/core'

const logger = Logger.get('dark-mode')

export class DarkMode extends TypedEventTarget<{
  change: CustomEvent<{ enabled: boolean }>
}> {
  static CHANGE_EVENT_NAME = 'change' as const
  #auto = true
  #match = window.matchMedia('(prefers-color-scheme: dark)')

  constructor({ auto = true, changeHandler }: {
    auto: boolean,
    changeHandler: (event: CustomEvent<{ enabled: boolean }>) => void,
  }) {
    super()
    this.#auto = auto
    if (typeof changeHandler === 'function') {
      this.addEventListener(DarkMode.CHANGE_EVENT_NAME, changeHandler)
    }
    if (auto) {
      this.#match.addEventListener('change', this.#callback)
      if (this.#match.matches) {
        this.enter()
      }
    }
  }

  #callback = (event: MediaQueryListEvent) => {
    logger.info('darkMode change callback', event.matches)
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
    logger.info('enter darkMode')
    document.documentElement.classList.add('dark')
    SystemBars.setStyle({ style: SystemBarsStyle.Dark })
    this.#changeHandler()
  }

  exit() {
    logger.info('exit darkMode')
    document.documentElement.classList.remove('dark')
    SystemBars.setStyle({ style: SystemBarsStyle.Default })
    this.#changeHandler()
  }

  isActivated() {
    return document.documentElement.classList.contains('dark')
  }

  toggle() {
    return this.isActivated() ? this.exit() : this.enter()
  }

  updateAuto(auto: boolean) {
    logger.info('updateAuto', auto, this.#auto)
    if (this.#auto === auto) return;
    this.#auto = auto
    if (this.#auto) {
      this.#match.addEventListener('change', this.#callback)
      if (this.#match.matches) {
        this.enter()
      } else {
        this.exit()
      }
    } else {
      this.#match.removeEventListener('change', this.#callback)
    }
  }
}
