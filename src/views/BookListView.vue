<template>
  <div class="book-list-view">
    <div class="navigation-bar">
      <template v-if="selecting">
        <div class="action-btn pointer">全选</div>
        <div class="navigation-title">
          <h3>选择书籍</h3>
          <p class="select-tips" v-if="selectedIds.size">已选择 {{ selectedIds.size }} 本书籍</p>
        </div>
        <div class="action-btn pointer" @click="selecting = false">
          取消
        </div>
      </template>
      <template v-else>
        <img class="logo" @click="$router.push({ name: 'preferences' })" src="/icons/icon96.png" />
        <div class="action-btn pointer" @click="selecting = true">
          <span class="material-symbols-outlined icon">check_circle</span>
          选择
        </div>
      </template>
    </div>
    <div class="navigation-bar-space"></div>
    <div class="category-wrapper" v-if="bookList.length">
      <ul class="category-list">
        <li class="category-item" :class="{selected: category === 'all'}" @click="category='all'">全部</li>
        <li class="category-item" :class="{selected: category === 'imported'}" @click="category='imported'">已导入</li>
        <li class="category-item" :class="{selected: category === 'downloaded'}" @click="category='downloaded'">已下载</li>
      </ul>
      <span class="material-symbols-outlined import-action pointer" @click="$router.push({ name: 'import' })">add</span>
    </div>
    <teleport to="#app">
      <ul class="actions-wrapper" v-if="selecting">
        <li class="action-item delete-action" :class="{disabled: selectedIds.size <= 0}" @click="deleteSelected">
          <span class="material-symbols-outlined icon">delete</span>
          删除
        </li>
      </ul>
    </teleport>
    <ul class="book-list">
      <li class="book-item-wrapper"
        v-for="book in visibleList"
        :key="book.id"
        :class="{selected: selectedIds.has(book.id)}"
        v-longtap="() => onLongtap(book)"
      >
        <book-item
          :book="book"
          :progress="downloadState[book.id]"
          @onTap="onTap(book)"
          class="pointer"
        ></book-item>
        <div class="select-wrapper" @click="toggleSelect(book)" v-if="selecting">
          <span class="material-symbols-outlined checkbox-icon" v-if="selectedIds.has(book.id)">check_circle</span>
          <span class="material-symbols-outlined checkbox-icon" v-else>radio_button_unchecked</span>
        </div>
      </li>
    </ul>
    <div class="empty-info" v-if="!visibleList.length">
      暂无书籍
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BookItem from '@/components/BookItem.vue';
import { showToast } from '@/utils';
import { localBookService } from '@/services/LocalBookService';
import router from '@/router';
import { booksStore, readingStateStore } from '@/services/storage';
import { useRoute } from 'vue-router';
import { setAnimData, animData } from '@/stores/bookAnim';
import { longtap as vLongtap } from '@/directives/click';
import { preferences } from '@/stores/preferences';
import { download } from '@/services/ImportService';

const route = useRoute()

const category = ref(['all', 'imported', 'downloaded'].includes(route.query.category as string) ? route.query.category as string : 'all')

const bookList = ref<IBookItem[]>([])

const selecting = ref(false)
const selectedIds = ref(new Set<string | number>())

const downloadState = ref<Record<string, number>>({})

const toggleSelect = (book: IBookItem) => {
  if (selectedIds.value.has(book.localBookId!)) {
    selectedIds.value.delete(book.localBookId!)
  } else {
    selectedIds.value.add(book.localBookId!)
  }
}

const deleteSelected = async () => {
  if (window.confirm('删除所选书籍？')) {
    console.log('delete');
    await Promise.all([...selectedIds.value].map(value => booksStore.remove(Number(value))))
    selectedIds.value.clear()
    selecting.value = false
    refresh()
  }
}

const visibleList = computed(() => {
  const list = bookList.value.map(item => {
    return {
      ...item,
      reading: !!item.localBookId && String(item.trace) === String(animData.value.trace)
    }
  })
  if (category.value === 'imported') {
    return list.filter(item => !item.onlineBookId)
  }
  if (category.value === 'downloaded') {
    return list.filter(item => item.onlineBookId && item.localBookId)
  }
  return list
})

const fetchRemoteBookList = async (): Promise<IRemoteBook[]> => {
  const server = preferences.value.shelfServerUrl
  if (!server) return []
  const url = server.startsWith('https://') ? server : new URL(server, location.href).href;
  const u = new URL(url)
  u.searchParams.set('_t', Date.now().toString())
  const mod = await import(/* @vite-ignore */u.href);
  return mod.books
}

