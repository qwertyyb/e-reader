<template>
  <div class="read-control">
    <div class="control-panel"
      data-target-control="font"
      v-if="visiblePanel === 'font'"
      ref="floating"
      :style="floatingStyles"
    >
      <div class="read-speak">
        <p class="read-speak-toggle pointer" @click="toggleReadSpeak">
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
          class="speed"
        >
          <template v-slot:prefix>慢</template>
          <template v-slot:suffix>快</template>
        </c-progress>
      </div>

      <div class="divider"></div>

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

      <div class="divider"></div>

      <div class="auto-play">
        <div class="control-icon material-symbols-outlined">{{ controlState.autoPlay ? 'pause_circle' : 'play_circle' }}</div>
        <c-progress
          :min="10"
          :max="200"
          :step="10"
          style="flex: 1"
          @change="changeAutoPlaySpeed"
          class="speed"
          v-model="settings.speed">
          <template v-slot:prefix><span class="material-symbols-outlined">fast_rewind</span></template>
          <template v-slot:suffix><span class="material-symbols-outlined">fast_forward</span></template>
        </c-progress>
      </div>

      <div class="divider"></div>

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

      <div class="divider"></div>

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

    <div class="control-list">
      <div class="control-item back"
        @click="$router.back()">
        <div class="control-ico material-symbols-outlined">arrow_back</div>
        <div class="control-label"></div>
      </div>
      <div class="control-item" data-control="chapterList"
        @click="toggleControl('chapterList')">
        <div class="control-ico material-symbols-outlined">list</div>
        <div class="control-label"></div>
      </div>
      <div class="title">{{ title }}</div>
      <div class="control-item"
        :class="{selected: visiblePanel === 'font'}"
        data-control="font"
        ref="reference"
        @click="toggleControl('font')">
        <span class="material-symbols-outlined">grid_view</span>
        <div class="control-label"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFloating, offset, shift } from '@floating-ui/vue';
import { AutoPlay, ReadSpeak } from '@/actions';
import { computed, inject, onBeforeUnmount, type Ref, ref, useTemplateRef, watch } from 'vue';
import CProgress from '@/components/common/CProgress.vue';
import CSelect from '@/components/common/CSelect.vue';
import { fontFamilyList, readColorScheme, textIndentList } from '@/config';
import { settings } from '@/stores/settings';
import { EdgeTTSReadSpeak, type GetNextElement } from '@/actions/read-speak';
import { darkMode, preferences } from '@/stores/preferences';
import { formatDuration } from '@/utils';


const props = defineProps<{
  getNextReadElement: GetNextElement,
  title?: string,
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

const reference = useTemplateRef('reference')
const floating = useTemplateRef('floating');
const { floatingStyles } = useFloating(reference, floating, { placement: 'bottom', middleware: [offset(12), shift({ padding: 12 })] });

const handlePointerDown = (event: PointerEvent) => {
  if ((event.target as HTMLElement)?.closest('.control-panel') === floating.value || (event.target as HTMLElement)?.closest('.control-item') === reference.value) return;
  console.log('closePanel')
  event.stopPropagation();
  visiblePanel.value = null;
}

watch(floating, (newVal) => {
  window.removeEventListener('pointerdown', handlePointerDown, true)
  if (newVal) {
    window.addEventListener('pointerdown', handlePointerDown, true)
  }
});

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
  top: 0;
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
  // justify-content: space-between;
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
  .title {
    width: calc(100% - 16px - 16px - 32px - 32px - 32px - 8px - 8px);
    margin-right: auto;
  }
}
.control-item {
  cursor: pointer;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 2px;
  transition: background .2s;
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  &.back {
    margin-right: 8px;
  }
}
.material-symbols-outlined {
  font-size: 32px;
}
.control-panel {
  background: var(--bg-color);
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  box-sizing: content-box;
  box-shadow: 7px 14px 10px 0px rgba(0,0,0,0.1);
  border-radius: 6px;
  min-width: 375px;
  font-size: 16px;
  .divider {
    height: 2px;
    background-color: var(--border-color);
    width: calc(100% + 32px);
    margin-left: -16px;
    margin-right: -16px;
    margin-block: 16px;
  }
}

.control-panel {
  display: flex;
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
.control-panel > div {
  width: 100%;
}
.control-panel .font-family {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.control-panel .font-family .c-select {
  flex: 1;
}
.control-panel .font-family-label {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 100%;
}
.control-panel .font-weight {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.control-panel .font-size {
  display: flex;
  align-items: center;
}
.control-panel .font-size .text-size {
  width: 48px;
  text-align: center;
}
.control-panel .font-size button {
  font-size: 24px;
  padding: 6px;
  background: transparent;
  border: none;
  outline: none;
}

.auto-play {
  display: flex;
  align-items: center;
  .speed {
    flex: 1;
    margin-left: 12px;
  }
}

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

.read-info {
  display: flex;
  list-style: none;
  margin-bottom: 16px;
}
.read-info-item {
  flex: 1;
  text-align: center;
  h4 {
    font-size: 14px;
  }
}
.read-info-item + .read-info-item {
  border-left: 1px solid var(--border-color);
}
.read-info-subtitle {
  opacity: 0.6;
  font-size: 12px;
}

.read-speak {
  display: flex;
  flex-direction: column;
  justify-content: center;
  .speed {
    margin-top: 8px;
  }
}
.read-speak-toggle {
  text-align: center;
  .control-icon {
    font-size: 54px;
  }
}
</style>
