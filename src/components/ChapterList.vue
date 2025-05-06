<template>
  <div class="chapter-list">
    <div class="chapter-item"
      v-if="curParentChapter"
      :data-catalog-level="curParentChapter.chapter.level || 1"
      :data-catalog-id="curParentChapter.chapter.id">
      <span class="material-symbols-outlined expand-icon"
        :class="{fold: foldState[curParentChapter.chapter.id]}"
        @click="toggleExpand(curParentChapter.chapter)"
      >chevron_right</span>
      <div class="chapter-item-label"
        @click="emits('tap', curParentChapter.chapter, curParentChapter.index)"
      >{{ curParentChapter.chapter.title }}</div>
      <span class="material-symbols-outlined location-icon"
        @click="scrollToChapter(curParentChapter.chapter)"
      >my_location</span>
    </div>
    <c-virtual-list
      class="chapter-virtual-list"
      :class="`max-level-${levels.length}`"
      data-key="id"
      :data-sources="visibleChapterList"
      ref="virtual-list"
      :estimate-size="42"
      :active-index="curVisibleChapterListIndex"
    >
      <template v-slot="{ source, index }">
        <div class="chapter-item"
          @click="emits('tap', source, index)"
          :class="{active: index === curVisibleChapterListIndex}"
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
  </div>
</template>

<script setup lang="ts" generic="I extends IChapter">
import CVirtualList from '@/components/common/CVirtualList.vue';
import { computed, ref, useTemplateRef } from 'vue';

const props = defineProps<{
  chapterList: I[]
  curChapterIndex?: number
}>()

const emits = defineEmits<{
  tap: [I, number]
}>()

const virtualListRef = useTemplateRef('virtual-list')

const visibleChapterList = computed(() => {
  return props.chapterList.filter(chapter => {
    return !chapter.parentId || !foldState.value[chapter.parentId]
  })
})

const curVisibleChapterListIndex = computed(() => {
  if (typeof props.curChapterIndex === 'undefined') return 0
  const target = props.chapterList[props.curChapterIndex]
  const index = visibleChapterList.value.findIndex(item => item.id === target.id)
  if (index >= 0) return index
  // 如果在列表中没有找到，说明被折叠起来了，则需要定位到上级目录
  const parentIndex = visibleChapterList.value.findIndex(item => item.id === target.parentId)
  return parentIndex
})

const levels = computed(() => {
  return [...new Set(props.chapterList.map(item => item.level))]
})

const curParentChapter = computed(() => {
  if (typeof props.curChapterIndex ==='undefined') return null
  const curChapter = props.chapterList[props.curChapterIndex]
  if (typeof curChapter.parentId === 'undefined') return null
  const parentIndex = props.chapterList.findIndex(item => item.id === curChapter.parentId)
  if (parentIndex < 0) return null
  return { index: parentIndex, chapter: props.chapterList[parentIndex]}
})

const canExpand = (source: I) => {
  // 如果此目录有已折叠或未折叠状态，则应该显示折叠按钮
  if (typeof foldState.value[source.id] === 'boolean') return true

  // 如果有以此章节为父章节的章节，则应该显示折叠按钮
  const hasChildren = props.chapterList.some(item => item.parentId === source.id)
  console.log(hasChildren, source, props.chapterList.find(item => item.parentId === source.id))
  return hasChildren
}

const foldState = ref<Record<string, boolean>>({})

const toggleExpand = (source: I) => {
  foldState.value[source.id] = !foldState.value[source.id]
}

const scrollToChapter = (chapter: IChapter) => {
  // 查找在列表中的index
  const visibleChapterIndex = visibleChapterList.value.findIndex(item => item.id === chapter.id)
  virtualListRef.value?.scrollToIndex(visibleChapterIndex)
}

</script>

<style lang="scss" scoped>
.chapter-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  & > * {
    width: 100%;
  }
}
.location-icon {
  font-size: 20px;
  margin-left: auto;
  height: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  opacity: 0.7;
}
.chapter-virtual-list {
  flex: 1;
  overflow: auto;
  @mixin levelIndent($maxLevel) {
    @for $i from 2 through $maxLevel {
      .chapter-item[data-catalog-level="#{$i}"] .chapter-item-label {
        margin-left: 24px * ($i - 1);
      }
    }
  }
  @for $level from 2 through 6 {
    &.max-level-#{$level} {
      @include levelIndent($level);
    }
  }
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
