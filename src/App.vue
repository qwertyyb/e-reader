<script setup lang="ts">
import { RouterView } from 'vue-router'
import UpdateDialog from '@/components/UpdateDialog.vue'
import { ref } from 'vue'
import router from '@/router'
import type ReadView from '@/views/ReadView.vue'

const component = ref<InstanceType<typeof ReadView>>()

let removeBeforeRoute: () => void

// 在离开过渡开始时调用
// 用这个来开始离开动画
async function onLeave(el: Element, done: () => void) {
  console.log('onLeave', component.value, router.currentRoute.value)
  if (router.currentRoute.value.name === 'read') {
    // 如果下一个路由的页面是read, 则等待开书动画完成后再移除之前的路由
    removeBeforeRoute = done
    return
  }
  done()
}

// 在元素被插入到 DOM 之后的下一帧被调用
// 用这个来开始进入动画
async function onEnter(el: Element, done: () => void) {
  console.log('onEnter', component.value, router.currentRoute.value)
  const route = router.currentRoute.value
  if (route.name === 'read' && route.query.originalRect && component.value?.openBook) {
    // 即将要进入的路由是阅读页面，则执行开书动画，然后移除之前的路由页面
    await component.value.openBook()
    removeBeforeRoute()
    done()
    return
  }
  done()
}
</script>

<template>
  <div class="root-app">
    <router-view v-slot="{ Component }">
      <!-- <transition
        @enter="onEnter"
        @leave="onLeave"
        :css="false"
      > -->
        <component :is="Component" ref="component" />
      <!-- </transition> -->
    </router-view>
    <update-dialog></update-dialog>
  </div>
</template>

<style lang="scss" scoped>
.root-app {
  background-color: light-dark(var(--light-bg-color), var(--dark-bg-color));
}

</style>
