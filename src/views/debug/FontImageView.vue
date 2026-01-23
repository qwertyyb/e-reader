<template>
  <div class="font-image-view">
    <div class="header">
      <h2>字体图片生成器</h2>
      <p>选择字体后生成包含字体名称的图片</p>
    </div>

    <div class="controls">
      <div class="form-group">
        <label for="font-select">选择字体：</label>
        <select id="font-select" v-model="selectedFont" @change="updatePreview">
          <option value="">请选择字体</option>
          <option v-for="font in availableFonts" :key="font.value" :value="font.value">
            {{ font.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="font-size">字体大小：</label>
        <input 
          id="font-size" 
          type="range" 
          v-model="fontSize" 
          min="12" 
          max="200" 
          step="2"
          @input="updatePreview"
        />
        <span class="size-value">{{ fontSize }}px</span>
      </div>

      <div class="form-group">
        <label for="text-color">文字颜色：</label>
        <input 
          id="text-color" 
          type="color" 
          v-model="textColor" 
          @change="updatePreview"
        />
      </div>

      <div class="form-group">
        <label for="custom-text">自定义文字：</label>
        <input 
          id="custom-text" 
          type="text" 
          v-model="customText" 
          placeholder="留空则使用字体名称"
          @input="updatePreview"
        />
      </div>

      <div class="form-group">
        <label for="padding">内边距：</label>
        <input 
          id="padding" 
          type="range" 
          v-model="padding" 
          min="0" 
          max="100" 
          step="5"
          @input="updatePreview"
        />
        <span class="size-value">{{ padding }}px</span>
      </div>
    </div>

    <div class="preview-section">
      <h3>预览</h3>
      <div class="preview-container">
        <div v-if="isLoadingFont" class="loading-indicator">
          <span>正在加载字体...</span>
        </div>
        <canvas 
          ref="previewCanvas" 
          class="preview-canvas"
          :style="{ 
            border: '1px dashed #ccc',
            display: isLoadingFont ? 'none' : 'block'
          }"
        ></canvas>
        <div v-if="!selectedFont && !isLoadingFont" class="placeholder">
          请选择字体以查看预览
        </div>
      </div>
    </div>

    <div class="actions">
      <button 
        @click="downloadImage" 
        :disabled="!selectedFont || isLoadingFont"
        class="download-btn"
      >
        下载图片
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { fontFamilyList } from '@/config/index'

// 响应式数据
const selectedFont = ref('')
const fontSize = ref(48)
const textColor = ref('#000000')
const customText = ref('')
const padding = ref(20)
const previewCanvas = ref<HTMLCanvasElement>()
const isLoadingFont = ref(false)

// 可用字体列表 - 从配置文件导入
const availableFonts = ref(fontFamilyList.map(font => ({
  name: font.label,
  value: font.value
})))

// 计算属性
const displayText = computed(() => {
  if (customText.value.trim()) {
    return customText.value.trim()
  }
  const font = availableFonts.value.find(f => f.value === selectedFont.value)
  return font ? font.name : ''
})

// 加载字体
const loadFont = async (fontFamily: string, fontSize: number): Promise<boolean> => {
  try {
    // 构造字体描述符
    const fontDescriptor = `${fontSize}px "${fontFamily}"`
    
    // 使用 document.fonts.load 加载字体
    await document.fonts.load(fontDescriptor)
    
    // 检查字体是否真的加载成功
    return document.fonts.check(fontDescriptor)
  } catch (error) {
    console.warn(`Failed to load font: ${fontFamily}`, error)
    return false
  }
}

// 更新预览
const updatePreview = async () => {
  if (!previewCanvas.value || !selectedFont.value || !displayText.value) return

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置加载状态
  isLoadingFont.value = true

  try {
    // 等待下一个 tick，确保 DOM 更新完成
    await nextTick()
    
    // 先加载字体
    const fontLoaded = await loadFont(selectedFont.value, fontSize.value)
    if (!fontLoaded) {
      console.warn(`Font "${selectedFont.value}" not loaded, using fallback`)
    }

    // 再等待一小段时间，确保字体完全可用
    await new Promise(resolve => setTimeout(resolve, 100))

    // 设置字体
    const fontString = `${fontSize.value}px "${selectedFont.value}"`
    ctx.font = fontString
    ctx.fillStyle = textColor.value
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // 测量文字尺寸
    const metrics = ctx.measureText(displayText.value)
    const textWidth = metrics.width
    
    // 计算真实的文字高度
    const actualAscent = metrics.actualBoundingBoxAscent || metrics.fontBoundingBoxAscent || fontSize.value * 0.8
    const actualDescent = metrics.actualBoundingBoxDescent || metrics.fontBoundingBoxDescent || fontSize.value * 0.2
    const textHeight = actualAscent + actualDescent

    // 设置画布尺寸
    canvas.width = textWidth + padding.value * 2
    canvas.height = textHeight + padding.value * 2

    // 清除画布（透明背景）
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 重新设置字体（清除画布后需要重新设置）
    ctx.font = fontString
    ctx.fillStyle = textColor.value
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // 绘制文字，使用top基线，Y坐标考虑实际的文字边界
    // 计算垂直居中位置：画布高度的一半减去文字高度的一半，再加上ascent偏移
    const centerY = (canvas.height - textHeight) / 2 + actualAscent
    ctx.fillText(displayText.value, padding.value, centerY)
  } catch (error) {
    console.error('Error in updatePreview:', error)
  } finally {
    // 清除加载状态
    isLoadingFont.value = false
  }
}

// 下载图片
const downloadImage = async () => {
  if (!previewCanvas.value || !selectedFont.value || !displayText.value) return

  // 确保预览是最新的
  await updatePreview()
  
  // 直接从预览Canvas生成图片URL并下载
  const imageUrl = previewCanvas.value.toDataURL('image/png')
  
  const link = document.createElement('a')
  link.download = `${displayText.value || 'font-image'}.png`
  link.href = imageUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 组件挂载时初始化
onMounted(() => {
  // 字体列表已从配置文件导入
})
</script>

<style scoped>
.font-image-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  margin: 0;
}

.controls {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  min-width: 100px;
  font-weight: 500;
  color: #333;
}

.form-group select,
.form-group input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input[type="range"] {
  flex: 1;
  margin-right: 10px;
}

.form-group input[type="color"] {
  width: 50px;
  height: 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.size-value {
  min-width: 50px;
  font-weight: 500;
  color: #666;
}

.preview-section {
  margin-bottom: 30px;
}

.preview-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.preview-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
  min-height: 120px;
  align-items: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 14px;
}

.loading-indicator::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.placeholder {
  color: #999;
  font-style: italic;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.preview-canvas {
  max-width: 100%;
  background: white;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.download-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #28a745;
  color: white;
}

.download-btn:hover:not(:disabled) {
  background: #1e7e34;
}

.download-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .font-image-view {
    padding: 15px;
  }
  
  .form-group {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-group label {
    min-width: auto;
    margin-bottom: 5px;
  }
  
  .form-group select,
  .form-group input[type="text"],
  .form-group input[type="range"] {
    width: 100%;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>