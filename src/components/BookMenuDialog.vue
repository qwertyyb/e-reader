<template>
  <c-dialog :visible="visible"
    class="book-menu-dialog"
    body-style="padding: 0"
    @close="$emit('close')"
    title="更多"
  >

    <ul class="book-menu">
      <li class="menu-item" @click="viewMarks">
        <span class="material-symbols-outlined menu-item-icon">overview</span>
        <div class="menu-item-label">查看笔记</div>
      </li>
      <li class="menu-item" @click="exportMarks">
        <span class="material-symbols-outlined menu-item-icon">export_notes</span>
        <div class="menu-item-label">导出笔记</div>
      </li>
      <li class="menu-item" @click="search">
        <span class="material-symbols-outlined menu-item-icon">search</span>
        <div class="menu-item-label">全文搜索</div>
      </li>
      <li class="menu-item" @click="() => $emit('action', 'info')">
        <span class="material-symbols-outlined menu-item-icon">info</span>
        <div class="menu-item-label">书籍信息</div>
      </li>
      <li class="menu-item" @click="() => $emit('action', 'tocSettings')">
        <span class="material-symbols-outlined menu-item-icon">tune</span>
        <div class="menu-item-label">目录设置</div>
      </li>
      <li class="menu-item" v-if="preferences.ai?.baseURL" @click="() => $emit('action', 'ai')">
        <span class="material-symbols-outlined menu-item-icon">mindfulness</span>
        <div class="menu-item-label">AI问书</div>
      </li>
      <li class="menu-item" @click="() => $emit('action', 'share')">
        <span class="material-symbols-outlined menu-item-icon">share</span>
        <div class="menu-item-label">分享</div>
      </li>
    </ul>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import { showToast } from '@/utils';
import { exportBookMarkListByBookId } from '@/utils/mark';
import { preferences } from '@/stores/preferences';

const props = defineProps<{ visible: boolean, bookId: number }>()

const emits = defineEmits<{
  action: ['marksViewer' | 'exportMarks' | 'search' | 'info' | 'ai' | 'tocSettings' | 'share'],
  close: []
}>()

const viewMarks = () => {
  emits('action', 'marksViewer')
}
const exportMarks = async () => {
  const { markdown, html } = await exportBookMarkListByBookId(props.bookId)
  navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([markdown], { type: 'text/plain' }),
      'text/html': new Blob([html], { type: 'text/html' }),
    })
  ])
  showToast('已复制到剪贴板')
}
const search = () => {
  emits('action', 'search')
}
</script>

<style lang="scss" scoped>
.book-menu-dialog .book-menu {
  padding: 12px 0 30px 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, 60px);
  justify-content: center;
  column-gap: 12px;
  row-gap: 24px;
  font-size: 14px;
  text-align: center;
  &::-webkit-scrollbar {
    display: none;
  }
}
.book-menu-dialog .menu-item {
  cursor: pointer;
  width: 60px;
  flex-shrink: 0;
}
.book-menu-dialog .menu-item-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.menu-item-label {
  white-space: nowrap;
}
</style>
