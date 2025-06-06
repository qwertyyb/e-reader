<template>
  <route-page class="opds-view">
    <NavigationBar :title="cur ? cur.feed.title : '加载中...'" noMenu></NavigationBar>
    <div class="opds-main" v-if="cur" @scroll="scrollHandler">
      <div class="search-input" v-if="searchDescUrl">
        <span class="material-symbols-outlined search-icon">search</span>
        <input type="text" v-model.trim="keyword" />
        <span class="material-symbols-outlined close-icon pointer"
          v-if="keyword"
          @click="keyword= ''"
        >close</span>
        <span class="search-btn" @click="search()">搜索</span>
      </div>
      <section class="feed-section" v-if="featureList.length">
        <h3 class="section-title">导航</h3>
        <ul class="feature-list">
          <li class="feature-item"
            v-for="feature in featureList"
            :key="feature.href"
            @click="$router.push({ name: 'opds', query: { url: feature.href } })"
          >
            <span class="material-symbols-outlined icon">{{ feature.icon }}</span>
            <span>{{ feature.title }}</span>
          </li>
        </ul>
      </section>

      <section class="feed-section" v-if="[FeedType.Navigation].includes(cur.type)">
        <h3 class="section-title">分类</h3>
        <ul class="entry-list">
          <li class="entry-item"
            v-for="entry in cur.feed.entry"
            :key="entry.id"
            @click="onEntryTap(entry)"
            :title="entry.title"
          >
            {{ entry.title }}
          </li>
        </ul>
      </section>


      <section class="feed-section" v-else-if="[FeedType.Acquisition].includes(cur.type)">
        <h3 class="section-title">内容</h3>
        <ul class="content-list">
          <li class="content-item"
            v-for="(entry, index) in cur.feed.entry"
            :key="entry.id"
            @click="entryIndex = index; entryVisible=true"
            :title="entry.title"
          >
            <img :src="getEntryImage(entry)" alt="" class="content-thumbnail">
            <div class="content-right">
              <h3 class="content-title">{{ entry.title }}</h3>
              <p class="content-desc content-authors">{{ (entry as IContentEntry).author?.map(item => item.name).join('、') }}</p>
              <p class="content-desc content-udpated-at">更新时间: {{ formatDate(entry.updated) }}</p>
              <p class="content-desc content-download-state" v-if="downloadState[entry.id]">
                <span class="material-symbols-outlined download-icon">check_circle</span>
                <span class="download-label">已下载</span>
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
    <o-p-d-s-entry-dialog :entry="entry"
      :visible="entryVisible"
      :downloaded="entry ? downloadState[entry.id] : false"
      @close="entryVisible=false"
      @downloaded="downloadSuccess"
    ></o-p-d-s-entry-dialog>
  </route-page>
</template>

<script setup lang="ts">
import NavigationBar from '../components/NavigationBar.vue';
import RoutePage from '@/components/RoutePage.vue';
import OPDSEntryDialog from '@/components/OPDSEntryDialog.vue';
import { FeedType, fetchFeed, getSearchUrl, getUrlByRel, getUrlByType, LinkRel, getEntryImage, formatDate, type IContentEntry, type IEntry, type IFeed, getLinksByRel } from '@/services/opds';
import { preferences } from '@/stores/preferences';
import { showToast } from '@/utils';
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { booksStore } from '@/services/storage';

const route = useRoute()
const router = useRouter()

const featureTypes = [
  LinkRel.Shelf,
  LinkRel.Featured,
  LinkRel.Recommended,
  LinkRel.Featured,
  LinkRel.New,
  LinkRel.Popular
]
const icons = {
  [LinkRel.Shelf]: 'newsstand',
  [LinkRel.Featured]: 'modeling',
  [LinkRel.Recommended]: 'star',
  [LinkRel.New]: 'notifications_unread',
  [LinkRel.Popular]: 'star'
}
const cur = ref<{ feed: IFeed, url: string, type: string }>()
const featureList = computed(() => {
  const links = getLinksByRel(cur.value?.feed.link || [], featureTypes)
  return links.map(link => {
    return {
      ...link,
      icon: icons[link.rel],
    }
  })
})

const entryIndex = ref(-1)
const entry = computed(() => (cur.value?.feed.entry[entryIndex.value] || null) as IContentEntry | null)
const entryVisible = ref(false)
const downloadState = ref<Record<string, { id: number }>>({})

const refreshDownloadState = async (entryList: IContentEntry[]) => {
  entryList.forEach(async entry => {
    downloadState.value[entry.id] = await booksStore.getByOnlineId(entry.id)
  })
}

const downloadSuccess = (event: { id: number }) => {
  if (!entry.value) return;
  downloadState.value[entry.value.id] = event
}

