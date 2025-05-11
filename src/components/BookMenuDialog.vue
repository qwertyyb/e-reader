<template>
  <c-dialog :visible="visible"
    class="book-menu-dialog"
    @close="$emit('close')">

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
      <li class="menu-item" @click="toSettingsPage">
        <span class="material-symbols-outlined menu-item-icon">settings</span>
        <div class="menu-item-label">书籍设置</div>
      </li>
      <li class="menu-item" @click="() => $emit('action', 'info')">
        <span class="material-symbols-outlined menu-item-icon">info</span>
        <div class="menu-item-label">书籍信息</div>
      </li>
    </ul>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import { showToast } from '@/utils';
import { exportBookMarkListByBookId } from '@/utils/mark';
import { useRouter } from 'vue-router';

const props = defineProps<{ visible: boolean, bookId: number }>()

const emits = defineEmits<{
  action: ['marksViewer' | 'exportMarks' | 'search' | 'settings' | 'info'],
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
const router = useRouter()
const toSettingsPage = () => {
  router.push({ name: 'bookSettings', params: { id: props.bookId }})
}
</script>

<style lang="scss" scoped>
.book-menu-dialog .book-menu {
  padding: 30px 0;
  width: calc(100vw - 80px);
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  text-align: center;
  gap: 13px;
}
.book-menu-dialog .menu-item {
  cursor: pointer;
}
.book-menu-dialog .menu-item-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
.menu-item-label {
  white-space: nowrap;
}
</style>
