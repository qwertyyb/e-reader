<template>
  <div class="read-control">
    <transition name="slide-up" :css="!disableAnim">
      <div class="control-panel play-panel" data-target-control="autoPlay" v-if="visiblePanel === 'autoPlay'">
        <div class="speed">
          <c-progress
            :min="10"
            :max="200"
            :step="10"
            style="flex: 1"
            @change="changeAutoPlaySpeed"
            v-model="settings.speed">
            <template v-slot:prefix><span class="material-symbols-outlined">fast_rewind</span></template>
            <template v-slot:suffix><span class="material-symbols-outlined">fast_forward</span></template>
          </c-progress>
        </div>
      </div>
    </transition>

    <transition name="slide-up" :css="!disableAnim">
      <div class="control-panel progress-panel" v-if="visiblePanel === 'progress'">
        <ul class="read-info"
          @click="$router.push({ name: 'readTime', params: { id: book!.id }, query: { fromRead: '1' } })"
        >
          <li class="read-info-item" v-if="chapterPercent">
            <h4>
              {{ chapterPercent }}
            </h4>
            <p class="read-info-subtitle">本章进度</p>
          </li>
          <li class="read-info-item" v-if="bookPercent">
            <h4>
              {{ bookPercent }}
            </h4>
            <p class="read-info-subtitle">全书进度</p>
          </li>
          <li class="read-info-item" v-if="bookPercent">
            <h4>
              {{ readingDuration }}
            </h4>
            <p class="read-info-subtitle">阅读时间</p>
          </li>
        </ul>
        <div class="line-item" v-if="progress && book && ('maxCursor' in book)">
          <c-progress
            style="flex: 1"
            :min="0"
            :max="book.maxCursor"
            :step="1"
            :model-value="progress.cursor"
            disabled
          >
            <template #label>{{ bookPercent }}</template>
          </c-progress>
        </div>
        <div class="line-item">
          <p class="read-speak-toggle pointer" @click="toggleReadSpeak">
            朗读
            <span class="control-icon material-symbols-outlined loading-rotate" v-if="controlState.readSpeak === 'loading'">hourglass_bottom</span>
            <span class="control-icon material-symbols-outlined" v-else>
              {{ controlState.readSpeak ? 'pause_circle' : 'play_circle' }}
            </span>
          </p>
          <c-progress
            style="flex:1"
            :min="0.1"
            :max="3"
            :step="0.1"
            v-model="settings.readSpeakRate"
            @change="changeReadSpeakRate"
          >
            <template v-slot:prefix>慢</template>
            <template v-slot:suffix>快</template>
          </c-progress>
        </div>
      </div>
    </transition>

    <transition name="slide-up" :css="!disableAnim">
      <div class="control-panel font-panel" data-target-control="font" v-if="visiblePanel === 'font'">
        <div class="font-size line-item">
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
        <div class="font-weight line-item">
          <c-progress
            :min="100"
            :max="900"
            :step="100"
            :steps="[100, 200, 300, 400, 500, 600, 700, 800, 900]"
            style="flex: 1"
            v-model="settings.fontWeight">
            <template v-slot:prefix>B-</template>
            <template v-slot:label>字重</template>
            <template v-slot:suffix>B+</template>
          </c-progress>
        </div>
        <div class="line-height line-item">
          <c-progress
            :min="1"
            :max="3"
            :step="0.1"
            style="flex: 1"
            v-model="settings.lineHeight">
            <template v-slot:prefix>紧</template>
            <template v-slot:label>行距</template>
            <template v-slot:suffix>松</template>
          </c-progress>
        </div>
        <div class="line-item">
          <c-select
            title="首行缩进"
            v-model="settings.textIndent"
            class="text-indent-select"
            :options="textIndentList"
          >
          </c-select>
        </div>
        <div class="font-family-and-turn-page line-item">
          <c-select
            title="字体"
            v-model="settings.fontFamily"
            class="font-family-select"
            :options="fontFamilyList"
          >
            <template v-slot="{ label }">
              <div class="font-family-label"
                :data-font="settings.fontFamily">
                {{ label || '默认' }}
              </div>
              <span class="material-symbols-outlined arrow-icon" style="margin-left: auto">chevron_right</span>
            </template>
          </c-select>
          <c-select
            title="翻页方式"
            v-model="settings.turnPageType"
            @change="updateTurnPage"
            class="turn-page-type-select"
            :options="[
              { label: '上下滚动', value: 'vertical-scroll' },
              { label: '左右滑动', value: 'horizontal-scroll' }
            ]"
          >
          </c-select>
        </div>
      </div>
    </transition>

    <transition name="slide-up" :css="!disableAnim">
      <div class="control-panel color-scheme-panel" data-target-control="colorScheme" v-if="visiblePanel === 'colorScheme'">
        <ul class="color-scheme-list">
          <li class="color-scheme-item"
            v-for="(item, key) in readColorScheme"
            :key="key"
            :class="{selected: settings.colorScheme?.backgroundColor === item.backgroundColor && settings.colorScheme?.textColor === item.textColor }"
            @click="settings.colorScheme = { ...item }"
            :style="{ backgroundColor: item.backgroundColor }"
          ></li>
          <li class="color-scheme-item material-symbols-outlined system-item"
            :class="{selected: !settings.colorScheme }"
            @click="settings.colorScheme = undefined;darkMode.toggle()"
          >{{ controlState.darkMode ? 'light_mode' : 'dark_mode' }}</li>
        </ul>
      </div>
    </transition>

    <div class="control-list">
      <div class="control-item" data-control="chapterList"
        @click="toggleControl('chapterList')">
        <div class="control-ico material-symbols-outlined">menu</div>
        <div class="control-label"></div>
      </div>
      <div class="control-item"
        :class="{selected: visiblePanel === 'autoPlay'}"
        data-control="autoPlay"
        @click="toggleControl('autoPlay')">
        <div class="control-icon material-symbols-outlined">{{ controlState.autoPlay ? 'pause' : 'play_arrow' }}</div>
        <div class="control-label"></div>
      </div>
      <div class="control-item"
        :class="{selected: visiblePanel === 'progress'}"
        data-control="progress"
        @click="toggleControl('progress')"
      >
        <div class="control-icon material-symbols-outlined">commit</div>
        <div class="control-label"></div>
      </div>
      <div class="control-item"
        :class="{selected: visiblePanel === 'font'}"
        data-control="font"
        @click="toggleControl('font')">
        <span class="material-symbols-outlined">text_format</span>
        <div class="control-label"></div>
      </div>
      <div class="control-item"
        data-control="darkMode"
        @click="toggleControl('colorScheme')">
        <span class="material-symbols-outlined">light_mode</span>
        <div class="control-label"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AutoPlay, ReadSpeak } from '@/actions';
