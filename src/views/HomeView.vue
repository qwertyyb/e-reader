<template>
  <div class="tab-view book-shelf">
    <div class="tab-panel-container">
      <transition :name="curTab === 'my' ? 'tab-slide-next' : 'tab-slide-prev'">
        <shelf-view v-if="curTab === 'shelf'"></shelf-view>
        <my-view v-else></my-view>
      </transition>
    </div>
    <ul class="tab-nav-list" v-if="preferences.opdsServerUrl">
      <li class="tab-nav-item pointer"
        @click="curTab = 'shelf'"
        :class="{selected: curTab === 'shelf' }">
        <span class="material-symbols-outlined tab-icon">newsstand</span>
        书架
      </li>
      <li class="tab-nav-item pointer"
        v-if="preferences.opdsServerUrl"
        @click="$router.push({ name: 'opds' })"
        :class="{selected: $route.name === 'remote'}">
        <span class="material-symbols-outlined tab-icon">public</span>
        图书馆
      </li>
      <li class="tab-nav-item pointer"
        @click="curTab = 'my'"
        :class="{selected: curTab === 'my' }">
        <span class="material-symbols-outlined tab-icon">person</span>
        我的
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import ShelfView from '@/views/ShelfView.vue';
import MyView from '@/views/MyView.vue';
import { preferences } from '@/stores/preferences';
import { ref } from 'vue';
import router from '@/router';

const getDefaultTab = () => {
  const tab  = router.currentRoute.value.query.tab as string | undefined;
  if (tab === 'my' || tab === 'shelf') {
    return tab;
  }
  return 'shelf';
}
const curTab = ref(getDefaultTab())

</script>

<style lang="scss" scoped>
.tab-view {
  display: flex;
  flex-direction: column;
  height: var(--page-height);
}
.tab-panel-container {
  position: relative;
  flex: 1;
  overflow-x: hidden;
  display: flex;
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
  }
}
</style>
