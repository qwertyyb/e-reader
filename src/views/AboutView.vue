<template>
  <slide-back class="about-view">
    <navigation-bar title="关于" no-menu></navigation-bar>
    <img class="logo" src="/icons/icon256.png" />
    <h3 class="name" @click="toDebugView">E Reader</h3>
    <p class="version" v-if="version">v{{ version }}({{ buildVersion }})</p>
    <button class="check-update-btn btn primary-btn" @click="checkUpdates">检查版本更新</button>
  </slide-back>
</template>

<script setup lang="ts">
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import { version, buildVersion } from '@/version';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const checkUpdates = async () => {
  document.dispatchEvent(new CustomEvent('app:checkupdates', { detail: { slient: false } }))
}

const toDebugView = (() => {
  let clickCount = 0;
  let lastClickTime = 0;
  return () => {
    const currentTime = Date.now();
    console.log(currentTime - lastClickTime, clickCount)
    if (currentTime - lastClickTime < 400) {
      clickCount++;
      if (clickCount >= 5) {
        clickCount = 0;
        router.push({ name: 'debug' });
      } else {
        clickCount += 1;
      }
    } else {
      clickCount = 1;
    }
    lastClickTime = currentTime;
  };
})()



onMounted(checkUpdates)
</script>


<style lang="scss" scoped>
.about-view {
  text-align: center;
  height: var(--page-height);
}
.about-view > * {
  margin-bottom: 16px;
}
.about-view .logo {
  width: 128px;
  height: 128px;
  margin-top: 24px;
}
.name {
  font-size: 24px;
  font-weight: 500;
}
.about-view .version {
  font-size: 16px;
  opacity: 0.6;
}
.check-update-btn {
  margin-top: 16px;
  font-size: 16px;
}
</style>
