<template>
  <ion-page class="prfs-view">
    <NavigationBar title="设置" :no-menu="true"/>

    <main class="prfs-main">
      <SettingsPanel :name="panelName || 'basic'"></SettingsPanel>
    </main>
  </ion-page>
</template>

<script lang="ts" setup>
import { IonPage, onIonViewWillEnter } from '@ionic/vue';
import NavigationBar from '@/components/NavigationBar.vue';
import SettingsPanel from '@/components/SettingsPanel.vue';

withDefaults(defineProps<{ panelName: string }>(), { panelName: 'basic' })

onIonViewWillEnter(() => {
  console.log('onIonViewWillEnter')
})

</script>

<style lang="scss" scoped>
@use "../styles/variables";

.prfs-view {
  height: var(--page-height);
  display: flex;
  flex-direction: column;
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
