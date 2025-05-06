<template>
  <div class="book-list-view">
    <div class="category-wrapper" v-if="route.name === 'local' && visibleList.length">
      <ul class="category-list">
        <li class="category-item" :class="{active: category === 'all'}" @click="category='all'">全部</li>
        <li class="category-item" :class="{active: category === 'imported'}" @click="category='imported'">导入</li>
        <li class="category-item" :class="{active: category === 'downloaded'}" @click="category='downloaded'">远程</li>
      </ul>
      <div class="toggle-action" v-if="selecting" @click="selecting = false">
        取消
      </div>
      <div class="toggle-action" v-else @click="selecting = true">
        <span class="material-symbols-outlined icon">check_circle</span>
        选择
      </div>
    </div>
    <ul class="actions-wrapper" v-if="selecting">
      <li class="action-item delete-action" :class="{disabled: selectedIds.size <= 0}" @click="deleteSelected">
        <span class="material-symbols-outlined icon">delete</span>
        删除
      </li>
    </ul>
    <ul class="book-list">
      <li class="book-item-wrapper"
        v-for="book in visibleList"
        :key="book.id"
        :class="{selected: selectedIds.has(book.id)}"
      >
        <book-item
          :book="book"
          mode="show"
          @onTap="onTap(book)"
        ></book-item>
        <div class="select-wrapper" @click="toggleSelect(book)" v-if="selecting">
          <span class="material-symbols-outlined checkbox-icon">check_circle</span>
        </div>
      </li>
    </ul>
    <div class="empty-info">
      暂无书籍
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BookItem from '@/components/BookItem.vue';
import { onlineService } from '@/services/OnlineService';
import { formatSize, showToast } from '@/utils';
import { localBookService } from '@/services/LocalBookService';
import router from '@/router';
import { booksStore, readingStateStore } from '@/services/storage';
import { useRoute } from 'vue-router';
import { setAnimData, animData } from '@/stores/bookAnim';

const route = useRoute()

const category = ref(['all', 'imported', 'downloaded'].includes(route.query.category as string) ? route.query.category as string : 'all')

const bookList = ref<IBookItem[]>([])

const selecting = ref(false)
const selectedIds = ref(new Set<string | number>())

const toggleSelect = (book: IBookItem) => {
  if (selectedIds.value.has(book.localBookId!)) {
    selectedIds.value.delete(book.localBookId!)
  } else {
    selectedIds.value.add(book.localBookId!)
  }
}

const deleteSelected = async () => {
  // @todo 二次确认
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
    return list.filter(item => item.onlineBookId)
  }
  return list
})

const refresh = async () => {
  const [localBooks, reading] = await Promise.all([
    localBookService.getBookList(),
    readingStateStore.getList().then((list) => {
      return list.reduce((acc, item) => {
        acc[item.bookId] = item
        return acc
      }, {} as Record<string, IReadingState>)
    })
  ])

  const getRemoteBookList = () => window.remoteBooks.map((item) => {
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

  const getLocalBookList = () => localBooks.map(item => {
    return {
      ...item,
      trace: `${route.path}_${item.id}`,
      reading: false,
      downloaded: true,
      localBookId: item.id,
      lastReadTime: item && reading[item.id] ? reading[item.id].lastReadTime : 0,
    }
  })

  bookList.value = (route.name === 'local' ? getLocalBookList() : getRemoteBookList())
    .sort((prev, next) => Number(next.downloaded) - Number(prev.downloaded) || next.lastReadTime - prev.lastReadTime)
    .filter((item) => {
      if (route.name === 'local') {
        return item.downloaded
      }
      return true
  })
}

const download = async ({ id }: IBookItem) => {
  const book = bookList.value.find((item) => item.id === id)!
  book.downloading = true
  onlineService.downloadBook(book.id, (progress, total) => {
    book.downloadProgress = {
      total,
      downloaded: progress,
      percent: Math.floor((progress / total) * 100),
      progress: `${formatSize(progress)}/${formatSize(total)}`
    }
  }).then(() => {
    showToast('下载完成')
    refresh()
  }).catch((err) => {
    showToast('下载失败')
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
  await download(book)
}

refresh()

watch(() => route.name, () => {
  refresh()
})

</script>

<style lang="scss" scoped>
.category-wrapper {
  display: flex;
  padding: 16px 16px 4px 16px;
  font-weight: 500;
  font-size: 16px;
  .toggle-action {
    display: flex;
    align-items: center;
    .icon {
      font-size: 20px;
      font-weight: inherit;
      margin-right: 2px;
    }
  }
}
.category-list {
  display: flex;
  list-style: none;
  gap: 16px;
  margin-right: auto;
  .category-item {
    &.active {
      color: light-dark(blue, rgb(58, 127, 255));
    }
  }
}
.actions-wrapper {
  list-style: none;
  display: flex;
  padding: 0 16px;
  justify-content: center;
  .action-item {
    display: flex;
    align-items: center;
    font-weight: 500;
    padding: 4px 8px;
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
  grid-gap: 10px;
  gap: 10px;
  justify-content: space-around;
  position: relative;
  box-sizing: border-box;
  perspective: 600px;
  list-style: none;
}
.book-item-wrapper {
  position: relative;
  .checkbox-icon {
    color: #bbb;
  }
  &.selected {
    .select-wrapper {
      background: rgba(0, 0, 0, 0.5);
    }
    .checkbox-icon {
      color:rgb(138, 179, 254);
    }
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
