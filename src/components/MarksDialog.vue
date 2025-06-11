<template>
  <c-dialog :visible="visible" @close="$emit('close')" height="90vh">
    <template v-slot:title>
      <h3 class="marks-dialog-title">
        笔记
        <span class="material-symbols-outlined more-icon">arrow_forward_ios</span>
      </h3>
    </template>
    <div class="marks-viewer">
      <book-mark-list :book-id="bookId" @mark-removed="removeMark" style="flex:1"></book-mark-list>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import BookMarkList from '@/components/BookMarkList.vue';
import { marks } from "@/services/storage";
import { showToast } from "@/utils";

defineProps<{
  bookId: number,
  visible: boolean
}>()

const emits = defineEmits<{
  'mark-removed': [IMarkEntity],
  close: []
}>()

const removeMark = async (mark: IMarkEntity) => {
  await marks.remove(mark.id)
  showToast('已删除')
  emits('mark-removed', mark)
}
</script>

<style lang="scss" scoped>
.marks-dialog-title {
  display: flex;
  align-items: center;
}
.more-icon {
  font-size: 16px;
  margin-left: 4px;
}
</style>
