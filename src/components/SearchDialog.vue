<template>
  <c-dialog @close="$emit('close')"
    :visible="props.visible"
    height="90vh"
    title="全文搜索"
    class="search-dialog">
    <section class="search-section">
      <header class="search-header">
        <div class="search-input">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="text" v-model.trim="keyword" />
          <span class="material-symbols-outlined close-icon" v-if="keyword" @click="clearSearch">close</span>
          <span class="material-symbols-outlined regexp-icon"
            :class="{active: isRegExp}"
            @click="isRegExp = !isRegExp">regular_expression</span>
          <span class="search-btn" @click="search()">搜索</span>
        </div>
        <keyword-candidates v-if="!loading && !completed" :book-id="bookId" @selected="search"></keyword-candidates>
      </header>
      <div class="search-empty-results" v-if="completed && results.length <= 0">
        <span class="material-symbols-outlined icon">find_in_page</span>
        <p class="empty-title">未找到结果</p>
      </div>
      <virtual-list
        v-else
        class="search-result-list"
        data-key="id"
        :data-sources="results"
        ref="catalog"
        item-class="virtual-result-item"
      >
        <template v-slot="{ source }">
          <div class="search-result-chapter"
            :data-catalog-level="source.level || 1"
            :data-catalog-id="source.id">
            <h3 class="chapter-title">{{ source.chapter.title }}</h3>
            <ul class="chapter-result-list">
              <li v-for="(item, index) in source.results"
                :key="index"
                @click="toResult(source, item)"
                class="chapter-result-item">
                <div class="result-text" v-html="item.text"></div>
              </li>
            </ul>
          </div>
        </template>
      </virtual-list>
    </section>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import KeywordCandidates from '@/components/KeywordCandidates.vue';
import { localBookService } from '@/services/LocalBookService';
import { contentStore, keywordsStore } from '@/services/storage';
import { ref } from 'vue';

const props = defineProps<{
  bookId: string | number,
  visible: boolean
}>()

const emits = defineEmits<{
  close: [],
  jump: [{ cursor: number, chapterId: string }]
}>()

interface IResult {
  id: string;
  chapter: IChapter;
  results: {
    text: string;
    cursor: number;
  }[]
}

const keyword = ref('')
const isRegExp = ref(false)
const loading = ref(false)
const completed = ref(false)
const results = ref<IResult[]>([])

const clearSearch = () => {
  keyword.value = ''
  loading.value = false
  completed.value = false
  isRegExp.value = false
  results.value = []
}

const search = async (candidate?: IKeyword) => {
  if (candidate) {
    keyword.value = candidate.keyword
  }
  if (!keyword.value.trim()) {
    clearSearch()
    return;
  }
  loading.value = true
  const { content } = await contentStore.get(Number(props.bookId))
  const chapterList = await localBookService.getChapterList(String(props.bookId))
  const query = keyword.value.trim()
  if (candidate) {
    Promise.resolve().then(async () => {
      keywordsStore.updateLastUsedAt(candidate.id)
    })
  } else {
    Promise.resolve().then(async () => {
      const date = new Date().toISOString()
      await keywordsStore.add({ keyword: query, bookId: Number(props.bookId), createdAt: date, lastUsedAt: date })
    })
  }
  const reg = isRegExp.value ? new RegExp(query) : null
  const txts = content.split('\n')
  chapterList.forEach((chapter) => {
    const chapterResults: IResult = {
      id: chapter.id,
      chapter,
      results: [],
    }
    const lines = txts.slice(chapter.cursorStart, chapter.cursorEnd)
    lines.forEach((line, index) => {
      const match = isRegExp.value && reg ? reg.test(line.trim()) : line.trim().includes(query)
      if (match) {
        chapterResults.results.push({
          text: line.trim().replaceAll(query, '<mark>$&</mark>'),
          cursor: index + chapter.cursorStart,
        })
      }
    })
    if (chapterResults.results.length > 0) {
      results.value.push(chapterResults)
    }
  })
  completed.value = true
  loading.value = false
}

const toResult = (source: IResult, result: { cursor: number, text: string }) => {
  // Handle result click
  emits('jump', {
    cursor: result.cursor,
    chapterId: source.chapter.id,
  })
}

</script>

<style lang="scss" scoped>
.search-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  & > * {
    width: 100%;
  }
}
.search-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 12px;
  & > * {
    width: 100%;
  }
}
.search-header .search-input {
  display: flex;
  align-items: center;
  position: relative;
  flex: 1;
  background: light-dark(#d8d8d8, #333);
  border-radius: 9999px;
  padding: 0 8px;
  height: 30px;
}
.search-icon {
  font-size: 20px;
  color: gray;

}
.search-input input {
  outline: none;
  border: none;
  background: none;
  padding: 4px 32px 4px 4px;
  font-size: 13px;
  flex: 1;
}
.search-btn {
  font-size: 12px;
  padding-left: 12px;
  padding-right: 8px;
  height: 100%;
  line-height: 30px;
  position: relative;
  cursor: pointer;
  &::before {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    content: '';
    display: block;
    width: 1px;
    height: 14px;
    background: light-dark(#bbb, #777);
  }
}
.regexp-icon {
  font-size: 18px;
  color: light-dark(#555, #aaa);
  padding: 0 4px;
  height: 100%;
  line-height: 30px;
  margin-right: 8px;
}
.regexp-icon.active {
  background: light-dark(#bbb, #444);
}
.close-icon {
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  background: light-dark(#acacac, #888);
  padding: 2px;
  color: light-dark(#fff, #444);
  margin-right: 8px;
}

.search-empty-results {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 80%;
  color: #555;
}

.search-result-list {
  height: 0;
  flex: 1;
  overflow: auto;
}
.chapter-title {
  font-size: 16px;
  font-weight: 600;
  padding: 8px 0;
}
.chapter-result-list {
  margin-bottom: 8px;
}
.chapter-result-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  color: #555;
  background: light-dark(var(--light-card-bg-color), var(--dark-card-bg-color));
  border-radius: 4px;
  letter-spacing: 0.5px;
  &:deep(mark) {
    text-decoration: none;
    color: light-dark(rgb(0, 64, 255), rgb(70, 116, 255));
  }
}
.chapter-result-item + .chapter-result-item {
  margin-top: 12px;
}
</style>
