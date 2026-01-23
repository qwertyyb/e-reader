<template>
  <c-select
    v-model="modelValue"
    title="字体"
    class="font-selector"
    :options="fontFamilyList"
    layout="grid"
    picker-class="font-selector-picker"
  >
    <template #default="{ label }">
      <div class="font-selector-trigger">
        <img
          v-if="currentFontPreview"
          :src="currentFontPreview"
          :alt="label"
          class="font-preview-image"
        />
        <span v-else class="font-name">{{ label || '默认' }}</span>
        <span class="material-symbols-outlined arrow-icon" style="margin-left: auto">chevron_right</span>
      </div>
    </template>

    <template #option="{ option }">
      <div
        class="font-option"
        :class="{
          'loading': loadingFonts.has(option.value)
        }"
        @click.stop="selectFont(option)"
      >
        <img
          :src="getFontPreviewUrl(option.value)"
          :alt="option.label"
          class="font-preview-image"
        />
        <div
          v-if="loadingFonts.has(option.value)"
          class="loading-progress"
          :style="{ width: `${(fontLoadProgress.get(option.value) || 0) * 100}%` }"
          :title="`Loading: ${Math.round((fontLoadProgress.get(option.value) || 0) * 100)}%`"
        ></div>
      </div>
    </template>
  </c-select>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fontFamilyList } from '@/config'
import { showToast } from '@/utils'
import CSelect from '@/components/common/CSelect.vue'

// Props and emits
const modelValue = defineModel<string>({ required: true })
const emit = defineEmits<{
  fontLoaded: [fontFamily: string]
}>()

// State
const loadingFonts = ref(new Set<string>())
const fontLoadProgress = ref(new Map<string, number>())

// Helper function to check if font is loaded
const isFontLoaded = (fontFamily: string): boolean => {
  if (fontFamily === 'default') return true
  return document.fonts.check(`16px "${fontFamily}"`)
}

// Computed
const currentFontPreview = computed(() => {
  return getFontPreviewUrl(modelValue.value)
})

// Methods
const getFontPreviewUrl = (fontValue: string) => {
  if (!fontValue || fontValue === 'default') return ''
  
  // 先将空格替换为下划线，然后进行 URL 编码
  const normalizedFontValue = fontValue.replace(/\s+/g, '_')
  const encodedFontValue = encodeURIComponent(normalizedFontValue)
  return `/e-reader/fonts/preview/${encodedFontValue}.png`
}

const loadFont = async (fontFamily: string): Promise<void> => {
  if (isFontLoaded(fontFamily)) {
    return Promise.resolve()
  }

  if (loadingFonts.value.has(fontFamily)) {
    // 如果正在加载，等待加载完成
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (isFontLoaded(fontFamily)) {
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
    })
  }

  loadingFonts.value.add(fontFamily)
  fontLoadProgress.value.set(fontFamily, 0)

  // 创建进度更新
  let progress = 0
  const progressInterval = setInterval(() => {
    progress += Math.random() * 0.15 + 0.05 // 随机增加5-20%
    if (progress > 0.9) {
      progress = 0.9 // 最多到90%，等待实际加载完成
    }
    fontLoadProgress.value.set(fontFamily, progress)
  }, 150)

  try {
    // 使用 document.fonts.load 加载字体
    await document.fonts.load(`16px "${fontFamily}"`)

    // 清理进度更新
    clearInterval(progressInterval)
    fontLoadProgress.value.set(fontFamily, 1)

    // 短暂延迟显示100%进度
    await new Promise(resolve => setTimeout(resolve, 200))

    // 更新状态
    loadingFonts.value.delete(fontFamily)

    // 触发加载完成事件
    emit('fontLoaded', fontFamily)

    console.log(`Font loaded successfully: ${fontFamily}`)
  } catch (error) {
    console.error(`Failed to load font: ${fontFamily}`, error)

    // 清理进度更新
    clearInterval(progressInterval)
    loadingFonts.value.delete(fontFamily)
    fontLoadProgress.value.delete(fontFamily)

    // 显示错误提示
    showToast(`字体加载失败: ${fontFamily}`)

    // 触发加载完成事件（即使失败也触发，避免界面卡住）
    emit('fontLoaded', fontFamily)
  }
}

const selectFont = async (option: { value: string, label: string }) => {
  // 如果字体正在加载，忽略点击
  if (loadingFonts.value.has(option.value)) {
    return
  }

  // 先加载字体（loadFont 内部会处理 default 情况）
  await loadFont(option.value)

  // 加载完成后设置选中状态
  modelValue.value = option.value
}

// 预加载当前字体
onMounted(() => {
  if (modelValue.value) {
    loadFont(modelValue.value)
  }
})
</script>

<style lang="scss" scoped>
.font-selector {
  .font-selector-trigger {
    display: flex;
    align-items: center;
    width: 100%;

    .font-preview-image {
      height: 16px;
      width: auto;
      object-fit: contain;
      object-position: left center;
    }

    .font-name {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
}

.font-option {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 16px;

  &.loading {
    opacity: 0.7;
  }

  .font-preview-image {
    height: 16px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    position: relative;
    z-index: 1;
  }

  .loading-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--theme-color);
    opacity: 0.4;
    transition: width 0.3s ease;
    border-radius: 4px;
    z-index: 0;
  }
}
</style>

<!-- 全局样式，用于 CPicker 组件 -->
<style lang="scss">
// 字体选择器专用的 picker 样式 - 全局样式
.font-selector-picker {
  .c-option-list.layout-grid .c-option {
    padding: 0 !important;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    overflow: hidden;

    &.selected {
      border-color: var(--theme-color);
      .front-preview-image {
        filter: invert(0);
      }
    }

    &:hover {
      border-color: var(--theme-color-hover);
    }
  }
}

html.more-contrast.dark {
  .font-selector-picker .c-option.selected .font-preview-image {
    filter: invert(0);
  }
  .font-selector .font-preview-image {
    filter: invert(1);
  }
}
html.more-contrast:not(.dark) {
  .font-selector-picker .c-option.selected .font-preview-image {
    filter: invert(1);
  }
}

// 暗色模式适配 - 字体预览图片反色
html.dark {
  .font-selector .font-preview-image,
  .font-option .font-preview-image {
    filter: invert(1) brightness(0.8) contrast(0.8);
  }
}
</style>
