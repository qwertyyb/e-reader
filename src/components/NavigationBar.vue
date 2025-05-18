<template>
  <div class="navigator-bar">
    <div class="material-symbols-outlined back-icon"
      @click="$router.back()"
      v-if="!noMenu"
    >arrow_back_ios</div>
    <div class="navigation-title">
      <slot>{{ title }}</slot>
    </div>
    <div
      class="navigator-menu material-symbols-outlined"
      v-if="!noMenu"
      @click="$emit('menu')"
    >more_vert</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  noBack?: boolean,
  noMenu?: boolean,
  title?: string
}>()

defineEmits<{ menu: [] }>()
</script>

<style lang="scss" scoped>
.navigator-bar {
  height: 48px;
  width: calc(100% - 32px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  border-bottom: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  z-index: 10;
  padding-top: var(--sait);
  box-sizing: content-box;
}
.back-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
  cursor: pointer;
}
.navigator-menu {
  width: 28px;
  text-align: center;
  cursor: pointer;
  font-size: 24px;
}
</style>
