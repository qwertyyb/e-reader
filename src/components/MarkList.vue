<template>
  <ul class="mark-list">
    <li class="mark-item"
      v-for="mark in markListWithStyle"
      :key="mark.id"
    >
      <span class="material-symbols-outlined mark-icon"
        v-if="!mark.thought"
        :style="mark.iconStyle">{{ MarkStyleIcons[mark.style] }}</span>
      <span class="material-symbols-outlined mark-icon"
        v-else
        :style="mark.iconStyle">record_voice_over</span>
      <div class="mark-content" @click="$emit('tap', mark)">
        <p class="mark-thought" v-if="mark.thought">{{ mark.thought }}</p>
        <div class="mark-quote-wrapper">
          <div class="pre-line"></div>
          <p class="mark-quote"><mark :style="mark.textStyle">{{ mark.text }}</mark></p>
        </div>
      </div>
      <div class="mark-actions">
        <span class="action-item remove-action" @click="$emit('remove', mark)">
          <span class="material-symbols-outlined action-icon remove-icon">delete</span>
          <span class="action-label">删除</span>
        </span>
        <span class="action-item edit-action" @click="$emit('edit', mark)" v-if="mark.thought">
          <span class="material-symbols-outlined action-icon edit-icon">edit</span>
          <span class="action-label">编辑</span>
        </span>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { MarkStyles, MarkStyleIcons } from "@/utils/mark";
import { computed } from "vue";

const props = defineProps<{
  markList: IMarkEntity[]
}>()

defineEmits<{
  'remove': [IMarkEntity],
  'tap': [IMarkEntity],
  'edit': [IMarkEntity]
}>()

const markListWithStyle = computed(() => {
  return props.markList.map(mark => {
    return {
      ...mark,
      iconStyle: { color: mark.color },
      textStyle: mark.style === MarkStyles.HIGHLIGHT ? {
        backgroundColor: mark.color
      } : {
        textDecoration: 'underline',
        textDecorationStyle: (mark.style === MarkStyles.WAVE ? 'wavy' : 'solid') as 'wavy' | 'solid',
        textDecorationColor: mark.color,
        textUnderlineOffset: '0.3em'
      }
    }
  })
})
</script>

<style lang="scss" scoped>
.mark-list {
  list-style: none;
}
.mark-list .mark-item {
  background: var(--card-bg-color);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 10px;
  font-size: 14px;
  position: relative;
}
.mark-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border-color);
  margin-top: 12px;
  padding-top: 8px;
  .action-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    color: rgb(153, 153, 153);
    cursor: pointer;
    font-size: 12px;
  }
  .action-icon {
    color: inherit;
    font-size: 18px;
    margin-right: 4px;
  }
}
.mark-list .mark-item .mark-content {
  flex: 1;
  margin-right: 6px;
}
.mark-list .mark-quote-wrapper {
  display: flex;
}
.mark-list .mark-thought {
  margin-bottom: 8px;
  font-size: 16px;
}
.mark-list .mark-quote-wrapper .pre-line {
  width: 3px;
  flex-shrink: 0;
  margin-top: 2px;
  background: var(--card-light-bg-color-1);
  margin-right: 6px;
  border-radius: 999px;
}
.mark-list .mark-quote-wrapper .mark-quote {
  line-height: 1.8;
}
.mark-list .mark-quote-wrapper .mark-quote::v-deep(mark) {
  color: #666;
}
.mark-icon {
  margin-right: 12px;
  font-size: 18px;
  width: 24px;
  height: 24px;
  margin-top: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--card-light-bg-color-1);
  border-radius: 9999px;
}
</style>
