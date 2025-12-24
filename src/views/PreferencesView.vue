<template>
  <route-page class="prfs-view" tag="section">
    <NavigationBar title="设置" :no-menu="true"/>

    <main class="prfs-main">
      <SettingsPanel :name="name || 'basic'"></SettingsPanel>
    </main>
  </route-page>
</template>

<script lang="ts" setup>
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import SettingsPanel from '@/components/SettingsPanel.vue';

withDefaults(defineProps<{ name: string }>(), { name: 'basic' })

</script>

<style lang="scss" scoped>
@use "../styles/variables";

.prfs-view {
  height: var(--page-height);
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

@media (width > variables.$MAX_SMALL_WIDTH) {
  .prfs-view {
    height: auto;
    margin: auto;
    width: 480px;
    border-radius: 6px;
    overflow: hidden;
  }
}

.prfs-main {
  width: calc(100% - 32px);
  margin: 16px;
}
</style>
