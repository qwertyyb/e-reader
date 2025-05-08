<template>
  <navigation-bar title="测试解析"></navigation-bar>
  <div class="upload-book-section">
    <input type="file" @change="onFileChange">
    支持 txt 和 epub 文件
  </div>
  <div class="import-view">
    <section class="settings-section" v-if="fileName.endsWith('.txt')">
      <h2 class="settings-section-title">目录设置</h2>
      <ul class="toc-settings settings-content">
        <li class="setting-item">
          <h3 class="setting-item-label">一级目录</h3>
          <input type="text" class="setting-input" v-model.trim="bookConfig.toc.level1">
        </li>
        <li class="setting-item">
          <h3 class="setting-item-label">二级目录</h3>
          <input type="text" class="setting-input" v-model.trim="bookConfig.toc.level2">
        </li>
        <li class="setting-item btns-item">
          <button class="preview-toc-btn btn" @click="previewToc">预览</button>
          <button class="save-toc-btn btn primary-btn" @click="saveBook(true)">保存</button>
        </li>
      </ul>
    </section>
    <section class="book-info" v-if="bookInfo">
      <h3 class="book-info-title">书籍信息</h3>
      <img :src="bookInfo.cover" alt="" class="book-cover">
      <h2 class="book-title">{{ bookInfo.title }}</h2>
      <p class="word-count">{{ wordCount }}字</p>
      <ul class="chapter-info">
        <li class="chapter-info-item">{{ chapterInfo.levelsCount }}个目录层级</li>
        <li class="chapter-info-item" v-for="(count, key) in chapterInfo.levelCount" :key="key">{{count}} 个一级目录</li>
      </ul>
      <div class="btns">
        <button class="btn" @click="previewToc">预览目录</button>
        <button class="btn primary-btn" @click="saveBook(true)">添加到书架</button>
      </div>
    </section>
    <c-dialog
      height="90vh"
      title="预览目录"
      :visible="dialog === 'chapterList'"
      @close="dialog=null"
      body-style="padding:0"
    >
      <template #header>
        <div class="preview-header">
          <h3 class="preview-title">预览目录</h3>
          <button class="btn primary-btn" @click="saveBook(false)">添加</button>
        </div>
      </template>
      <ChapterList :chapter-list="chapterList"></ChapterList>
    </c-dialog>
  </div>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import ChapterList from '@/components/ChapterList.vue'
import { parseTxtFile } from '@/services/txt-file';
import { blobToBase64, showToast } from '@/utils';
import { computed, ref, shallowRef, toRaw } from 'vue';
import { level1ChapterRegexp, level2ChapterRegexp } from '@/config';
import NavigationBar from '@/components/NavigationBar.vue';
import { parseEpubFile } from '@/services/epub';
import { booksStore, chapterListStore, contentStore } from '@/services/storage';
import { useRouter } from 'vue-router';
import { parseMobiFile } from '@/services/mobi';

const router = useRouter()

const bookConfig = ref({
  toc: {
    level1: level1ChapterRegexp,
    level2: level2ChapterRegexp
  }
})

const bookInfo = shallowRef<{
  cover: string,
  title: string,
  content: string,
  maxCursor: number,
} | null>(null)

let file: File | null = null
const fileName = ref('')
const onFileChange = (event: Event) => {
  file = (event.target as HTMLInputElement).files?.[0] || null
  fileName.value = file?.name || ''
  if (file) {
    parseFile()
  }
}

const dialog = ref<string | null>('')
const chapterList = ref<IChapter[]>([])
const chapterInfo = computed(() => {
  const levels = new Set<number>()
  const levelCount = new Map<number, number>()
  chapterList.value.forEach(chapter => {
    levels.add(chapter.level)
    if (!levelCount.get(chapter.level)) {
      levelCount.set(chapter.level, 1)
    } else {
      levelCount.set(chapter.level, levelCount.get(chapter.level)! + 1)
    }
  })
  return {
    levelsCount: levels.size,
    levelCount: levelCount.keys().toArray().sort((prev, next) => prev - next).map(level => levelCount.get(level))
  }
})
const wordCount = computed(() => {
  if (!bookInfo.value) return null
  const length = bookInfo.value.content.length
  return length.toLocaleString()
})

