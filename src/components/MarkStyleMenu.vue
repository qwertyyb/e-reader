<template>
  <div class="mark-style-menu">
    <div class="menu-item-wrapper"
      ref="reference"
      @click="emits('removeUnderline')">
      <span class="material-symbols-outlined menu-icon">format_underlined</span>
      <span class="menu-item-label">删除划线</span>
    </div>
    <div class="underline-submenu" ref="floating" :style="floatingStyles">
      <ul class="underline-submenu-list">
        <li class="underline-submenu-item mark-style"
          v-for="style in MarkStyles"
          @click="emits('update', { style })"
          :style="{color: mark?.style === style ? mark.color : ''}"
          :key="style">
          <span class="material-symbols-outlined style-icon">
          {{ MarkStyleIcons[style] }}
          </span>
        </li>
        <li class="divider"></li>
        <li class="underline-submenu-item"
          v-for="color in MarkColors"
          @click="emits('update', { color })"
          :key="color"
          :style="{background: color}">
          <span class="material-symbols-outlined" v-if="mark?.color===color">
          check
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFloating, offset, shift, autoUpdate } from '@floating-ui/vue';
import { MarkStyles, MarkStyleIcons, MarkColors } from '@/utils/mark';
import { ref } from 'vue';

defineProps<{
  mark: Omit<IMarkEntity, 'id'> & { id?: number } | null
}>()

const emits = defineEmits<{
  removeUnderline: [],
  update: [{ style: number } | { color: string }]
}>()

const reference = ref<HTMLElement | null>(null)
const floating = ref<HTMLElement | null>(null)


const { floatingStyles: floatingStyles } = useFloating(reference, floating, {
  placement: 'bottom',
  middleware: [offset(10), shift({ padding: 12 })],
  whileElementsMounted: autoUpdate,
})

</script>

<style lang="scss" scoped>
@keyframes slide-down-scale {
  from {
    opacity: 0;
    transform: translateY(-100%) scale(0.6);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.underline-submenu-list {
  display: flex;
  background: #fff;
  padding: 6px 12px;
  box-shadow: 0 0 14px gray;
  list-style: none;
  border-radius: 99999px;
  width: 322px;
  animation: slide-down-scale .2s ease-in;
}
.underline-submenu-item {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}
.menu-item-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 10px;
  padding: 4px 10px;
  height: 50px;
  width: 50px;
}
.menu-icon {
  font-size: 18px;
}
.menu-item-label {
  margin-top: 3px;
  white-space: nowrap;
}
.underline-submenu-item.mark-style .style-icon {
  color: inherit;
}
.underline-submenu-item + .underline-submenu-item {
  margin-left: 8px;
}
.underline-submenu-list .divider {
  width: 2px;
  height: 24px;
  background: #bbb;
  margin: 0 12px;
}
</style>