const fetchFeedWithError = async (url: string) => {
  try {
    cur.value = await fetchFeed(url)
    refreshDownloadState(cur.value.feed.entry)
  } catch (error) {
    showToast((error as Error).message)
    throw error
  }
}

const init = async () => {
  if (!route.query.url && !preferences.value.opdsServerUrl) {
    showToast('请先设置OPDS服务器地址')
    return
  }
  fetchFeedWithError(route.query.url as string | undefined ? route.query.url as string : preferences.value.opdsServerUrl)
}

init()

const loading = ref(false)
let completed = false
const scrollHandler = async (e: Event) => {
  if (loading.value || completed) return;
  const target = e.currentTarget as HTMLElement
  const { scrollTop, clientHeight, scrollHeight } = target
  const distance = scrollHeight - scrollTop - clientHeight
  if (distance > 100) return;
  loading.value = true
  const nextUrl = getUrlByRel(cur.value?.feed.link || [], LinkRel.Next)
  if (!nextUrl) {
    completed = true
    return
  }
  const nextFeed = await fetchFeed(nextUrl)
  cur.value = {
    ...cur.value,
    ...nextFeed,
    feed: {
      ...cur.value?.feed,
      ...nextFeed.feed,
      entry: [...cur.value?.feed.entry || [], ...nextFeed.feed.entry]
    }
  }
  refreshDownloadState(nextFeed.feed.entry)
  await nextTick()
  loading.value = false
}


const onEntryTap = async (entry: IEntry) => {
  const url = getUrlByType(entry.link, [FeedType.Acquisition, FeedType.Navigation])
  router.push({ name: 'opds', query: { url } })
}

const keyword = ref('')
const searchDescUrl = computed(() => getUrlByRel(cur.value?.feed.link || [], LinkRel.Search))
const search = async () => {
  if (!keyword.value || !searchDescUrl.value) return;
  const searchUrl = await getSearchUrl(searchDescUrl.value, { keyword: keyword.value })
    .catch(err => {
      showToast('搜索失败,' + err.message)
      throw err
    })
  router.push({
    name: 'opds',
    query: { url: searchUrl }
  })
}


</script>

<style lang="scss" scoped>
.opds-view {
  height: var(--page-height);
  display: flex;
  flex-direction: column;
  .opds-main {
    flex: 1;
    height: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    width: 100vw;
    flex-shrink: 0;
    overflow: auto;
    padding: 16px;
    & > * {
      width: 100%;
    }
  }
}
.feed-section {
  .section-title {
    font-size: 14px;
    margin-bottom: 8px;
  }
}
.entry-list, .feature-list {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  gap: 12px;
  width: 100%;
}
.entry-item, .feature-item {
  background-color: var(--card-bg-color);
  border-radius: 6px;
  padding: 8px 16px;
}
.entry-item {
  max-width: calc(50% - 6px);
  min-width: calc(50% - 6px);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feature-item {
  display: flex;
  align-items: center;
  flex: 1;
  color: var(--theme-color);
  span {
    color: inherit;
  }
  .icon {
    font-size: 20px;
    margin-right: 6px;
  }
}
.content-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.content-item {
  width: 100%;
  display: flex;
  align-items: center;
  background-color: var(--card-bg-color);
  border-radius: 6px;
  padding: 16px;
  .content-thumbnail {
    width: 90px;
    height: 120px;
    object-fit: cover;
    // height: auto;
    margin-right: 12px;
  }
  .content-right {
    flex: 1;
  }
  .content-title {
    font-size: 14px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .content-desc {
    font-size: 14px;
    opacity: 0.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 8px;
  }
  .content-udpated-at, .content-download-state {
    font-size: 12px;
  }
  .content-download-state {
    display: flex;
    align-items: center;
  }
  .download-icon {
    font-size: 18px;
    font-variation-settings: "FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24;
    margin-right: 4px;
    color: var(--theme-color);
  }
}


.search-input {
  display: flex;
  align-items: center;
  position: relative;
  background: light-dark(#d8d8d8, #333);
  border-radius: 9999px;
  padding: 4px 8px;
  height: 30px;
  margin: 0 auto;
  width: calc(100% - 32px);
}
.search-icon {
  font-size: 20px;
  color: gray;

}
.search-input input {
  outline: none;
  border: none;
  background: none;
  padding: 4px 32px 4px 4px;
  font-size: 14px;
  flex: 1;
}
.search-btn {
  font-size: 14px;
  padding-left: 12px;
  padding-right: 8px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  white-space: nowrap;
  &::before {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    content: '';
    display: block;
    width: 1px;
    height: 14px;
    background: light-dark(#bbb, #777);
  }
}
.close-icon {
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  background: light-dark(#acacac, #888);
  padding: 2px;
  color: light-dark(#fff, #444);
  margin-right: 8px;
}

</style>
