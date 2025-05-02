<template>
  <c-virtual-list
    class="chapter-list"
    data-key="id"
    :data-sources="visibleChapterList"
    ref="catalog"
    :estimate-size="42"
    :active-index="curChapterIndex"
  >
    <template v-slot="{ source, index }">
      <div class="chapter-item"
        @click="emits('tap', source, index)"
        :class="{active: index === curChapterIndex}"
        :data-catalog-level="source.level || 1"
        :data-catalog-id="source.id">
        <span class="material-symbols-outlined expand-icon"
          :class="{fold: foldState[source.id]}"
          v-if="canExpand(source)"
          @click.stop="toggleExpand(source)"
        >chevron_right</span>
        <div class="chapter-item-label">{{ source.title }}</div>
      </div>
    </template>
  </c-virtual-list>
</template>

<script setup lang="ts" generic="I extends IChapter">
import CVirtualList from '@/components/common/CVirtualList.vue';
import { computed, ref } from 'vue';

const props = defineProps<{
  chapterList: I[]
  curChapterIndex?: number
}>()

const emits = defineEmits<{
  tap: [I, number]
}>()

const visibleChapterList = computed(() => {
  return props.chapterList.filter(chapter => {
    return !chapter.parentId || !foldState.value[chapter.parentId]
  })
})

const canExpand = (source: I) => {
  // 如果此目录有已折叠或未折叠状态，则应该显示折叠按钮
  if (typeof foldState.value[source.id] === 'boolean') return true

  // 如果有以此章节为父章节的章节，则应该显示折叠按钮
  const hasChildren = props.chapterList.some(item => item.parentId === source.id)
  return hasChildren
}

const foldState = ref<Record<string, boolean>>({})

const toggleExpand = (source: I) => {
  foldState.value[source.id] = !foldState.value[source.id]
}

</script>

<style lang="scss" scoped>
.chapter-list {
  height: 100%;
  overflow: auto;
}
.chapter-item {
  padding: 0 16px;
  border-bottom: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 42px;
  cursor: pointer;
  font-size: 15px;
}
.chapter-item[data-catalog-level="2"] .chapter-item-label {
  margin-left: 24px;
}
.chapter-item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chapter-item.active .chapter-item-label {
  color: rgb(29, 132, 146);
  font-weight: bold;
}
.expand-icon {
  transform: rotate(90deg);
  transition: transform .2s;
  @keyframes rotate0 {
    0% { transform: rotate(90deg) }
    100% { transform: rotate(0) }
  }
  &.fold {
    transform: rotate(0);
    // animation: rotate0 .2s both;
  }
}
</style>
