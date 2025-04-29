<template>
  <div class="control-wrapper">
    <transition name="slide-down">
      <div class="navigator" v-if="panelVisible && !selectMenuShowed">
        <div class="material-symbols-outlined back-to-index"
          @click="$router.replace('/tab/local')">arrow_back_ios</div>

        <div class="navigator-menu">
          <span class="material-symbols-outlined" @click="dialog='bookMenu'">
            more_vert
          </span>
        </div>
      </div>
    </transition>

    <c-dialog :visible="dialog==='catalog'"
      height="100vh"
      width="80vw"
      position="left"
      @close="dialog=null">
      <slot name="chapterList"></slot>
    </c-dialog>

    <book-menu-dialog
      :visible="dialog==='bookMenu'"
      :book-id="bookId"
      @close="dialog=null"
      @action="dialog=$event"
    >
    </book-menu-dialog>

    <search-dialog
      :visible="dialog==='search'"
      @close="dialog=null"
      :book-id="bookId"
      @jump="dialog=null;emits('jump', $event)"
    ></search-dialog>

    <!-- <catalog-setting-dialog :visible="dialog==='catalogSetting'" @close="dialog=null">
    </catalog-setting-dialog> -->

    <marks-dialog
      :book-id="bookId"
      :visible="dialog==='marksViewer'"
      @close="dialog=null;refreshMarks()"
    >
    </marks-dialog>

    <selection-menu
      :book-id="bookId"
      :chapterId="chapterId"
      @show="selectMenuShowed = true"
      @hide="selectMenuShowed = false"
    >
      <div class="content-container" ref="content" @touchstart="touchstartHandler">
          <slot :settings="settings"></slot>
      </div>
    </selection-menu>

    <transition name="slide-up">
      <div class="control" v-if="panelVisible && !selectMenuShowed">
        <div class="control-panel play-panel" data-target-control="autoPlay" v-if="visiblePanel === 'autoPlay'">
          <div class="speed">
            <c-progress
              :min="10"
              :max="200"
              :step="10"
              style="flex: 1"
              @change="changeAutoPlayDuration"
              v-model="settings.autoPlayDuration">
              <template v-slot:prefix>-</template>
              <template v-slot:suffix>+</template>
            </c-progress>
          </div>
        </div>

        <div class="control-panel font-panel" data-target-control="font" v-if="visiblePanel === 'font'">
          <div class="font-weight">
            <c-progress
              :min="100"
              :max="900"
              :step="100"
              :steps="[100, 200, 300, 400, 500, 600, 700, 800, 900]"
              style="flex: 1"
              v-model="settings.fontWeight">
              <template v-slot:prefix>B-</template>
              <template v-slot:suffix>B+</template>
            </c-progress>
          </div>
          <div class="font-size">
            <c-progress
              :min="10"
              :max="30"
              :step="1"
              style="flex: 1"
              v-model="settings.fontSize">
              <template v-slot:prefix>A-</template>
              <template v-slot:suffix>A+</template>
            </c-progress>
          </div>
          <div class="font-family">
            <c-select v-model="settings.fontFamily">
              <template v-slot:label="{ value }">
                <div class="font-family-label"
                  :data-font="settings.fontFamily">
                  {{ fontFamilyList.find(item => item.value === value)?.label || fontFamilyList[0]?.label }}
                </div>
              </template>
              <c-option :value="family.value" :data-font="family.value" v-for="family in fontFamilyList" :key="family.value">{{ family.label }}</c-option>
            </c-select>
          </div>
          <div class="background">
          </div>
        </div>
        <div class="control-list">
          <div class="control-item" data-control="catalog"
            @click="actionHandler('catalog')">
            <div class="control-ico material-symbols-outlined">menu</div>
            <div class="control-label"></div>
          </div>
          <div class="control-item" data-control="autoPlay"
            @click="actionHandler('autoPlay')">
            <div class="control-icon material-symbols-outlined">{{ controlState.autoPlay ? 'pause' : 'play_arrow' }}</div>
            <div class="control-label"></div>
          </div>
          <div class="control-item" data-control="readSpeak" @click="actionHandler('readSpeak')">
            <div class="control-icon material-symbols-outlined">{{ controlState.readSpeak ? 'pause_circle' : 'play_circle' }}</div>
            <div class="control-label"></div>
          </div>
          <div class="control-item" data-control="font" @click="visiblePanel='font'">
            <span class="material-symbols-outlined">text_format</span>
            <div class="control-label"></div>
          </div>
          <div class="control-item" data-control="darkMode" @click="actionHandler('darkMode')">
            <span class="material-symbols-outlined">{{ controlState.darkMode ? 'light_mode' : 'dark_mode' }}</span>
            <div class="control-label"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { getSettings, saveAllSettings } from '@/utils/settings';
import { onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { fontFamilyList } from '@/config';
import CSelect from '@/components/common/CSelect.vue';
import COption from '@/components/common/COption.vue';
import CProgress from '@/components/common/CProgress.vue';
import CDialog from '@/components/common/CDialog.vue';
import SelectionMenu from '@/components/SelectionMenu.vue';
import BookMenuDialog from '@/components/BookMenuDialog.vue';
import MarksDialog from '@/components/MarksDialog.vue';
import SearchDialog from '@/components/SearchDialog.vue';
import { env } from '@/utils/env';
import router from '@/router';
import { AutoPlay, DarkMode, ReadSpeak } from '@/actions';
import { getNearestTopEl } from '@/utils';

defineProps<{
  bookId: number
  chapterId: number
}>()

const emits = defineEmits<{
  'prev-page': [],
  'next-page': [],
  'scroll-vertical': [number],
  'jump': [{ cursor: number, chapterId: string }],
}>()

const panelVisible = ref(false)
const visiblePanel = ref<string | null>()
const dialog = ref<string | null>()
const selectMenuShowed = ref(false)

const controlState = ref({
  darkMode: false,
  readSpeak: false,
  autoPlay: false
})

const settings = ref(getSettings())

const contentRef = useTemplateRef('content')

watch(settings, value => saveAllSettings(value), { deep: true })

const changeAutoPlayDuration = (duration: number) => {
  settings.value.autoPlayDuration = duration
  actions.autoPlay.updateInterval(duration)
}

const refreshMarks = () => {
  const chapterEls = contentRef.value!.querySelectorAll<HTMLElement>('.chapter')
  chapterEls.forEach(el => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el as any).chapterMark?.refresh()
  })
}

const touchstartHandler = (e: TouchEvent) => {
  const p = e.changedTouches[0]
  if (p.pageX < 20 || p.pageX > window.innerWidth - 20) {
    e.preventDefault()
  }
}

