<template>
  <c-dialog title="AI配置" :visible="visible" @close="$emit('close')">
    <div class="form-item">
      <div class="form-item-label">baseURL</div>
      <input type="text" name="baseURL" v-model.trim="aisettings.baseURL" class="form-item-input">
    </div>
    <div class="form-item">
      <div class="form-item-label">apiKey</div>
      <input type="text" name="apiKey" v-model.trim="aisettings.apiKey" class="form-item-input">
    </div>
    <div class="form-item">
      <div class="form-item-label">模型(Model)</div>
      <input type="text" name="model" v-model.trim="aisettings.model" class="form-item-input">
    </div>
    <div class="form-item">
      <button class="btn primary-btn" @click="saveAISettings">保存</button>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue'
import { showToast } from '@/utils'
import { preferences } from '@/stores/preferences'
import { ref } from 'vue'

defineProps<{ visible: boolean }>()

const emits = defineEmits<{ close: [] }>()

const aisettings = ref({
  baseURL: '',
  apiKey: '',
  model: '',
  ...preferences.value.ai
})

const saveAISettings = () => {
  const { baseURL, apiKey, model } = aisettings.value
  if (!baseURL || !apiKey || !model) {
    const msg = '请完整填写'
    showToast(msg)
    throw new Error(msg)
  }
  preferences.value.ai = { baseURL, model, apiKey }
  showToast('保存成功')
  emits('close')
}
</script>

<style scoped lang="scss">
.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  .form-item-label {
    font-size: 14px;
    font-weight: 500;
    opacity: 0.6;
    margin-left: 6px;
  }
  .form-item-input {
    font-size: 16px;
    padding: 6px;
    outline: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    background: none;
  }
}
</style>
