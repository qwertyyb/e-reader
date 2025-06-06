<template>
  <div class="chapter-list">
    <div class="chapter-item">
      <div class="chapter-item-label"
        v-if="curParentChapter"
        @click="jumpTo(curParentChapter)"
      >{{ curParentChapter.title }}</div>
      <div class="chapter-item-actions">
        <span class="material-symbols-outlined location-icon action-icon"
          v-if="typeof props.curChapterIndex !== 'undefined'"
          @click="scrollToChapter(props.chapterList[props.curChapterIndex])"
        >my_location</span>
        <span class="material-symbols-outlined search-icon action-icon"
          v-if="enableSearch"
          @click="$emit('search')"
        >search</span>
        <span class="material-symbols-outlined settings-icon action-icon"
          v-if="enableSettings"
          @click="$emit('settings')"
        >tune</span>
        <span class="material-symbols-outlined collapse-icon action-icon"
          @click="toggleFoldAll"
          :title="isAllFold ? '展开所有' : '折叠所有'"
          v-if="toggleFoldVisible"
        >
          {{ isAllFold ? 'unfold_more' : 'unfold_less' }}
        </span>
      </div>
    </div>
    <c-virtual-list
      class="chapter-virtual-list"
      :class="`max-level-${levels.length}`"
      data-key="id"
      :data-sources="visibleChapterList"
      ref="virtual-list"
      :estimate-size="42"
      :active-index="curVisibleChapterListIndex"
      @scroll="scrollHandler"
    >
      <template v-slot="{ source, index }">
        <div class="chapter-item"
          @click="jumpTo(source)"
          :class="{active: index === curVisibleChapterListIndex}"
          :data-catalog-level="source.level || 1"
          :data-catalog-id="source.id">
          <span class="material-symbols-outlined expand-icon transform-transition"
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
  enableSettings?: boolean
  enableSearch?: boolean
}>()

const emits = defineEmits<{
  tap: [I, number],
  settings: [],
  search: []
}>()

const virtualListRef = useTemplateRef('virtual-list')

const isParentFold = (chapter?: I) => {
  if (!chapter) return false
  if (!chapter.parentId) return false
  if (foldState.value[chapter.parentId]) return true
  const parent = props.chapterList.find(item => item.id === chapter.parentId)
  return isParentFold(parent)
}

const visibleChapterList = computed(() => {
  return props.chapterList.filter(chapter => {
    if (!chapter.parentId) return true
    return !isParentFold(chapter)
  })
})

const findVisibleChapterListIndex = (chapter?: I) => {
  if (!chapter) return 0
  const index = visibleChapterList.value.findIndex(item => item.id === chapter.id)
  if (index >= 0) return index
  // 未在列表中找到，说明很可能被折叠起来了，定位父级章节
  const parent = props.chapterList.find(item => item.id === chapter.parentId)
  return findVisibleChapterListIndex(parent)
}

const curVisibleChapterListIndex = computed(() => {
  if (typeof props.curChapterIndex === 'undefined') return 0
  const target = props.chapterList[props.curChapterIndex]
  return findVisibleChapterListIndex(target)
})

const levels = computed(() => {
  return [...new Set(props.chapterList.map(item => item.level))]
})

const curParentChapter = ref<I | null>()

const jumpTo = (chapter: I) => {
  const index = props.chapterList.indexOf(chapter)
  if (index < 0) return;
  emits('tap', chapter, index)
}

const canExpand = (source: I) => {
  // 如果此目录有已折叠或未折叠状态，则应该显示折叠按钮
  if (typeof foldState.value[source.id] === 'boolean') return true

  // 如果有以此章节为父章节的章节，则应该显示折叠按钮
  const hasChildren = props.chapterList.some(item => item.parentId === source.id)
  return hasChildren
}

const toggleFoldVisible = computed(() => {
  let level = -1
  for(let i = 0; i < props.chapterList.length; i += 1) {
    const curLevel = props.chapterList[i].level
    if (level > 0 && curLevel !== level) {
      console.log(level, curLevel)
      return true
    }
    level = curLevel
  }
  return false
})

const foldState = ref<Record<string, boolean>>({})
const isAllFold = computed(() => {
  const parentIds = new Set(props.chapterList.map(chapter => chapter.parentId).filter(Boolean) as string[])
  const fold = [...parentIds].every(id => foldState.value[id])
  return fold
})

const toggleExpand = (source: I) => {
  foldState.value[source.id] = !foldState.value[source.id]
}

const toggleFoldAll = () => {
  // 折叠全部，把带有 parentId 的章节的 parent 全部设置为已折叠
  const parentIds = new Set(props.chapterList.map(chapter => chapter.parentId).filter(Boolean) as string[])
  const newFoldState: Record<string, boolean> = {}
  parentIds.forEach(id => {
    newFoldState[id] = !isAllFold.value
  })
  foldState.value = newFoldState
}

const scrollToChapter = (chapter: IChapter) => {
  // 查找在列表中的index
  const visibleChapterIndex = visibleChapterList.value.findIndex(item => item.id === chapter.id)
  curParentChapter.value = null
  virtualListRef.value?.scrollToIndex(visibleChapterIndex)
}

const scrollHandler = (event: Event, range: { start: number, end: number }) => {
  // 查找一下当前的范围落在哪个上级目录了
  const start = visibleChapterList.value[range.start]
  if (!start?.parentId) {
    curParentChapter.value = null
    return
  }
  const parent = props.chapterList.find(item => item.id === start.parentId)
  curParentChapter.value = parent || null
}

</script>

<style lang="scss" scoped>
.chapter-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  & > * {
    width: 100%;
  }
}
.chapter-item-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}
.action-icon {
  font-size: 24px;
  height: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  & + .action-icon {
    margin-left: 12px;
  }
  &.search-icon {
    font-size: 28px;
  }
}
.chapter-virtual-list {
  flex: 1;
  overflow: auto;
  @mixin levelIndent($maxLevel) {
    @for $i from 2 through $maxLevel {
      .chapter-item[data-catalog-level="#{$i}"] {
        padding-left: 16px + 24px * ($i - 1);
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
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 42px;
  cursor: pointer;
  font-size: 15px;
  &.fixed-item {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--bg-color);
    z-index: 1;
  }
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
  font-size: 24px;
  &.fold {
    transform: rotate(0);
  }
}
</style>
