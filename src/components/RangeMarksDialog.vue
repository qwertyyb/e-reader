<template>
 <c-dialog :visible="visible" title="想法" @close="$emit('close')" class="range-marks-dialog" height="90vh">
    <header class="mark-text">
      <span class="quote">&ldquo;</span>
      {{ rangeMark?.text }}
      <span class="quote">&rdquo;</span>
    </header>
    <mark-list :mark-list="markDataList" @remove="removeMark"></mark-list>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import MarkList from '@/components/MarkList.vue';
import { marks } from '@/services/storage';
import { showToast } from '@/utils';
import { ref, watch, computed } from 'vue';

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

const rangeMark = computed(() => {
  return markDataList.value.find(item => {
    return item.range.start == props.range?.start && item.range.length == props.range?.length
  })
})

const refresh = async() => {
  if (!props.range) return;
  const list = await marks.getListByChapterAndBook(props.bookId, props.chapterId)
  const { start: rs, length: rl } = props.range
  const re = rs + rl
  markDataList.value = list.filter(mark => {
    const { start, length } = mark.range
    const end = start + length - 1
    return rs <= start && start < re || rs <= end && end <= re
  })
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
.mark-text {
  background: var(--card-bg-color);
  margin-bottom: 12px;
  border-radius: 6px;
  padding: 8px 16px;
}
.quote {
  font-size: 3em;
  font-weight: bold;
  font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
}
</style>
