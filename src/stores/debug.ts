import { showToast } from "@/utils";
import { destroyEruda, disableAnim, initDisableAnim, initEruda, initMoreContrast, moreContrast } from "@/utils/env";
import { ref, watch } from "vue";

// 定义模式类型
type FeatureMode = 'enable' | 'disable' | 'system';

// 定义调试选项接口
interface DebugOptions {
  showConsole: boolean;
  noAnimation: FeatureMode;
  highContrast: FeatureMode;
}

// 模式选项
export const modeOptions = [
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
export const debugOptions = ref<DebugOptions>(getDebugOptions());

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

export const resetToDefault = () => {
  debugOptions.value = {
    showConsole: false,
    noAnimation: 'system',
    highContrast: 'system'
  };
  showToast('已恢复默认设置');
}
