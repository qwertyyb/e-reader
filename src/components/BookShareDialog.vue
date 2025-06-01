<template>
  <Teleport to="#app">
    <div
      v-if="visible"
      @click.self="$emit('close')"
      class="book-share-dialog"
    >
      <div class="share-wrapper">
        <div class="book-share" v-if="book" ref="share-container">
          <img :src="book.cover" alt="" class="book-cover">
          <div class="book-title">{{ ellipsisText(book.title, 20) }}</div>
          <div class="share-footer">
            <div class="share-text">我正在读【{{ ellipsisText(chapter?.title || '', 48) }}】</div>
            <div class="qrcode-wrapper">
              <img :src="qrcode" alt="" class="share-qrcode">
              <div class="app-name">E Reader</div>
            </div>
          </div>
        </div>
        <img class="book-share-image" v-if="img" :src="img" />
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
import { ellipsisText, showToast } from '@/utils';
import { inject, onMounted, ref, useTemplateRef, watch, type ComputedRef, type Ref } from 'vue';
import QRCode from 'qrcode'

const props = defineProps<{
  visible: boolean
}>()

const book = inject<Ref<IBook>>('book')
const chapter = inject<ComputedRef<IChapter>>('chapter')

const shareRef = useTemplateRef('share-container')
const qrcode = ref('')

let file: File | null = null

const img = ref('')

const supportWebShare = 'canShare' in navigator

onMounted(async () => {
  qrcode.value = await QRCode.toDataURL('https://qwertyyb.github.io/e-reader/')
})

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
  if (img.value) {
    URL.revokeObjectURL(img.value)
  }
  img.value = URL.createObjectURL(file)
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
.share-wrapper {
  position: relative;
  width: 300px;
  height: 520px;
  overflow: hidden;
  margin: 0 auto;
}
.book-share {
  width: 100%;
  height: 100%;
  background: #fff;
}
.book-share-image {
  width: 300px;
  height: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.book-cover {
  width: 300px;
  height: 400px;
  display: block;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: default;
  border-bottom: 1px solid #eee;
}
.book-title {
  font-weight: bold;
  text-align: center;
  font-size: 16px;
  margin: 4px 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.share-footer {
  display: flex;
  align-items: center;
  font-size: 14px;
}
.qrcode-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  margin-left: auto;
}
.app-name {
  font-size: 9px;
  text-align: center;
  font-weight: bold;
  margin-top: -8px;
}
.share-text {
  margin-left: 12px;
}
.share-qrcode {
  width: 60px;
  height: 60px;
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