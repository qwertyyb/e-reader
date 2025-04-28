<template>
  <ul class="mark-list">
    <li class="mark-item"
      v-for="mark in markListWithStyle" :key="mark.id">
      <span class="material-symbols-outlined mark-icon"
        v-if="!mark.thought"
        :style="mark.iconStyle">{{ MarkStyleIcons[mark.style] }}</span>
      <span class="material-symbols-outlined mark-icon"
        v-else
        :style="mark.iconStyle">record_voice_over</span>
      <div class="mark-content">
        <p class="mark-thought" v-if="mark.thought">{{ mark.thought }}</p>
        <div class="mark-quote-wrapper">
          <div class="pre-line"></div>
          <p class="mark-quote"><mark :style="mark.textStyle">{{ mark.text }}</mark></p>
        </div>
      </div>
      <span class="remove-action" @click="$emit('remove', mark)">
        <span class="material-symbols-outlined remove-icon">delete</span>
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { MarkStyles, MarkStyleIcons } from "@/utils/mark";
import { computed } from "vue";

const props = defineProps<{
  markList: IMarkEntity[]
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
  background: light-dark(var(--light-bg-color), var(--dark-bg-color));
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  margin-bottom: 12px;
  padding: 10px;
  font-size: 14px;
  position: relative;
}
.mark-list .mark-item .remove-action {
  display: flex;
  align-items: center;
  color: rgb(153, 153, 153);
  cursor: pointer;
  font-size: 12px;
}
.mark-list .mark-item .remove-icon {
  color: inherit;
  font-size: 18px;
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
  margin-top: 2px;
  background: light-dark(rgb(224, 224, 224), #666);
  margin-right: 8px;
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
  background-color: light-dark(#f1f1f1, #333);
  border-radius: 9999px;
}
</style>
