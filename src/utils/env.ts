import { MAX_SMALL_WIDTH, SYNC_DEVICE_STORAGE_KEY } from "@/constant";
import { Capacitor } from "@capacitor/core";
import Logger from "js-logger";
import { ref, watch, type Ref } from "vue"
import { randomString } from "./index";

const logger = Logger.get('env')

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

function extractOsVersion(userAgent: string) {
  const result = {
    os: 'Unknown',
    version: ''
  };
  const ua = userAgent.toLowerCase();

  // 1. 匹配 iOS (iPhone/iPad/iPod 均为 iOS 系统)
  const iosReg = /iphone os ([\d_]+)|ipad os ([\d_]+)|ipod touch ([\d_]+)/;
  const iosMatch = ua.match(iosReg);
  if (iosMatch) {
    result.os = 'iOS';
    // 取匹配到的版本号（正则分组里有值的那个）
    result.version = iosMatch.slice(1).filter(Boolean)[0].replace(/_/g, '.');
    return result;
  }

  // 2. 匹配 Android
  const androidReg = /android\s+([\d.]+)/;
  const androidMatch = ua.match(androidReg);
  if (androidMatch) {
    result.os = 'Android';
    result.version = androidMatch[1];
    return result;
  }

  // 3. 匹配 macOS (兼容新旧UA格式：Mac OS X / macOS)
  const macReg = /mac os x ([\d_]+)|macos ([\d.]+)/;
  const macMatch = ua.match(macReg);
  if (macMatch) {
    result.os = 'MacOS';
    const versionStr = macMatch.slice(1).filter(Boolean)[0];
    // 处理下划线转点
    result.version = versionStr.replace(/_/g, '.');
    return result;
  }

  // 4. 匹配 Windows + 版本映射
  const winReg = /windows nt ([\d.]+)/;
  const winMatch = ua.match(winReg);
  if (winMatch) {
    result.os = 'Windows';
    const winVersionMap: Record<string, string> = {
      '5.0': 'XP',
      '5.1': 'XP',
      '5.2': 'Server 2003',
      '6.0': 'Vista',
      '6.1': '7',
      '6.2': '8',
      '6.3': '8.1',
      '10.0': '10/11' // Win10/11 的UA内核版本均为 10.0
    };
    // 匹配到的内核版本
    const kernelVersion = winMatch[1];
    result.version = winVersionMap[kernelVersion] || kernelVersion;
    return result;
  }

  return result;
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
  isAndroid: () => navigator.userAgent.includes('Android'),
  isWindows: () => navigator.userAgent.includes('Windows'),
  isMacOS: () => navigator.userAgent.includes('Macintosh'),
  version: () => extractOsVersion(navigator.userAgent)
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

export const getDeviceInfo = () => {
  const storageValue = localStorage.getItem(SYNC_DEVICE_STORAGE_KEY)
  if (storageValue) {
    try {
      const info = JSON.parse(storageValue)
      if (info.deviceId && info.device) {
        return { deviceId: info.deviceId, device: info.device }
      }
    } catch (err) {
      logger.error('parse device info error', err, storageValue)
    }
  }
  const deviceId = randomString()
  // 从 userAgent 中获取设备类型（iOS、Android、PC、MacOS、Linux、Windows）、系统版本、浏览器类型、浏览器版本
  const { os, version } = env.version()
  const device = [os, version, randomString(4)].filter(Boolean).join('-')
  localStorage.setItem(SYNC_DEVICE_STORAGE_KEY, JSON.stringify({ deviceId, device }))
  return {
    deviceId,
    device
  }
}
