<template>
  <component class="route-page" :is="tag || 'section'">
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
defineProps<{ tag?: string }>()
</script>

<style lang="scss" scoped>
.route-page {
  background: var(--bg-color);
  height: var(--page-height);
  padding-bottom: var(--saib);
}
</style>