import { computed, inject, onBeforeUnmount, type Ref, ref } from 'vue';
import CProgress from '@/components/common/CProgress.vue';
import CSelect from '@/components/common/CSelect.vue';
import { fontFamilyList, readColorScheme, textIndentList } from '@/config';
import { settings } from '@/stores/settings';
import { EdgeTTSReadSpeak, type GetNextElement } from '@/actions/read-speak';
import { darkMode, preferences } from '@/stores/preferences';
import { disableAnim } from '@/utils/env';
import { formatDuration } from '@/utils';

const props = defineProps<{
  getNextReadElement: GetNextElement
}>()

const emits = defineEmits<{
  'next-page': [],
  'scroll-vertical': [number],
  'open-chapter-list': []
}>()

const visiblePanel = ref<string | null>()
const controlState = ref({
  darkMode: darkMode.isActivated(),
  readSpeak: false as boolean | 'loading',
  autoPlay: false
})

const progress = inject<Ref<{ chapter: IChapter, chapterIndex: number, cursor: number, duration: number } | null>>('progress')
const book = inject<Ref<IBook | ILocalBook>>('book')

const chapterPercent = computed(() => {
  if (!progress?.value) return null
  if (!progress.value.chapter.cursorEnd) return null
  return Math.round((progress.value.cursor - progress.value.chapter.cursorStart) / (progress.value.chapter.cursorEnd - progress.value.chapter.cursorStart + 1) * 100) + '%'
})

const bookPercent = computed(() => {
  if (!progress?.value) return null
  if (!book?.value) return null
  if ('maxCursor' in book.value) {
    return Math.round(progress.value.cursor / book.value.maxCursor * 100) + '%'
  }
  return null
})

const readingDuration = computed(() => {
  if (!progress?.value) return null
  const duration = progress?.value?.duration || 0
  return formatDuration(duration)
})

const createReadSpeakAction = () => {
  const options = {
    getNextElement: (current?: HTMLElement) => {
      return props.getNextReadElement(current)
    },
    changeHandler: (event: CustomEvent<Partial<{speaking: boolean, rate: number}>>) => {
      if ('speaking' in event.detail) {
        controlState.value.readSpeak = event.detail.speaking!
      }
      if ('rate' in event.detail) {
        settings.value.readSpeakRate = event.detail.rate!
      }
    }
  }
  return preferences.value.tts === 'local' ? new ReadSpeak(options) : new EdgeTTSReadSpeak(options)
}

