<template>
  <div class="tab-view book-shelf">
    <app-header></app-header>
    <div class="tab-panel-container">
      <router-view></router-view>
    </div>
    <ul class="tab-nav-list">
      <li class="tab-nav-item" @click="$router.push({ name: 'local' })">
        <span class="material-symbols-outlined">newsstand</span>
        本地
      </li>
      <li class="last-read-item">
        <last-read-book></last-read-book>
      </li>
      <li class="tab-nav-item" @click="$router.push({ name: 'remote' })">
        <span class="material-symbols-outlined">storefront</span>
        在线
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import LastReadBook from '@/components/LastReadBook.vue';
</script>

<style lang="scss" scoped>
.tab-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.tab-panel-container {
  padding-top: calc(var(--sait) + 48px);
  padding-bottom: calc(var(--saib) + 60px);
  min-height: 100vh;
}
.tab-nav-list {
  display: flex;
  list-style: none;
  padding-bottom: var(--saib);
  width: 100%;
  height: 54px;
  box-sizing: content-box;
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
}
.tab-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.last-read-item {
  align-self: flex-end;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}
</style>
