<template>
  <div class="tab-view book-shelf">
    <div class="tab-panel-container">
      <transition :name="transitionName">
        <shelf-view v-if="curTab === 'shelf'"></shelf-view>
        <o-p-d-s-view v-else-if="curTab === 'opds'" no-back></o-p-d-s-view>
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
    </ul>
  </div>
</template>

<script setup lang="ts">
import ShelfView from '@/views/ShelfView.vue';
import MyView from '@/views/MyView.vue';
import OPDSView from '@/views/OPDSView.vue';
import { preferences } from '@/stores/preferences';
import { ref, watch } from 'vue';
import router from '@/router';

const getDefaultTab = () => {
  const tab  = router.currentRoute.value.query.tab as string | undefined;
  if (tab === 'my' || tab === 'shelf') {
    return tab;
  }
  return 'shelf';
}
const curTab = ref(getDefaultTab())

const tabNames = ['shelf', 'opds', 'my']
const transitionName = ref('tab-slide-next')

watch(curTab, (tab, prevTab) => {
  // 要切换的tab 位于当前 tab 之前，则使用 tab-slide-prev
  // 否则使用 tab-slide-next
  transitionName.value = tabNames.indexOf(tab) < tabNames.indexOf(prevTab) ? 'tab-slide-prev' : 'tab-slide-next';
})

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
