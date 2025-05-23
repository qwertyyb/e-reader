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
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 56px; /* Increased from 48px */
  height: 32px; /* Increased from 24px */
  border-radius: 16px; /* Increased from 12px */
  background-color: #dcdfe6;
  cursor: pointer;
}

.c-switch.is-checked {
  background-color: #409eff;
}

.c-switch__inner {
  position: relative;
  width: 32px; /* Increased from 24px */
  height: 32px; /* Increased from 24px */
  border-radius: 50%;
  background-color: white;
}

.c-switch.is-checked .c-switch__inner {
  transform: translateX(24px); /* Adjusted to match new width */
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