const parseFile = async () => {
  if (file?.name.endsWith('.epub')) {
    const result = await parseEpubFile(file)
    console.log(result)
    bookInfo.value = {
      content: result.content,
      cover: result.cover ? await blobToBase64(result.cover) : '',
      title: result.title,
      maxCursor: result.maxCursor
    }
    chapterList.value = result.chapterList
    return;
  }
  if (file?.name.endsWith('.txt')) {
    const regList: RegExp[] = []
    if (bookConfig.value.toc.level1) {
      try {
        regList.push(new RegExp(bookConfig.value.toc.level1))
      } catch(err) {
        showToast('一级目录不正确')
        throw err
      }
    }
    if (bookConfig.value.toc.level2) {
      try {
        regList.push(new RegExp(bookConfig.value.toc.level2))
      } catch(err) {
        showToast('二级目录不正确')
        throw err
      }
    }
    if (!regList) {
      showToast('请至少配置一个目录')
      throw new Error('no avaliable toc config')
    }
    if (file?.name.endsWith('.txt')) {
      const result = await parseTxtFile(file)
      bookInfo.value = { cover: '', title: result.title, content: result.content, maxCursor: result.maxCursor }
      chapterList.value = result.chapterList
    }
    showToast('未找到可用的书籍内容')
    throw new Error('not found book')
  }
  if (file) {
    // @todo mobi 格式的支持有问题，解析可能会出错，需要重新梳理
    const result = await parseMobiFile(file)
    console.log(result)
    bookInfo.value = {
      content: result.content,
      cover: result.cover ? await blobToBase64(result.cover) : '',
      title: result.title,
      maxCursor: result.maxCursor
    }
    chapterList.value = result.chapterList
  }
}

const previewToc = () => {
  dialog.value = 'chapterList'
}

const saveBook = async (refreshInfo: boolean) => {
  if (refreshInfo) {
    await parseFile()
  }
  const { title, maxCursor, cover, content } = bookInfo.value || {}
  if (!title || !maxCursor) {
    showToast('缺少标题或内容')
    return;
  }
  try {
    const bookId = await booksStore.add({ title, cover, maxCursor })
    await Promise.all([
      contentStore.add({ bookId: bookId as number, content }),
      chapterListStore.add({ bookId: bookId as number, chapterList: toRaw(chapterList.value) })
    ]).catch(err => {
      booksStore.remove(bookId as number)
      throw err
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    showToast('添加失败: ' + errorMessage)
    throw err
  }
  router.replace('/')
}

</script>

<style lang="scss" scoped>
.import-view {
  padding: 16px 16px max(var(--saib), 10em) 16px;
}
.upload-book-section {
  margin: 16px 32px;
  display: flex;
  flex-direction: column;
}
.book-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  .book-info-title {
    width: 100%;
    opacity: 0.6;
    font-size: 14px;
    margin-bottom: 24px;
  }
  .book-cover {
    width: 200px;
    aspect-ratio: 3 / 4;
  }
  .book-title {
    font-size: 16px;
    margin-top: 8px;
  }
  .word-count {
    opacity: 0.6;
    font-size: 14px;
  }
  .chapter-info {
    margin: 16px 0;
    list-style-position: inside;
  }
}
.toc-settings {
  list-style: none;
}
.setting-item + .setting-item {
  margin-top: 24px;
}
.setting-item-label {
  font-size: 14px;
  margin-bottom: 8px;
  opacity: 0.6;
}
.settings-section-title {
  font-size: 14px;
  opacity: 0.6;
  margin: 0 0 8px 12px;
}
.settings-content {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}
.setting-input {
  font-size: 14px;
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;
  outline: none;
  padding-bottom: 4px;
  font-weight: 500;
}
.btn {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid light-dark(var(--light-border-color), var(--dark-border-color));
  font-weight: 500;
  &.primary-btn {
    background: rgb(56, 66, 255);
    color: #fff;
    border: none;
  }
  &.text-btn {
    color: rgb(56, 66, 255);
    border: none;
  }
  & + .btn {
    margin-left: 12px;
  }
}

.preview-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
