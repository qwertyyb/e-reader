<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import UpdateDialog from '@/components/UpdateDialog.vue'
import { watch } from 'vue'
import router from '@/router'
import { clearAnimData, waits } from '@/stores/bookAnim'

const route = useRoute()
let oldRouteName: string | null | undefined | symbol = null

watch(() => route.name, (newVal, oldVal) => {
  console.log('route changed', newVal, oldVal)
  oldRouteName = oldVal
})

// 在离开过渡开始时调用
// 用这个来开始离开动画
async function onLeave(el: Element, done: () => void) {
  if (oldRouteName === 'local' && router.currentRoute.value.name === 'read') {
    // 如果当前路由在书架，下一个路由的页面是read, 则等待开书动画完成后再移除之前的路由
    await waits.waitOpen.promise
    done()
    return
  }
  if (oldRouteName === 'read' && router.currentRoute.value.name === 'local') {
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
        @leave="onLeave"
        :css="false"
      >
        <component :is="Component" />
      </transition>
    </router-view>
    <update-dialog></update-dialog>
  </div>
</template>

<style lang="scss" scoped>
.root-app {
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
}

</style>
