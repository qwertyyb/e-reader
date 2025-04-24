<template>
  <div class="marks-viewer">
    <h3 class="marks-viewer-title">笔记<span class="material-symbols-outlined more-icon">arrow_forward_ios</span></h3>
    <book-mark-list :book-id="bookId" @mark-removed="removeMark"></book-mark-list>
  </div>
</template>

<script setup lang="ts">
import BookMarkList from '@/components/BookMarkList.vue';
import { marks } from "@/services/storage";
import { showToast } from "@/utils";

defineProps<{
  bookId: number,
}>()

const emits = defineEmits<{
  'mark-removed': [IMarkEntity]
}>()

const removeMark = async (mark: IMarkEntity) => {
  await marks.remove(mark.id)
  showToast('已删除')
  emits('mark-removed', mark)
}
</script>

<style lang="scss" scoped>
.marks-viewer {
  width: 100vw;
  box-sizing: border-box;
  padding: 10px 16px env(safe-area-inset-bottom) 16px;
  background: rgb(238, 238, 238);
  max-height: 80vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 60vh;
}
.marks-viewer .marks-viewer-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  height: 30px;
}
.marks-viewer .marks-viewer-title .more-icon {
  font-size: 16px;
}
</style>