const refresh = async () => {

  const [localBooks, remoteBooks, reading] = await Promise.all([
    localBookService.getBookList(),
    fetchRemoteBookList(),
    readingStateStore.getList().then((list) => {
      return list.reduce((acc, item) => {
        acc[item.bookId] = item
        return acc
      }, {} as Record<string, IReadingState>)
    })
  ])

  // 把远程的书和本地的状态合并一下
  let books: IBookItem[] = remoteBooks.map((item) => {
    const localBook = localBooks.find((book) => String(book.onlineBookId) === String(item.id))
    return {
      ...item,
      trace: `${route.path}_${item.id}`,
      reading: false,
      downloaded: !!localBook,
      localBookId: localBook?.id,
      onlineBookId: item.id,
      lastReadTime: localBook && reading[localBook.id] ? reading[localBook.id].lastReadTime : 0,
    }
  })

  // 把本地导入的书籍和远程的书籍合并并去重
  const importedBooks = localBooks.filter((item) => {
    return !books.some((book) => String(book.onlineBookId) === String(item.onlineBookId))
  }).map((item) => {
    return {
      ...item,
      trace: `${route.path}_${item.id}`,
      reading: false,
      downloaded: true,
      localBookId: item.id,
      lastReadTime: item && reading[item.id] ? reading[item.id].lastReadTime : 0,
    }
  })
  books = books.concat(importedBooks)

  bookList.value = books
    .sort((prev, next) => Number(next.downloaded) - Number(prev.downloaded) || next.lastReadTime! - prev.lastReadTime!)
}

const downloadItem = async (item: IBookItem) => {
  if (!item.downloadUrl) {
    throw new Error('没有下载地址')
  }
  item.downloading = true
  download(item.downloadUrl, { ...item }, (progress) => {
    downloadState.value[item.id] = progress
  }).then(() => {
    showToast('下载完成')
    delete downloadState.value[item.id]
    refresh()
  }).catch((err) => {
    showToast('下载失败')
    delete downloadState.value[item.id]
    throw err;
  })
}

const onTap = async (book: IBookItem) => {
  if (book.downloaded) {
    setAnimData({ cover: book.cover, title: book.title, trace: book.trace! })
    router.push({
      name: 'read',
      params: { id: book.localBookId }
    })
    return;
  }
  await downloadItem(book)
}

const onLongtap = (book: IBookItem) => {
  selectedIds.value.clear()
  selectedIds.value.add(book.id)
  selecting.value = true
}

refresh()

watch(() => route.name, () => {
  category.value = 'all'
  selecting.value = false
  refresh()
})

</script>

<style lang="scss" scoped>
.book-list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.navigation-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sait) 16px 0 16px;
  height: 48px;
  box-sizing: content-box;
  border-bottom: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1;
  background-color: var(--bg-color);
  .logo {
    width: 24px;
    height: 24px;
  }
  .navigation-title {
    text-align: center;
    h3 {
      font-size: 16px;
    }
    .select-tips {
      font-size: 12px;
      font-weight: bold;
    }
  }
}
.navigation-bar-space {
  height: calc(var(--sait) + 48px);
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  font-weight: 500;
  .icon {
    font-size: 18px;
    font-weight: 400;
  }
}

.category-wrapper {
  display: flex;
  padding: 16px 16px 4px 16px;
  font-weight: 500;
  font-size: 16px;
  .import-action {
    margin-left: auto;
    font-size: 24px;
  }
}
.category-list {
  display: flex;
  list-style: none;
  gap: 8px;
  margin-right: auto;
  .category-item {
    cursor: pointer;
    border-radius: 2px;
    padding: 0 8px;
  }
}
.actions-wrapper {
  list-style: none;
  display: flex;
  padding: 0 16px var(--saib) 16px;
  box-sizing: content-box;
  height: 54px;
  justify-content: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  background: var(--bg-color);
  .action-item {
    display: flex;
    align-items: center;
    font-weight: 500;
    padding: 4px 8px;
    cursor: pointer;
    .icon {
      color: inherit;
      font-weight: 200;
    }
  }
  .delete-action {
    color: red;
    transition: color .2s, opacity .2s;
    &.disabled {
      color: rgb(252, 94, 94);
      opacity: 0.6;
    }
  }
}

.book-list {
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, 100px);
  column-gap: 10px;
  row-gap: 24px;
  justify-content: space-around;
  align-items: start;
  position: relative;
  box-sizing: border-box;
  perspective: 600px;
  list-style: none;
  overflow: auto;
}
.book-item-wrapper {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  .checkbox-icon {
    color: #bbb;
    font-size: 24px;
    transition: color .2s;
  }
  &.selected .select-wrapper {
    background: rgba(0, 0, 0, 0.5);
  }
}
.select-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: linear-gradient(to top left, #000, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 100%);
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  transition: background .3s;
}
.empty-info {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 120px;
}
</style>