const actionHandler = async (control: string) => {
  // action: readSpeak | darkMode | autoPlay | catalog
  if (control === 'darkMode') {
    actions.darkMode?.toggle()
  }
  if (control === 'readSpeak') {
    const candidates = Array.from(contentRef.value!.querySelectorAll<HTMLElement>('.chapter'))
    const el = getNearestTopEl(candidates)
    actions.readSpeak.toggle(el!)
  } else if (control === 'autoPlay') {
    visiblePanel.value = 'autoPlay'
    actions.autoPlay.toggle()
  } else if (control === 'catalog') {
    dialog.value = 'catalog'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hammerInstance: any

const initHammer = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentTapHandler = (event: any) => {
    if (event.srcEvent.target.nodeName.toLowerCase() === 'mark') return
    if (env.isInk()) {
      /**
       * 把点击区域分为九个区域，如下
       * 1|2|3
       * 4|5|6
       * 7|8|9
       * 先计算在点击落于哪个区域
       */
      const { x, y } = event.center
      const centerLeft = window.innerWidth / 3
      const centerRight = 2 * centerLeft
      const centerTop = window.innerHeight / 3
      const centerBottom = 2 * centerTop
      let area = -1
      if (y <= centerTop) {
        area = x < centerLeft ? 1 : x < centerRight ? 2 : 3
      } else if (y <= centerBottom) {
        area = x < centerLeft ? 4 : x < centerRight ? 5 : 6
      } else {
        area = x < centerLeft ? 7 : x < centerRight ? 8 : 9
      }

      const nextPageArea = [3, 7, 9]
      const prevPageArea = [1, 4, 6]

      if (nextPageArea.includes(area)) {
        emits('next-page')
      } else if (prevPageArea.includes(area)) {
        emits('prev-page')
      } else {
        panelVisible.value = !panelVisible.value
      }
      return
    }
    if (actions.autoPlay.isPlaying()) {
      visiblePanel.value = 'autoPlay'
    }
    panelVisible.value = !panelVisible.value
  }
  const hammer = new window.Hammer.Manager(contentRef.value!, {
    recognizers: [
      [window.Hammer.Tap],
      [window.Hammer.Swipe, { direction: window.Hammer.DIRECTION_ALL, threshold: 10 }]
    ]
  })
  if (env.isInk()) {
    hammer.on('swipeleft', () => emits('next-page'))
    hammer.on('swiperight', () => emits('prev-page'))
  } else {
    hammer.on('swiperight', (() => {
      let backed = false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (e: any) => {
        const { center: { x }, deltaX } = e
        const startX = x - deltaX
        if (startX <= 80 && !backed) {
          backed = true
          router.back()
        }
      }
    })())
    hammer.on('swipeleft', () => {
      visiblePanel.value = 'catalog'
    })
  }
  hammer.on('tap', contentTapHandler)
  hammerInstance = hammer
}

const createActions = () => {
  return {
    darkMode: new DarkMode({
      auto: true,
      changeHandler: event => controlState.value.darkMode = event.detail.enabled
    }),
    readSpeak: new ReadSpeak({
      getNextElement: () => {
        const el = contentRef.value!.querySelector('p.reading')
        return el?.nextElementSibling ?? null
      },
      changeHandler: event => {
        controlState.value.readSpeak = event.detail.speaking
      }
    }),
    autoPlay: new AutoPlay({
      nextPage: () => emits('next-page'),
      scrollVertical: () => emits('scroll-vertical', 1),
      autoPlayDuration: settings.value.autoPlayDuration,
      changeHandler: (event) => {
        controlState.value.autoPlay = event.detail.playing
      }
    })
  }
}

let actions: ReturnType<typeof createActions>

onMounted(() => {
  initHammer();
  actions = createActions()
})

onUnmounted(() => { if (hammerInstance) { hammerInstance.destroy() } })

</script>

<style lang="scss" scoped>
.control-wrapper {
  height: 100%;
  flex: 1;
}
.control-wrapper .content-container {
  overflow: auto;
  touch-action: none;
}

.control-wrapper .navigator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  width: calc(100% - 24px);
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  border-bottom: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  z-index: 10;
  padding-top: env(safe-area-inset-top);
  box-sizing: content-box;
  box-shadow: 0 0 10px light-dark(var(--light-shadow-color), var(--dark-shadow-color));
}
.control-wrapper .navigator::before {
  content: " ";
  display: block;
  width: 100vw;
  height: env(safe-area-inset-top);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
}
.control-wrapper .navigator .back-to-index {
  font-size: 28px;
  cursor: pointer;
}
.control-wrapper .navigator-menu {
  cursor: pointer;
}

/* control */
.control {
  --control-height: 48px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 6;
}
.control .control-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: var(--control-height);
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  text-align: center;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: content-box;
  box-shadow: 0 0 10px light-dark(var(--light-shadow-color), var(--dark-shadow-color));
}
.control-item {
  cursor: pointer;
}
.control .material-symbols-outlined {
  font-size: 32px;
}
.control .control-panel {
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  padding: 16px 0;
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  box-sizing: content-box;
}
.control .control-panel.font-panel {
  display: flex;
  font-size: 20px;
  justify-content: space-around;
  flex-direction: column;
  padding: 0 20px;
  box-sizing: border-box;
}
.control-panel.font-panel > div {
  width: 100%;
}
.control-panel.font-panel .font-family {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.control-panel.font-panel .font-family .c-select {
  flex: 1;
}
.control-panel.font-panel .font-family .font-family-label {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
}
.control-panel.font-panel .font-weight {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.control-panel.font-panel > * {
  margin: 10px 0;
}
.control-panel.font-panel .font-weight.selected {
  background: #000;
  color: #fff;
}
.control-panel.font-panel .font-size {
  display: flex;
  align-items: center;
}
.control-panel.font-panel .font-size .text-size {
  width: 48px;
  text-align: center;
}
.control-panel.font-panel .font-size button {
  font-size: 24px;
  padding: 6px;
  background: transparent;
  border: none;
  outline: none;
}

.control-panel.play-panel {
  display: flex;
  justify-content: space-around;
}
.control-panel.play-panel button {
  border: 1px solid #000;
  border-radius: 999px;
  font-size: 24px;
  padding: 6px;
}
.control-panel.play-panel .speed {
  width: 90%;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
</style>
