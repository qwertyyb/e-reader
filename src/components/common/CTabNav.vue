<template>
  <ul class="c-tab-nav">
    <li class="tab-nav-item"
      :class="{ selected: item.name === curTab }"
      v-for="item in list"
      :key="item.name"
      @click="toggle(item, $event)"
    >{{ item.title }}</li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  list: { name: string, title: string }[]
}>()

const curTab = defineModel<string>()

const toggle = async (item: { name: string, title: string }, event: PointerEvent) => {
  const target = event.currentTarget as HTMLElement
  const cur = target.parentElement?.querySelector('.selected')
  const curRect = cur?.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  if (cur && curRect) {
    await cur.animate([
      { '--x': 0 },
      { '--x': `${targetRect.left - curRect.left}px` }
    ], { duration: 100, easing: 'ease-out' }).finished
  }
  curTab.value = item.name
}
</script>

<style lang="scss" scoped>
.c-tab-nav {
  display: flex;
  align-items: center;
  border-radius: 9999px;
  background: light-dark(#ddd, #3a3a3a);
  padding: 4px;
  font-size: 13px;
}
@property --x {
  syntax: '<length>';
  inherits: true;
  initial-value: 0;
}

html body #app .c-tab-nav .tab-nav-item {
  flex: 1;
  text-align: center;
  padding: 4px 0;
  position: relative;
  z-index: 0;
  font-weight: 500;
  &.selected {
    color: inherit;
  }
  &.selected::before {
    content: " ";
    z-index: -1;
    position: absolute;
    inset: 0;
    background: var(--card-bg-color);
    border-radius: 9999px;
    color: inherit;
    transform: translateX(var(--x));
  }
}
</style>
