<template>
  <div class="tab-view book-shelf">
    <app-header></app-header>
    <div class="tab-panel-container">
      <router-view></router-view>
    </div>
    <ul class="tab-nav-list">
      <li class="tab-nav-item">
        <span class="material-icons">menu_book</span>
        本地
      </li>
      <li class="tab-nav-item">
        <span class="material-icons">cloud</span>
        在线
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
</script>

<style lang="scss" scoped>
.tab-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.tab-panel-container {
  padding-top: calc(env(safe-area-inset-top) + 48px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 60px);
  background: #fff;
  min-height: 100vh;
}
.tab-nav-list {
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  width: 100%;
  height: 54px;
  box-sizing: content-box;
  border-top: 1px solid #efefef;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: #fff;
}
.tab-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
