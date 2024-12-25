<template>
  <ul class="mark-list">
    <li class="mark-item"
      v-for="mark in markListWithStyle" :key="mark.id">
      <span class="material-symbols-outlined mark-icon"
        v-if="mark.type === MarkType.UNDERLINE"
        :style="mark.iconStyle">{{ MarkStyleIcons[mark.style] }}</span>
      <span class="material-icons-outlined mark-icon"
        v-else-if="mark.type === MarkType.THOUGHT"
        :style="mark.iconStyle">comment</span>
      <div class="mark-content">
        <p class="mark-thought" v-if="mark.type === MarkType.THOUGHT">{{ mark.thought }}</p>
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
import { MarkStyles, MarkType, MarkStyleIcons } from "@/utils/mark";
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
  background: #fff;
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
  color: red;
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
  width: 4px;
  height: auto;
  background: rgb(195, 195, 195);
  margin-right: 8px;
}
.mark-list .mark-quote-wrapper .mark-quote {
  line-height: 1.8;
}
.mark-list .mark-quote-wrapper .mark-quote mark {
  color: #666;
}
.mark-list .mark-item .mark-icon {
  margin-right: 6px;
}
</style>
