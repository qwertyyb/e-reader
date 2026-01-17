<template>
  <div class="c-switch all-transition" :class="{ 'is-checked': modelValue }" @click="toggle">
    <span class="c-switch__inner transform-transition">
      <span class="c-switch__text c-switch__text--on opacity-transition">{{ activeText }}</span>
      <span class="c-switch__text c-switch__text--off opacity-transition">{{ inactiveText }}</span>
    </span>
    <input
      type="checkbox"
      class="c-switch__original"
      :checked="modelValue"
      @change="handleChange"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  activeText: {
    type: String,
    default: '',
  },
  inactiveText: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const toggle = () => {
  handleChange();
};

const handleChange = () => {
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
};
</script>

<style scoped>
.c-switch {
  --height: 28px;
  --width: 52px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: var(--width); /* Increased from 48px */
  height: var(--height); /* Increased from 24px */
  border-radius: 16px; /* Increased from 12px */
  background-color: light-dark(#bbb, #444);
  cursor: pointer;
  padding: 2px;
}

.c-switch.is-checked {
  background-color: var(--theme-color);
}

.c-switch__inner {
  position: relative;
  width: calc(var(--height) - 4px); /* Increased from 24px */
  height: calc(var(--height) - 4px); /* Increased from 24px */
  border-radius: 50%;
  background-color: #fff;
}

.c-switch.is-checked .c-switch__inner {
  transform: translateX(calc(var(--width) - var(--height))); /* Adjusted to match new width */
}

.c-switch__text {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px; /* Increased from 12px */
  color: var(--theme-color);
  user-select: none;
}

.c-switch__text--on {
  left: 8px; /* Adjusted to match new size */
  opacity: 0;
}

.c-switch__text--off {
  right: 8px; /* Adjusted to match new size */
}

.c-switch.is-checked .c-switch__text--on {
  opacity: 1;
}

.c-switch__text--off {
  opacity: 1;
}

.c-switch.is-checked .c-switch__text--off {
  opacity: 0;
}

.c-switch__original {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
</style>
