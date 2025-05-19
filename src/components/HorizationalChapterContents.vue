<template>
  <div class="horizontal-chapter-contents" ref="el">
    <ul class="chapter-content-list">
      <li class="chapter-content" v-for="chapter in chapterList" :key="chapter.id" v-html="contents.get(chapter)"></li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

const props = defineProps<{
  chapterList: IChapter[],
  defaultChapterId: string,
  defaultCursor: number,
  loadChapter: (chapter: IChapter, chapterIndex: number) => Promise<string>
}>()

const emits = defineEmits<{
  progress: [{ chapter: IChapter, cursor: number, chapterIndex: number }]
}>()

const el = useTemplateRef('el')
const keeps = 5
const contents = new WeakMap<IChapter, string>()

console.log(props, emits, keeps, )

</script>

<style scoped>
.horizontal-chapter-contents {
  display: flex;
  align-items: center;
  width: 100%;
  user-select: none;
}
.page-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.pages {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
}
.page {
  flex: 1 0 100%;
  padding: 1em;
  box-sizing: border-box;
  background: #fff;
  min-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px #0001;
  margin: 0 8px;
}
.nav-btn {
  background: none;
  border: none;
  font-size: 2em;
  cursor: pointer;
  padding: 0 0.5em;
  color: #888;
  transition: color 0.2s;
}
.nav-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
