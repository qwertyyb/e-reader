<template>
 <c-dialog :visible="visible" title="笔记" @close="$emit('close')" class="range-marks-dialog">
    <mark-list :mark-list="markDataList" @remove="removeMark"></mark-list>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import MarkList from '@/components/MarkList.vue';
import { marks } from '@/services/storage';
import { showToast } from '@/utils';
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean
  range: { start: number, length: number } | null
  bookId: number
  chapterId: string
}>()

const emits = defineEmits<{
  'mark-removed': [IMarkEntity],
  close: []
}>()

const markDataList = ref<IMarkEntity[]>([])

const refresh = async() => {
  if (!props.range) return;
  const list = await marks.getListByChapterAndBook(props.bookId, props.chapterId)
  const { start: rs, length: rl } = props.range
  const re = rs + rl
  markDataList.value = list.filter(mark => {
    const { start, length } = mark.range
    const end = start + length
    return rs <= start && start <= re || rs <= end && end <= re
  })
  console.log(markDataList.value)
}

const removeMark = async (mark: IMarkEntity) => {
  await marks.remove(mark.id)
  showToast('已删除')
  emits('mark-removed', mark)
  await refresh()
  if (!markDataList.value.length) {
    emits('close')
  }
}

watch(() => props.range, () => refresh())
</script>

<style lang="scss" scoped>
.range-marks-dialog::v-deep(.c-dialog-content) {
  align-self: flex-start;
  background: transparent;
  box-sizing: border-box;
  padding-top: max(60px, var(--sait));
  padding-bottom: max(20px, var(--saib));
  color: #fff;
}
</style>
