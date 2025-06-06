<template>
  <route-page class="import-view">
    <navigation-bar title="本地导入" no-menu></navigation-bar>
    <div class="upload-book-section">
      <button class="btn primary-btn file-selector-btn" @click="selectFile">选择文件</button>
      <p class="select-tips">支持 txt 和 epub 文件</p>
      <p class="select-tips" v-if="fileName">已选择文件: {{ fileName }}</p>
    </div>
    <div class="import-main">
      <book-toc-settings v-model="bookConfig.toc" v-if="fileName.endsWith('.txt')" @confirm="reParseFile"></book-toc-settings>
      <section class="book-info" v-if="bookInfo">
        <h3 class="book-info-title">书籍信息</h3>
        <img :src="bookInfo.cover" alt="" class="book-cover">
        <h2 class="book-title">{{ bookInfo.title }}</h2>
        <p class="word-count">{{ wordCount }}字</p>
        <ul class="chapter-info">
          <li class="chapter-info-item">{{ chapterInfo.levelsCount }} 个目录层级</li>
          <li class="chapter-info-item" v-for="item in chapterInfo.levelCount" :key="item.level">{{item.count}} 个 {{item.level}} 级目录</li>
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
  </route-page>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import ChapterList from '@/components/ChapterList.vue'
import RoutePage from '@/components/RoutePage.vue';
import BookTocSettings from '@/components/BookTocSettings.vue';
import { parseTxtFile } from '@/services/parser/txt-file';
import { blobToBase64, showToast } from '@/utils';
import { computed, ref, shallowRef, toRaw } from 'vue';
import NavigationBar from '@/components/NavigationBar.vue';
import { parseEpubFile } from '@/services/parser/epub';
import { booksStore, chapterListStore, contentStore } from '@/services/storage';
import { useRouter } from 'vue-router';
import { parseMobiFile } from '@/services/parser/mobi';
import { defaultTocRegList } from '@/config';

const router = useRouter()

const bookConfig = ref({
  toc: defaultTocRegList.map(reg => reg.source)
})

const bookInfo = shallowRef<{
  cover: string,
  title: string,
  content: string,
  maxCursor: number,
} | null>(null)

let file: File | null = null
const fileName = ref('')
const selectFile = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.txt,.epub,.mobi,.azw3'
  const selectedFile = await new Promise<File | undefined>(resolve => {
    input.addEventListener('change', () => {
      resolve(input.files?.[0])
    })
    input.click()
  })
  if (!selectedFile) return;
  file = selectedFile
  fileName.value = selectedFile.name
  parseFile()
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
    levelCount: levelCount.keys().toArray().sort((prev, next) => prev - next).map(level => ({ level, count: levelCount.get(level) }))
  }
})
const wordCount = computed(() => {
  if (!bookInfo.value) return null
  const length = bookInfo.value.content.length
  return length.toLocaleString()
})

const parseFile = async () => {
  if (!file) return;
  if (file.name.endsWith('.epub')) {
    try {
      const result = await parseEpubFile(file)
      bookInfo.value = {
        content: result.content,
        cover: result.cover ? await blobToBase64(result.cover) : '',
        title: result.title,
        maxCursor: result.maxCursor
      }
      chapterList.value = result.chapterList
    } catch (err) {
      showToast('导入失败')
      throw err
    }
    return;
  }
  if (file.name.endsWith('.txt')) {
    try {
      const result = await parseTxtFile(file, { tocRegList: getTocRegList() })
      chapterList.value = result.chapterList
      bookInfo.value = { cover: await blobToBase64(result.cover), title: result.title, content: result.content, maxCursor: result.maxCursor }
      return
    } catch (err) {
      showToast('导入失败')
      throw err
    }
  }
  // @todo mobi 格式的支持有问题，解析可能会出错，需要重新梳理
  try {
    const result = await parseMobiFile(file)
    bookInfo.value = {
      content: result.content,
      cover: result.cover ? await blobToBase64(result.cover) : '',
      title: result.title,
      maxCursor: result.maxCursor
    }
    chapterList.value = result.chapterList
  } catch (err) {
    showToast('导入失败')
    throw err
  }
}

const reParseFile = async () => {
  await parseFile()
  showToast('目录已更新')
  document.querySelector('.import-view .btns')?.scrollIntoView()
  dialog.value = 'chapterList'
}

const getTocRegList = () => {
  const regList: RegExp[] = []
  bookConfig.value.toc.forEach(reg => {
    try {
      regList.push(new RegExp(reg))
    } catch(err) {
      showToast('一级目录不正确')
      throw err
    }
  })
  if (!regList) {
    showToast('请至少配置一个目录')
    throw new Error('no avaliable toc config')
  }
  return regList
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
  height: var(--page-height);
  display: flex;
  flex-direction: column;
}
.import-main {
  height: 0;
  flex: 1;
  overflow: auto;
  padding: 16px 16px max(var(--saib), 10em) 16px;
}
.upload-book-section {
  margin: 60px 32px 16px 32px;
  display: flex;
  flex-direction: column;
  .file-selector-btn {
    max-width: 160px;
    margin: 0 auto;
    font-size: 18px;
    padding: 8px 32px;
  }
  .select-tips {
    text-align: center;
    margin-top: 6px;
    opacity: 0.6;
  }
}
.book-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 16px;
  .book-info-title {
    font-size: 16px;
    margin-bottom: 12px;
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

.preview-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
