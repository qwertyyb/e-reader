<template>
  <Teleport to="#app">
    <div
      v-if="visible"
      @click.self="$emit('close')"
      class="book-share-dialog"
    >
      <div class="book-share" v-if="book" ref="share-container">
        <img :src="book.cover" alt="" class="book-cover">
        <div class="book-title">{{ book?.title }}</div>
      </div>
      <div class="actions">
        <div class="material-symbols-outlined share-icon pointer action-item"
          @click="share"
          v-if="supportWebShare"
        >share</div>
        <div class="material-symbols-outlined download-icon pointer action-item"
          @click="download"
          v-else
        >download</div>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { showToast } from '@/utils';
import { inject, useTemplateRef, watch, type Ref } from 'vue';

const props = defineProps<{
  visible: boolean
}>()

const book = inject<Ref<IBook>>('book')

const shareRef = useTemplateRef('share-container')

let file: File | null = null

const supportWebShare = 'canShare' in navigator

watch(() => props.visible, async (visible) => {
  if (!visible) return;
  await new Promise(resolve => setTimeout(resolve, 500))
  if (!shareRef.value) return;
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(shareRef.value)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg'))
  if (!blob) {
    showToast('无法生成图片')
    throw new Error('无法生成图片')
  }
  file = new File([blob], 'share.jpg', {
    type: blob.type
  })
})

const share = async () => {
  console.log(file)
  if (!file) return;
  const canShare = navigator.canShare({ files: [file] })
  if (!canShare) {
    showToast('该平台无法分享图片')
    throw new Error('该平台无法分享图片')
  }
  navigator.share({ files: [file] })
  .then(() => showToast('分享成功'))
  .catch((err) => {
    if (err.name === 'AbortError') return;
    showToast('分享失败')
    throw err
  })
}

const download = async () => {
  if (!file) return;
  const a = document.createElement('a');
  a.download = file.name;
  a.style.display = 'none';
  a.href = URL.createObjectURL(file);
  a.addEventListener('click', () => {
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000)
  });
  document.body.append(a);
  a.click();
}
</script>

<style lang="scss" scoped>
.book-share-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.65);
}
.book-share {
  background-image: url('@/assets/share-bg.jpeg');
  background-size: cover;
  background-repeat: no-repeat;
  width: 300px;
  height: 500px;
  overflow: hidden;
  margin: 0 auto;
}
.book-cover {
  width: 181px;
  height: auto;
  margin: 60px 0 0 61px;
  display: block;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: default;
}
.book-title {
  font-weight: bold;
  text-align: center;
  font-size: 18px;
  margin-top: 8px;
}
.actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
  .action-item {
    background: var(--card-bg-color);
    border-radius: 9999px;
    padding: 12px;
  }
}
.share-icon, .download-icon {
  font-size: 28px;
  text-align: center;
}
</style>