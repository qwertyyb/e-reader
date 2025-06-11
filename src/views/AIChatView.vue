<template>
  <route-page class="ai-chat-view">
    <navigation-bar title="AI问书" @menu="chatRef?.openPrfsDialog()"></navigation-bar>
    <a-i-chat class="ai-chat-container" ref="chatRef" no-header :book-title="params.bookTitle" :chapter-title="params.chapterTitle"></a-i-chat>
  </route-page>
</template>

<script setup lang="ts">
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import AIChat from '@/components/AIChat.vue';
import { shallowRef, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

const chatRef = useTemplateRef('chatRef')

const route = useRoute()
const params = shallowRef({
  bookTitle: route.query.bookTitle as string | undefined,
  chapterTitle: route.query.chapterTitle as string | undefined
})

</script>

<style lang="scss" scoped>
.ai-chat-view {
  display: flex;
  flex-direction: column;
}
.ai-chat-container {
  margin-top: 12px;
  height: 0;
  flex: 1;
}
</style>
