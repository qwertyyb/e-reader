<template>
  <c-dialog :visible="visible" @close="$emit('close')" title="书籍信息">
    <div class="book-info" v-if="book">
      <img :src="book.cover" alt="" class="book-info-image">
      <div class="book-info-right">
        <h2 class="book-info-title">{{ book.title }}</h2>
        <p class="book-info-wordcount">字数: {{ wordCount }}字</p>
      </div>
    </div>
    <ul class="chapter-info-list">
      <li class="chapter-info-item">
        <h3 class="chapter-info-title">章节</h3>
        <p class="chapter-info-content">{{ chapterInfo.total }} 个</p>
      </li>
      <li class="chapter-info-item">
        <h3 class="chapter-info-title">章节层级</h3>
        <p class="chapter-info-content">{{ chapterInfo.levelsCount }}个</p>
      </li>
      <template v-if="chapterInfo.levelsCount > 1">
        <li class="chapter-info-item" v-for="levelInfo in chapterInfo.levels" :key="levelInfo.level">
          <h3 class="chapter-info-title">{{ levelLabels[levelInfo.level] }}级章节</h3>
          <p class="chapter-info-content">{{ levelInfo.count }}个</p>
        </li>
      </template>
    </ul>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import { contentStore } from '@/services/storage';
import { computed, inject, ref, watch, type Ref } from 'vue';

const props = defineProps<{
  visible: boolean
}>()

defineEmits<{
  close: []
}>()

const book = inject<Ref<ILocalBook | null>>('book')
const chapterList = inject<Ref<IChapter[]>>('chapterList')

const wordCount = ref('')

const getWordCount = async () => {
  const id = book?.value?.id
  if (!id) return
  const { content } = await contentStore.get(Number(id))
  wordCount.value = content?.length.toLocaleString() || ''
}

const levelLabels = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
const chapterInfo = computed(() => {
  const total = chapterList?.value.length ?? 0
  const levelCount: Record<number, number> = {}
  chapterList?.value.forEach(chapter => {
    if (!levelCount[chapter.level]) {
      levelCount[chapter.level] = 1
    } else {
      levelCount[chapter.level] += 1
    }
  })
  return {
    total,
    levelsCount: Object.keys(levelCount).length,
    levels: Object.keys(levelCount).map(level => {
      const numericLevel = Number(level)
      return { level: numericLevel, count: levelCount[numericLevel] }
    })
  }
})

watch(() => props.visible, async (visible) => {
  if (visible) {
    getWordCount()
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
.book-info {
  display: flex;
  align-items: center;
}
.book-info-image {
  width: 100px;
  aspect-ratio: 3 / 4;
  margin-right: 12px;
}
.book-info-title {
  font-size: 18px;
}
.book-info-wordcount {
  opacity: 0.6;
  font-size: 14px;
  margin-top: 6px;
}
.chapter-info-list {
  display: flex;
  list-style: none;
  padding: 0;
  margin-top: 16px;
  border-top: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
}
.chapter-info-item {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100px;
  flex-shrink: 0;
  position: relative;
}
.chapter-info-item +.chapter-info-item::before {
  content: " ";
  display: block;
  position: absolute;
  top: 20px;
  left: 0;
  width: 1px;
  height: 40px;
  background: light-dark(#ddd, #333);
}
</style>
