<template>
  <CDialog :visible="visible"
    title="点击翻页区域"
    @close="close"
  >
    <div class="tap-area-settings">
      <div class="grid-container">
        <div
          class="grid-cell"
          v-for="(action, index) in localActions"
          :key="index"
          @click="pickAction(index)"
        >
          <span class="cell-label">{{ getActionLabel(action) }}</span>
        </div>
      </div>

      <div class="save-row">
        <button class="btn primary-btn save-btn" @click="save">保存</button>
      </div>
    </div>
  </CDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import CDialog from './common/CDialog.vue';
import { defaultTapActions, tapActionOptions } from '@/config';
import { settings } from '@/stores/settings';
import { showToast, showPicker } from '@/utils';

const visible = defineModel<boolean>('visible', { default: false })

const localActions = ref<TapAreaActions>([...(settings.value.tapActions || defaultTapActions)])

// 每次打开弹窗时重新加载当前设置
watch(visible, (val) => {
  if (val) {
    localActions.value = [...(settings.value.tapActions || defaultTapActions)]
  }
})

const getActionLabel = (action: TapAction) => {
  return tapActionOptions.find(o => o.value === action)?.label || action
}

const pickAction = async (index: number) => {
  try {
    const value = await showPicker<TapAction>(tapActionOptions, { title: `区域 ${index + 1} 的动作`, value: localActions.value[index] })
    localActions.value[index] = value
  } catch {
    // 用户取消选择，不做处理
  }
}

const close = () => {
  visible.value = false
}

const save = () => {
  // 校验：至少有一个区域的动作是"拉起菜单"
  if (!localActions.value.includes('menu')) {
    showToast('至少需要一个区域设置为"拉起菜单"')
    return
  }
  settings.value.tapActions = [...localActions.value]
  showToast('保存成功')
  visible.value = false
}
</script>

<style lang="scss" scoped>
.tap-area-settings {
  padding: 8px 0;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 6px;
  aspect-ratio: 9 / 16;
  max-height: 360px;
  margin: 0 auto 16px auto;
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 6px;
  border: 1px solid var(--border-color);
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--bg-color);
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  user-select: none;

  &:hover {
    border-color: var(--theme-color-hover);
  }

  &:active {
    border-color: var(--theme-color);
    background: var(--theme-color-light);
  }
}

.cell-label {
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  opacity: 0.8;
}

.save-row {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.save-btn {
  width: 100%;
  padding: 10px 0;
  font-size: 16px;
  border-radius: 8px;
}
</style>
