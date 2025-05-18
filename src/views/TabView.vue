<template>
  <div class="tab-view book-shelf">
    <div class="tab-panel-container">
      <router-view></router-view>
    </div>
    <ul class="tab-nav-list">
      <li class="tab-nav-item pointer" @click="$router.push({ name: 'local' })" :class="{active: $route.name === 'local'}">
        <span class="material-symbols-outlined tab-icon">newsstand</span>
        书架
      </li>
      <li class="tab-nav-item pointer" @click="$router.push({ name: 'remote' })" :class="{active: $route.name === 'remote'}">
        <span class="material-symbols-outlined tab-icon">storefront</span>
        阅读
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.tab-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.tab-panel-container {
  padding-bottom: calc(var(--saib) + 60px);
  height: 100vh;
  position: relative;
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
  font-weight: 500;
  &.active {
    color: light-dark(blue, rgb(58, 127, 255));
  }
  .material-symbols-outlined {
    color: inherit;
    font-size: 24px;
  }
}
</style>
