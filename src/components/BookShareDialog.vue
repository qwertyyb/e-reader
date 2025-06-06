<template>
  <Teleport to="#app">
    <div
      v-if="visible"
      @click.self="$emit('close')"
      class="book-share-dialog"
    >
      <div class="share-preview">
        <div class="share-container reading" v-if="book && !text" ref="share-container">
          <img :src="book?.cover" alt="" class="book-cover">
          <div class="book-title">{{ ellipsisText(book?.title || '', 20) }}</div>
          <div class="book-author" v-if="book?.author">{{ ellipsisText(book?.author || '', 20) }} 著</div>
          <div class="share-footer">
            <div class="share-text">我正在读【{{ ellipsisText(chapter?.title || '', 48) }}】</div>
            <div class="qrcode-wrapper">
              <img :src="qrcode" alt="" class="share-qrcode">
              <div class="app-name">E Reader</div>
            </div>
          </div>
        </div>
        <div class="share-container content" v-if="book && text" ref="share-container">
          <img :src="book?.cover" alt="" class="book-cover">
          <div class="share-text-container">
            <div class="share-text-wrapper">
              <div class="share-text">{{ text }}</div>
              <div class="share-text-suffix"><span class="text-prefix"></span>{{ ellipsisText(textChapter?.title || '', 48) }}</div>
            </div>
            <div class="share-footer">
              <div class="footer-left">
                <div class="text-time">摘录于 {{ textTime }}</div>
                <div class="book-author" v-if="book?.author">{{ ellipsisText(book.author || '', 26) }} 著</div>
                <div class="app-name">E Reader</div>
              </div>
              <img :src="qrcode" alt="" class="share-qrcode">
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
import { computed, inject, nextTick, onMounted, ref, useTemplateRef, watch, type ComputedRef, type Ref } from 'vue';
import QRCode from 'qrcode'

const props = defineProps<{
  visible: boolean,
  text?: string,
  chapterIndex?: number
}>()

defineEmits<{ close: [] }>()

const book = inject<Ref<IBook>>('book')
const chapter = inject<ComputedRef<IChapter>>('chapter')
const chapterList = inject<Ref<IChapter[]>>('chapterList')

const shareRef = useTemplateRef('share-container')

const textChapter = computed(() => {
  if (!props.text || typeof props.chapterIndex === 'undefined') return;
  return chapterList?.value[props.chapterIndex]
})

const qrcode = ref('')
const textTime = ref('')

let file: File | null = null

const img = ref('')

const supportWebShare = 'canShare' in navigator

onMounted(async () => {
  qrcode.value = await QRCode.toDataURL('https://qwertyyb.github.io/e-reader/')
})

watch(() => props.visible, async (visible) => {
  if (!visible) return;
  img.value = ''
  textTime.value = new Date().toLocaleDateString()
  await nextTick()
  if (!shareRef.value) return;
  const { snapdom } = await import('@zumer/snapdom')
  const blob = await snapdom.toBlob(shareRef.value)
  if (!blob) {
    showToast('无法生成图片')
    throw new Error('无法生成图片')
  }
  file = new File([blob], `${book?.value.title || '分享'}.jpg`, {
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
  z-index: 10;
}
.share-preview {
  position: relative;
  margin: 0 auto;
  max-height: 600px;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
}
.share-container {
  width: 100%;
  height: fit-content;
  background: #fff;
  position: relative;
  &.reading {
    width: 300px;
    // height: 500px;
    * {
      color: #111;
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
    .book-author {
      text-align: center;
      font-size: 14px;
      opacity: 0.6;
      padding: 0 16px;
    }
    .book-title {
      font-weight: bold;
      text-align: center;
      font-size: 16px;
      margin: 4px 16px 0 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .share-footer {
      display: flex;
      align-items: center;
      font-size: 14px;
      padding-bottom: 12px;
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
      font-size: 11px;
      text-align: center;
      font-weight: bold;
      margin-top: -6px;
    }
    .share-text {
      margin-left: 12px;
    }
    .share-qrcode {
      width: 60px;
      height: 60px;
    }
  }
  &.content {
    width: 330px;
    min-height: 440px;
    * {
      color: #000;
    }
    .book-cover {
      width: 100%;
      height: auto;
    }
    .share-text-container {
      width: 100%;
      background: #fff;
    }
    .share-text-wrapper {
      background: rgba(255, 255, 255, 1);
      padding: 8px 12px;
      border-radius: 2px;
      margin-top: -48px;
      position: relative;
      z-index: 1;
      width: 300px;
      margin-left: auto;
      margin-right: auto;
      border: 1px solid #eee;
    }
    .share-text-suffix {
      font-size: 12px;
      margin-top: 12px;
      text-align: right;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      .text-prefix {
        width: 2em;
        height: 1px;
        background: #333;
        display: inline-block;
        margin-right: 4px;
      }
    }
    .share-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      padding: 16px;
      background: #f1eeee;
      font-size: 13px;
      .book-author {
        opacity: 0.7;
        font-size: 12px;
      }
      .app-name {
        font-size: 12px;
        opacity: 0.7;
        font-weight: 300;
      }
      .share-qrcode {
        width: 60px;
        height: 60px;
        border: 1px solid #bbb;
      }
    }
  }
}
.book-share-image {
  width: 100%;
  height: auto;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
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
