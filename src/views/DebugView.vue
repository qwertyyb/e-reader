<template>
  <slide-back class="debug-view">
    <NavigationBar title="调试选项" :no-menu="true"/>

    <div class="debug-item">
      <div class="debug-label">显示控制台</div>
      <div class="debug-control">
        <c-switch v-model="debugOptions.showConsole"></c-switch>
      </div>
    </div>

    <div class="debug-item">
      <div class="debug-label">无动画模式</div>
      <div class="debug-control">
        <c-select v-model="debugOptions.noAnimation" :options="modeOptions"></c-select>
      </div>
    </div>

    <div class="debug-item">
      <div class="debug-label">高对比模式</div>
      <div class="debug-control">
        <c-select v-model="debugOptions.highContrast" :options="modeOptions"></c-select>
      </div>
    </div>

    <div class="debug-item" @click="$router.push({ name: 'import' })">
      <div class="debug-label">导入测试</div>
      <div class="debug-control">
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </div>
    </div>

    <div class="debug-item" @click="$router.push({ name: 'storage' })">
      <div class="debug-label">储存空间</div>
      <div class="debug-control">
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </div>
    </div>

    <div class="debug-item" @click="resetToDefault">
      <div class="debug-label">恢复默认</div>
    </div>

  </slide-back>
</template>

<script lang="ts" setup>
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import CSwitch from '@/components/common/CSwitch.vue';
import CSelect from '@/components/common/CSelect.vue';
import { showToast } from '@/utils';
import { ref, watch } from 'vue';
import { disableAnim, moreContrast, initDisableAnim, initMoreContrast, initEruda, destroyEruda } from '@/utils/env';

// 定义模式类型
type FeatureMode = 'enable' | 'disable' | 'system';

// 定义调试选项接口
interface DebugOptions {
  showConsole: boolean;
  noAnimation: FeatureMode;
  highContrast: FeatureMode;
}

// 模式选项
const modeOptions = [
  { label: '启用', value: 'enable' },
  { label: '禁用', value: 'disable' },
  { label: '跟随系统', value: 'system' }
];

// 从localStorage获取调试选项
const getDebugOptions = (): DebugOptions => {
  try {
    const storedOptions = localStorage.getItem('debug');
    if (storedOptions) {
      const options = JSON.parse(storedOptions);
      return {
        showConsole: options.showConsole ?? false,
        noAnimation: options.disableAnim ?? 'system', // 直接使用新key
        highContrast: options.moreContrast ?? 'system' // 直接使用新key
      };
    }
  } catch (error) {
    console.error('解析调试选项失败:', error);
  }

  // 默认值
  return {
    showConsole: false,
    noAnimation: 'system',
    highContrast: 'system'
  };
};

// 保存调试选项到localStorage
const saveDebugOptions = (options: DebugOptions) => {
  try {
    localStorage.setItem('debug', JSON.stringify({
      showConsole: options.showConsole,
      disableAnim: options.noAnimation, // 只保存新key
      moreContrast: options.highContrast // 只保存新key
    }));
  } catch (error) {
    console.error('保存调试选项失败:', error);
  }
};

// 创建响应式调试选项
const debugOptions = ref<DebugOptions>(getDebugOptions());

// 监听调试选项变化并保存
watch(debugOptions, (newOptions) => {
  saveDebugOptions(newOptions);

  // 应用无动画模式
  if (disableAnim !== undefined) {
    // 根据三态值设置disableAnim
    if (newOptions.noAnimation === 'enable') {
      disableAnim.value = true; // 启用无动画模式 = 禁用动画
    } else if (newOptions.noAnimation === 'disable') {
      disableAnim.value = false; // 禁用无动画模式 = 启用动画
    } else if (newOptions.noAnimation === 'system') {
      initDisableAnim(); // 重新初始化以获取系统当前状态
    }
  }

  // 应用高对比模式
  if (moreContrast) {
    // 根据三态值设置moreContrast
    if (newOptions.highContrast === 'enable') {
      moreContrast.value = true;
    } else if (newOptions.highContrast === 'disable') {
      moreContrast.value = false;
    } else if (newOptions.highContrast === 'system') {
      initMoreContrast(); // 重新初始化以获取系统当前状态
    }
  }

  // 应用显示控制台
  if (newOptions.showConsole) {
    initEruda()
  } else {
    destroyEruda()
  }
}, { deep: true, immediate: true });

const resetToDefault = () => {
  debugOptions.value = {
    showConsole: false,
    noAnimation: 'system',
    highContrast: 'system'
  };
  showToast('已恢复默认设置');
}
</script>

<style lang="scss" scoped>
.debug-view {
  max-width: 600px;
  height: var(--page-height);
}

.debug-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e5ea;
}

.debug-control {
  width: auto;
  margin-left: auto;
  font-size: 18px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  .arrow-icon {
    font-size: 24px;
  }
}

.debug-label {
  flex: 0 0 120px;
  font-size: 17px;
  font-weight: 500;
}
</style>
