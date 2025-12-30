<template>
  <div class="tab-view book-shelf">
    <div class="tab-panel-container">
      <transition :name="transitionName">
        <shelf-view v-if="curTab === 'shelf'"></shelf-view>
        <o-p-d-s-view v-else-if="curTab === 'opds'" no-back></o-p-d-s-view>
        <my-view v-else></my-view>
      </transition>
    </div>
    <ul class="tab-nav-list">
      <li class="tab-nav-item pointer"
        @click="curTab = 'shelf'"
        :class="{selected: curTab === 'shelf' }">
        <span class="material-symbols-outlined tab-icon">newsstand</span>
        书架
      </li>
      <li class="tab-nav-item pointer"
        v-if="preferences.opdsServerUrl"
        @click="curTab = 'opds'"
        :class="{selected: curTab === 'opds'}">
        <span class="material-symbols-outlined tab-icon">public</span>
        图书馆
      </li>
      <li class="tab-nav-item pointer"
        @click="curTab = 'my'"
        :class="{selected: curTab === 'my' }">
        <span class="material-symbols-outlined tab-icon">person</span>
        我的
      </li>
      <li class="tab-nav-item pointer small-none settings-item"
        @click="settingsVisible = true"
      >
        <span class="material-symbols-outlined tab-icon">settings</span>
        设置
      </li>
    </ul>
    <web-settings :visible="settingsVisible" @close="settingsVisible=false" v-if="!isSmall"></web-settings>
  </div>
</template>

<script setup lang="ts">
import ShelfView from '@/views/ShelfView.vue';
import MyView from '@/views/MyView.vue';
import OPDSView from '@/views/OPDSView.vue';
import { preferences } from '@/stores/preferences';
import { defineAsyncComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useWindowSize } from '@/hooks/windowSize';

const WebSettings = defineAsyncComponent(() => import('@/components/WebSettings.vue'))

const router = useRouter()

const getDefaultTab = () => {
  const tab  = router.currentRoute.value.query.tab as string | undefined;
  if (tab === 'my' || tab === 'shelf') {
    return tab;
  }
  return 'shelf';
}
const curTab = ref(getDefaultTab())
const { isSmall } = useWindowSize();

const tabNames = ['shelf', 'opds', 'my']
const transitionName = ref(isSmall.value ? 'tab-slide-next' : '')

watch(curTab, (tab, prevTab) => {
  if (!isSmall.value) return;
  // 要切换的tab 位于当前 tab 之前，则使用 tab-slide-prev
  // 否则使用 tab-slide-next
  transitionName.value = tabNames.indexOf(tab) < tabNames.indexOf(prevTab) ? 'tab-slide-prev' : 'tab-slide-next';
})

const settingsVisible = ref(false)

watch(router.currentRoute, route => {
  if (route.name !== 'home') {
    settingsVisible.value = false
    console.log(route)
  }
})


</script>

<style lang="scss" scoped>
@use "../styles/variables";

.tab-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: var(--page-height);
}
.tab-panel-container {
  position: relative;
  flex: 1;
  overflow-x: hidden;
  display: flex;
  background-color: var(--bg-color);
  & > * {
    width: 100%;
    flex-shrink: 0;
  }
}
.tab-nav-list {
  display: flex;
  list-style: none;
  padding-bottom: var(--saib);
  width: 100%;
  height: 54px;
  box-sizing: content-box;
  border-top: 1px solid var(--border-color);
  position: relative;
  z-index: 1;
  background: var(--bg-color);
}
.tab-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  padding-top: 12px;
  .material-symbols-outlined {
    color: inherit;
    font-size: 24px;
    width: 24px;
    height: 24px;
  }
}

@media (width > variables.$MAX_SMALL_WIDTH) {
  .tab-view {
    flex-direction: row-reverse;
  }
  .tab-nav-list {
    height: 100vh;
    width: 200px;
    flex-direction: column;
    border-right: 1px solid var(--border-color);
    border-top: none;
  }
  .tab-nav-item {
    flex-direction: row;
    align-items: flex-start;
    flex: initial;
    padding-bottom: 12px;
    &.settings-item {
      margin-top: auto;
      border-top: 1px solid var(--border-color);
    }
    .material-symbols-outlined {
      margin-right: 8px;
    }
  }
}
@media (hover: hover) {
  .tab-nav-item:not(.selected):hover {
    color: var(--theme-color-hover)
  }
}
</style>
