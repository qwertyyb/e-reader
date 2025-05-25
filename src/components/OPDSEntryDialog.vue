<template>
  <c-dialog title="内容详情" :visible="visible" @close="$emit('close')">
    <div class="entry-detail" v-if="entry">
      <div class="entry-header">
        <img :src="getEntryImage(entry, 'image')" alt="" class="entry-cover">
        <div class="entry-info">
          <h2 class="entry-title">{{ entry.title }}</h2>
          <p class="entry-author" v-if="entry.author?.length">
            <span class="info-label">作者：</span>
            {{ entry.author.map(item => item.name).join('、') }}
          </p>
          <p class="entry-published" v-if="entry.published">
            <span class="info-label">发布时间：</span>
            {{ formatDate(entry.published) }}
          </p>
          <p class="entry-updated">
            <span class="info-label">更新时间：</span>
            {{ formatDate(entry.updated) }}
          </p>
          <p class="entry-category" v-if="entry.category?.length && entry.category.map(item => item.label).filter(Boolean).length">
            <span class="info-label">分类：</span>
            {{ entry.category.map(item => item.label).join('、') }}
          </p>
          <p class="entry-extent"
            v-for="item in (entry['dcterms:extent'] || [])"
            :key="item"
          >
            {{ item }}
          </p>
        </div>
      </div>

      <div class="entry-summary" v-if="entry.summary">
        <h3 class="section-title">简介</h3>
        <div class="summary-content">
          {{ typeof entry.summary === 'string' ? entry.summary : entry.summary.text }}
        </div>
      </div>

      <div class="entry-actions">
        <button class="btn primary-btn"
          :disabled="btn.disabled"
          @click="downloadEntry"
        >{{ btn.text }}</button>
      </div>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from '@/components/common/CDialog.vue';
import { download } from '@/services/ImportService';
import type { IContentEntry } from '@/services/opds';
import { getEntryImage, formatDate, LinkRel, getLinksByRel } from '@/services/opds';
import { showPicker, showToast } from '@/utils';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  visible: boolean,
  entry: IContentEntry | null,
  downloaded?: { id: number } | false,
}>()

const emits = defineEmits<{ close: [], downloaded: [{ id: number }] }>()

const downloading = ref(false)
const downloadProgress = ref(-1)
const router = useRouter()

const btn = computed(() => {
  if (props.downloaded) {
    return {
      text: '开始阅读',
      disabled: false,
    }
  }
  if (!entryDownloadUrls.value.length) {
    return {
      text: '暂不支持下载本书',
      disabled: true,
    }
  }
  if (downloading.value) {
    return {
      text: `下载中${ downloadProgress.value }%`,
      disabled: true,
    }
  }
  return {
    text: `下载本书(${entryDownloadUrls.value[0].format}格式)`,
    disabled: false,
  }
})

const entryDownloadUrls = computed(() => {
  if (!props.entry) return []
  const supportFormats = {
    epub: 'application/epub+zip',
    mobi: 'application/x-mobipocket-ebook',
    txt: 'text/plain'
  }
  const link = getLinksByRel(props.entry.link, [LinkRel.Acquisition, LinkRel.AcquisitionOpenAccess])
  return Object.entries(supportFormats)
    .filter((item) => link.some(i => i.type === item[1]))
    .map(([format, value]) => ({ format, url: link.find(i => i.type === value)!.href }))
})

const downloadEntry = async () => {
  if (btn.value.disabled || !props.entry) return;
  if (props.downloaded) {
    router.push({ name: 'read', params: { id: props.downloaded.id }, query: { noAnim: 1 } })
    emits('close')
    return;
  }
  downloading.value = true
  let url = entryDownloadUrls.value[0].url
  if (entryDownloadUrls.value.length > 1) {
    const options = entryDownloadUrls.value.map(i => ({ label: i.format + '格式', value: i.url }))
    url = await showPicker(options, { title: '选择下载格式' })
      .catch(err => {
        downloading.value = false
        throw err
      })
  }
  showToast('开始下载...')
  downloadProgress.value = 0
  const { id, title } = props.entry
  download(url, { id, title, cover: getEntryImage(props.entry, 'image') || '' }, progress => {
    downloadProgress.value = progress
  })
    .then((result) => {
      showToast('下载完成')
      downloading.value = false
      emits('downloaded', { id: result.id })
      emits('close')
    })
    .catch(err => {
      showToast('下载失败, ' + err.message)
      downloading.value = false
      throw err;
    })
}

</script>

<style lang="scss" scoped>
.entry-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 76dvh;
  .entry-header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .entry-title {
    font-size: 18px;
  }
  p {
    font-size: 16px;
  }
  .entry-cover {
    width: 120px;
    height: 160px;
    max-height: 300px;
    object-fit: cover;
  }
  .section-title {
    font-size: 16px;
  }
  .summary-content {
    font-size: 15px;
    opacity: 0.7;
  }
  .entry-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
</style>
