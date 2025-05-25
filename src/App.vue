<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import UpdateDialog from '@/components/UpdateDialog.vue'
import { watch } from 'vue'
import router, { transitionName } from '@/router'
import { clearAnimData, waits, animData } from '@/stores/bookAnim'
import { disableAnim } from '@/utils/env'
const route = useRoute()
let oldRouteName: string | null | undefined | symbol = null

watch(() => route.name, (newVal, oldVal) => {
  oldRouteName = oldVal
})

// 在离开过渡开始时调用
// 用这个来开始离开动画
async function onLeave(el: Element, done: () => void) {
  if (animData.value.trace && router.currentRoute.value.name === 'read') {
    // 下一个路由的页面是read, 则等待开书动画完成后再移除之前的路由
    await waits.waitOpen.promise
    done()
    return
  }
  if (oldRouteName === 'read' && animData.value.trace) {
    // 如果当前路由是阅读页面，下一个路由是书架，则需要等待关书动画完成后再移除之前的路由
    await waits.waitClose.promise
    done()
    clearAnimData()
    return
  }
  done()
}
</script>

<template>
  <div class="root-app">
    <router-view v-slot="{ Component }">
      <transition
        :name="transitionName"
        @leave="onLeave"
        :css="!disableAnim"
      >
        <keep-alive exclude="TabView,ReadView">
          <component :is="Component"
            :key="typeof $route.meta.getKey === 'function' ? $route.meta.getKey($route) : undefined" />
        </keep-alive>
      </transition>
    </router-view>
    <update-dialog></update-dialog>
  </div>
</template>

<style lang="scss">
.root-app {
  min-height: var(--page-height);
  background-color: var(--bg-color);
  touch-action: none;
}
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;
  border: 1px solid var(--border-color);
  font-weight: 500;
  &.primary-btn {
    background: var(--primary-btn-color);
    color: #fff;
    border: none;
  }
  &.text-btn {
    color: var(--primary-btn-color);
    border: none;
  }
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  & + .btn {
    margin-left: 12px;
  }
}
</style>
