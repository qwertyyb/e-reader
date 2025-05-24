<template>
  <div class="navigation-bar">
    <div class="navigation-bar-wrapper">
      <div class="back-slot-wrapper" v-if="!noBack">
        <slot name="back">
          <div class="material-symbols-outlined back-icon"
            @click="$router.back()"
          >arrow_back_ios</div>
        </slot>
      </div>
      <div class="navigation-title">
        <slot>{{ title }}</slot>
      </div>
      <div
        class="navigation-menu material-symbols-outlined"
        v-if="!noMenu"
        @click="$emit('menu')"
      >more_vert</div>
    </div>
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
.navigation-bar {
  width: 100%;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  z-index: 10;
  padding-top: var(--sait);
  position: relative;
}
.navigation-bar-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  height: 48px;
  padding: 0 calc(16px + 28px);
  text-align: center;
}
.navigation-title {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  text-align: center;
}
.back-slot-wrapper {
  width: 28px;
  text-align: center;
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.back-icon, .navigation-menu {
  width: 100%;
  text-align: center;
  cursor: pointer;
}
.back-icon {
  font-size: 20px;
}
.navigation-menu {
  font-size: 24px;
  right: 16px;
}
</style>
