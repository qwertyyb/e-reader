import { MAX_SMALL_WIDTH } from "@/constant";
import { Capacitor } from "@capacitor/core";
import { ref, watch, type Ref } from "vue"

// 声明 window.eruda 类型
declare global {
  interface Window {
    eruda?: {
      init: () => void;
      destroy: () => void;
    };
    erudaInited?: boolean
  }
}

// 获取调试选项的值
const getDebugOption = <T>(key: string): T | undefined => {
  try {
    const debugOptions = JSON.parse(localStorage.getItem('debug') || '{}');
    return debugOptions[key] as T;
  } catch (error) {
    console.error('解析调试选项失败:', error);
    return undefined;
  }
}

export const env = {
  isPwa: () => window.matchMedia('(display-mode: standalone)').matches,
  isBooxLeaf: () => navigator.userAgent.includes('Leaf'),
  isHorizontal: () => navigator.userAgent.includes('Leaf') || location.href.includes('ink=1'),
  isInk: () => navigator.userAgent.includes('Leaf') || location.href.includes('ink=1'),
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isApp: () => ['android', 'ios'].includes(Capacitor.getPlatform()),
  isAndroidApp: () => Capacitor.getPlatform() === 'android',
  isIosApp: () => Capacitor.getPlatform() === 'ios',
}

export const getSafeAreaTop = () => window.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sait"), 10)

// 创建一个通用的初始化函数
interface InitFeatureOptions {
  mediaQuery: string;          // 媒体查询字符串
  urlParam: string;           // URL参数名
  storageKey: string;         // localStorage中的键名
  refValue: Ref<boolean>;     // ref对象
  urlParamValue: boolean;     // URL参数对应的值
}


const createFeatureInitializer = (options: InitFeatureOptions) => {
  let mediaMatch: MediaQueryList | null = null

  const handler = () => {
    // 优先级1：URL参数
    if (location.href.includes(options.urlParam)) {
      options.refValue.value = options.urlParamValue;
    }
    // 优先级2：localStorage配置项
    else {
      const featureMode = getDebugOption<'enable' | 'disable' | 'system'>(options.storageKey);
      if (featureMode !== undefined) {
        if (featureMode === 'enable') {
          options.refValue.value = true;
        } else if (featureMode === 'disable') {
          options.refValue.value = false;
        } else if (featureMode === 'system') {
          // 跟随系统设置
          options.refValue.value = mediaMatch?.matches ?? false;
        }
      }
      // 优先级3：用户环境
      else {
        options.refValue.value = mediaMatch?.matches ?? false;
      }
    }
  };

  return () => {
    if (mediaMatch) {
      handler()
      return;
    }

    mediaMatch = window.matchMedia(options.mediaQuery)
    mediaMatch.addEventListener('change', handler);
    // 立即执行一次处理
    handler();
  };
};

// 创建一个更新DOM类的函数
const updateDOMClass = (value: boolean, className: string) => {
  if (value && !document.documentElement.classList.contains(className)) {
    document.documentElement.classList.add(className);
  } else if (!value && document.documentElement.classList.contains(className)) {
    document.documentElement.classList.remove(className);
  }
};

export const disableAnim = ref(false);

  // 监听disableAnim的变化
  watch(disableAnim, (value) => {
    // 直接使用disableAnim的值，类名改为disable-anim
    updateDOMClass(value, 'disable-anim');
  });

export const initDisableAnim = createFeatureInitializer({
  mediaQuery: '(prefers-reduced-motion: reduce)',
  urlParam: 'disAnim=1',
  storageKey: 'disableAnim',
  refValue: disableAnim,
  urlParamValue: true // disAnim=1 表示禁用动画，所以值为true
});

export const moreContrast = ref(false);

// 监听moreContrast的变化
watch(moreContrast, (value) => {
  updateDOMClass(value, 'more-contrast');
});

export const initMoreContrast = createFeatureInitializer({
  mediaQuery: '(prefers-contrast: more)',
  urlParam: 'moreContrast=1',
  storageKey: 'moreContrast',
  refValue: moreContrast,
  urlParamValue: true
});

export const initEruda = () => {
  if (getDebugOption('showConsole') && !window.erudaInited && window.eruda) {
    // 把之前记录的位置清掉，防止挪到了无法移动的位置
    localStorage.removeItem('eruda-entry-button')
    window.eruda.init()
    window.erudaInited = true
  }
}

export const destroyEruda = () => {
  if (window.erudaInited) {
    window.eruda?.destroy()
    window.erudaInited = false
  }
}

export const isSmall = ref(window.innerWidth <= MAX_SMALL_WIDTH)

const handler = () => {
  isSmall.value = window.innerWidth <= MAX_SMALL_WIDTH
}

window.addEventListener('resize', handler)
