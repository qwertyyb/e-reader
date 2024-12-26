<template>
  <c-dialog :visible="visible"
    class="book-menu-dialog"
    @close="$emit('close')">

    <ul class="book-menu">
      <li class="menu-item" @click="viewMarks">
        <span class="material-symbols-outlined menu-item-icon">
        overview
        </span>
        <div class="menu-item-label">查看笔记</div>
      </li>
      <li class="menu-item" @click="exportMarks">
        <span class="material-symbols-outlined menu-item-icon">
        export_notes
        </span>
        <div class="menu-item-label">导出笔记</div>
      </li>
      <li class="menu-item" @click="catalogSetting">
        <span class="material-symbols-outlined menu-item-icon">
        toc
        </span>
        <div class="menu-item-label">目录设置</div>
      </li>
    </ul>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';

defineProps<{ visible: boolean }>()

const emits = defineEmits<{
  action: ['marksViewer' | 'catalogSetting' | 'exportMarks'],
  close: []
}>()

const viewMarks = () => {
  emits('action', 'marksViewer')
  console.log('查看笔记')
}
const exportMarks = () => {
  emits('action', 'exportMarks')
}
const catalogSetting = () => {
  console.log('设置目录')
  emits('action', 'catalogSetting')
}
</script>

<style lang="scss" scoped>
.book-menu-dialog .book-menu {
  padding: 30px 40px 50px 40px;
  width: calc(100vw - 80px);
  list-style: none;
  display: flex;
  font-size: 12px;
  text-align: center;
}
.book-menu-dialog .menu-item {
  margin-right: 32px;
}
.book-menu-dialog .menu-item-icon {
  font-size: 28px;
  margin-bottom: 8px;
}
</style>
