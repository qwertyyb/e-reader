<template>
  <div class="tab-view">
    <div class="tab-panel-container">
      <c-router-view></c-router-view>
    </div>
    <ul class="tab-nav-list">
      <li class="tab-nav-item pointer"
        @click="$router.replace({ name: 'home-tab-shelf' })"
        :class="{selected: $route.name === 'home-tab-shelf'}">
        <span class="material-symbols-outlined tab-icon">newsstand</span>
        书架
      </li>
      <li class="tab-nav-item pointer"
        v-if="preferences.opdsServerUrl"
        @click="$router.replace({ name: 'home-tab-opds' })"
        :class="{selected: $route.name === 'home-tab-opds'}">
        <span class="material-symbols-outlined tab-icon">public</span>
        图书馆
      </li>
      <li class="tab-nav-item pointer"
        @click="$router.replace({ name: 'home-tab-my'})"
        :class="{selected: $route.name === 'home-tab-my'}">
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
import CRouterView from '@/components/common/CRouterView.vue';
import { preferences } from '@/stores/preferences';
import { isSmall } from '@/utils/env';
import { defineAsyncComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const WebSettings = defineAsyncComponent(() => import('@/components/WebSettings.vue'))

const router = useRouter()

const settingsVisible = ref(false)

watch(router.currentRoute, route => {
  if (route.name !== 'home') {
    settingsVisible.value = false
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
  padding-bottom: 12px;
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
    width: 200px;
    flex-direction: column;
    border-right: 1px solid var(--border-color);
    border-top: none;
    margin-top: var(--sait);
    height: calc(100vh - var(--sait));
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