const createActions = () => {
  return {
    readSpeak: createReadSpeakAction(),
    autoPlay: new AutoPlay({
      nextPage: () => emits('next-page'),
      scrollVertical: (distance) => emits('scroll-vertical', distance),
      speed: settings.value.speed,
      turnPageType: settings.value.turnPageType || 'vertical-scroll',
      requestWakeLock: preferences.value.screenKeepAlive === 'autoPlay',
      changeHandler: (event) => {
        controlState.value.autoPlay = event.detail.playing
      }
    })
  }
}

const actions = createActions()
darkMode.addEventListener('change', (event) => controlState.value.darkMode = (event as CustomEvent<{ enabled: boolean }>).detail.enabled)

onBeforeUnmount(() => {
  actions.autoPlay.stop()
  actions.readSpeak.stop()
})

const changeAutoPlaySpeed = (speed: number) => {
  settings.value.speed = speed
  actions.autoPlay.updateSpeed(speed)
}

const updateTurnPage = (t?: string) => {
  if (!t) return;
  actions.autoPlay.updateTurnPageType(t as TurnPageType)
}

const changeReadSpeakRate = (rate: number) => {
  actions.readSpeak.updateRate(rate)
}

const toggleReadSpeak = () => {
  controlState.value.readSpeak = 'loading'
  actions.readSpeak.toggle()
}

const toggleControl = async (control: string) => {
  // action: darkMode | autoPlay | chapterList | font | progress
  if (['autoPlay', 'progress', 'font', 'colorScheme'].includes(control)) {
    if (visiblePanel.value === control) {
      visiblePanel.value = null
    } else {
      visiblePanel.value = control
    }
  }
  if (control === 'darkMode') {
    darkMode.toggle()
  }
  if (control === 'autoPlay') {
    actions.autoPlay.toggle()
  } else if (control === 'chapterList') {
    emits('open-chapter-list')
  }
}

defineExpose({
  openPanel(panel: 'autoPlay' | 'font') {
    visiblePanel.value = panel
  },
  closePanel() {
    visiblePanel.value = null
  },
  isAutoPlaying() {
    return actions.autoPlay.isPlaying()
  }
})
</script>

<style lang="scss" scoped>
@use "../styles/variables";

.read-control {
  --control-height: 48px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 6;
  // 当组件正在动画进入或动画退出时，把面板的定位设置为 static 占据高度来避免动画的高度不正确的问题
  &.slide-up-enter-active, &.slide-up-leave-active {
    .control-panel{
      position: static;
    }
  }
}
.control-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: var(--control-height);
  background-color: var(--bg-color);
  border-top: 1px solid var(--border-color);
  text-align: center;
  padding-bottom: var(--saib);
  box-sizing: content-box;
  position: relative;
  z-index: 4;
}
.control-item {
  cursor: pointer;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 2px;
}
.material-symbols-outlined {
  font-size: 32px;
}
.control-panel {
  background: var(--bg-color);
  padding: 16px;
  border-top: 1px solid var(--border-color);
  box-sizing: content-box;
  // 需要把面板的位置设置为 absolute, 否则在两个面板切换时，前一个面板的位置会被后一个面板的位置顶起来的问题
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--control-height) + var(--saib));
}

.control-panel + .control-list {
  border-top: none;
}
.control-panel.font-panel {
  display: flex;
  font-size: 20px;
  justify-content: space-around;
  flex-direction: column;
  box-sizing: border-box;
}
.line-item {
  display: flex;
  gap: 20px;
  .font-family-select, .turn-page-type-select, .text-indent-select {
    background: var(--card-bg-color);
    padding: 6px 12px;
    border-radius: 9999px;
  }
  .font-family-select {
    flex: 3;
  }
  .turn-page-type-select {
    flex: 2;
  }
}
.line-item + .line-item {
  margin-top: 20px;
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
.control-panel.font-panel .font-family-label {
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
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.color-scheme-panel {
  .color-scheme-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, 60px);
    justify-content: space-between;
    gap: 12px;
    list-style: none;
  }
  .color-scheme-item {
    width: 60px;
    height: 32px;
    line-height: 32px;
    text-align: center;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    font-size: 24px;
    &.system-item {
      background: var(--card-bg-color);
    }
    &.selected {
      border-color: var(--theme-color);
      filter: drop-shadow(0px 0px 4px var(--theme-color));
    }
  }
}

.read-info {
  display: flex;
  list-style: none;
  margin-bottom: 16px;
}
.read-info-item {
  flex: 1;
  text-align: center;
}
.read-info-item + .read-info-item {
  border-left: 1px solid var(--border-color);
}
.read-info-subtitle {
  opacity: 0.6;
  font-size: 12px;
}

.read-speak-toggle {
  display: flex;
  align-items: center;
  background-color: light-dark(#e3e3e3, #333);
  padding: 4px 12px;
  border-radius: 9999px;
  width: fit-content;
  margin-right: 18px;
  .control-icon {
    margin-left: 4px;
    font-size: 22px;
  }
}
</style>
