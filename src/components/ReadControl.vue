<template>
  <div class="read-control">
    <transition name="slide-up">
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

    <transition name="slide-up">
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
        <div class="font-family line-item">
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
      <div class="control-item" data-control="readSpeak" @click="toggleControl('readSpeak')">
        <div class="control-icon material-symbols-outlined">{{ controlState.readSpeak ? 'pause_circle' : 'play_circle' }}</div>
        <div class="control-label"></div>
      </div>
      <div class="control-item" data-control="progress" @click="toggleControl('progress')">
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
        @click="toggleControl('darkMode')">
        <span class="material-symbols-outlined">{{ controlState.darkMode ? 'light_mode' : 'dark_mode' }}</span>
        <div class="control-label"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AutoPlay, DarkMode, ReadSpeak } from '@/actions';
import { onBeforeUnmount, ref } from 'vue';
import CProgress from '@/components/common/CProgress.vue';
import CSelect from '@/components/common/CSelect.vue';
import COption from '@/components/common/COption.vue';
import { fontFamilyList } from '@/config';
import { settings } from '@/stores/settings';

const props = defineProps<{
  getNextReadElement: (current?: HTMLElement) => HTMLElement | null
}>()

const emits = defineEmits<{
  'next-page': [],
  'scroll-vertical': [number],
  'open-chapter-list': []
}>()

const visiblePanel = ref<string | null>()
const controlState = ref({
  darkMode: false,
  readSpeak: false,
  autoPlay: false
})

const createActions = () => {
  return {
    darkMode: new DarkMode({
      auto: true,
      changeHandler: event => controlState.value.darkMode = event.detail.enabled
    }),
    readSpeak: new ReadSpeak({
      getNextElement: (current?: HTMLElement) => {
        return props.getNextReadElement(current)
      },
      changeHandler: event => {
        controlState.value.readSpeak = event.detail.speaking
      }
    }),
    autoPlay: new AutoPlay({
      nextPage: () => emits('next-page'),
      scrollVertical: (distance) => emits('scroll-vertical', distance),
      speed: settings.value.speed,
      changeHandler: (event) => {
        controlState.value.autoPlay = event.detail.playing
      }
    })
  }
}

const actions = createActions()

onBeforeUnmount(() => {
  actions.autoPlay.stop()
  actions.readSpeak.stop()
  actions.darkMode.destroy()
})

const changeAutoPlaySpeed = (speed: number) => {
  settings.value.speed = speed
  actions.autoPlay.updateSpeed(speed)
}

const toggleControl = async (control: string) => {
  // action: readSpeak | darkMode | autoPlay | chapterList
  if (visiblePanel.value === control) {
    visiblePanel.value = null
  } else {
    visiblePanel.value = control
  }
  if (control === 'darkMode') {
    actions.darkMode?.toggle()
  }
  if (control === 'readSpeak') {
    actions.readSpeak.toggle(props.getNextReadElement())
  } else if (control === 'autoPlay') {
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
.read-control {
  --control-height: 48px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 6;
}
.control-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: var(--control-height);
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  text-align: center;
  padding-bottom: var(--saib);
  box-sizing: content-box;
  position: relative;
  z-index: 4;
  // box-shadow: 0 0 10px light-dark(var(--light-shadow-color), var(--dark-shadow-color));
}
.control-item {
  cursor: pointer;
  &.selected > * {
    color: rgb(0, 4, 255);
  }
}
.material-symbols-outlined {
  font-size: 32px;
}
.control-panel {
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  padding: 16px;
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  box-sizing: content-box;
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
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
</style>
