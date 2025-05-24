<template>
  <div class="opds-view">
    <NavigationBar :title="cur ? cur.feed.title : 'OPDS'" noMenu>
      <template #back>
        <div class="material-symbols-outlined back-icon"
          @click="stack.length > 1 ? slide?.pop() : $router.back()"
        >arrow_back_ios</div>
      </template>
    </NavigationBar>
    <div class="opds-main">
      <c-slide :list="stack" @pop="stack.pop()" ref="slide">
        <template #item="{ item }">
          <div class="opds-content">
            <ul class="entry-list"
              v-if="[FeedType.Navigation].includes(item.type)"
            >
              <li class="entry-item"
                v-for="entry in item.feed.entry"
                :key="entry.id"
                @click="onEntryTap(entry, item.url)"
                :title="entry.title"
              >
                {{ entry.title }}
              </li>
            </ul>
            <ul class="content-list" v-else-if="[FeedType.Acquisition].includes(item.type)">
              <li class="content-item"
                v-for="entry in item.feed.entry"
                :key="entry.id"
                @click="onEntryTap(entry, item.url)"
                :title="entry.title"
              >
                <img :src="getEntryThumbnail(entry, item.url)" alt="" class="content-thumbnail">
                <div class="content-right">
                  <h3 class="content-title">{{ entry.title }}</h3>
                  <p class="content-desc content-authors">{{ (entry as IContentEntry).author?.map(item => item.name).join('、') }}</p>
                  <p class="content-desc content-udpated-at">更新时间: {{ formatDate(entry.updated) }}</p>
                </div>
              </li>
            </ul>
          </div>
        </template>
      </c-slide>
    </div>
  </div>
</template>

<script setup lang="ts">
import NavigationBar from '../components/NavigationBar.vue';
import CSlide from '@/components/common/CSlide.vue';
import { FeedType, OPDSClient, type IContentEntry, type IEntry, type IFeed } from '@/services/opds';
import { computed, ref, useTemplateRef } from 'vue';

const isPushing = ref(false);

const opds = new OPDSClient('https://feedbooks.github.io/opds-test-catalog/catalog/root.xml');

const stack = ref<{ feed: IFeed, url: string, type: string }[]>([])

const slide = useTemplateRef('slide')

const cur = computed(() => stack.value[stack.value.length - 1])

const init = async () => {
  stack.value = []
  stack.value.push(await opds.getRootFeed())
}

init()

const getEntryThumbnail = (entry: IEntry, url: string) => {
  const links = Array.isArray(entry.link) ? entry.link : [entry.link]
  const thumbnail = links.find(link => link.rel === 'http://opds-spec.org/image/thumbnail')
  return thumbnail?.href ? opds.resolveLHref(thumbnail.href, url) : ''
}


const onEntryTap = async (entry: IEntry, url: string) => {
  isPushing.value = true;
  const feed = await opds.getEntryFeed(entry, url)
  stack.value.push(feed)
  console.log(feed.feed.entry.filter(i => !('author' in i)))
}

const formatDate = (date: string) => {
  const dateObj = new Date(date)
  return `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`
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
  }
}
.opds-content {
  width: 100vw;
  flex-shrink: 0;
}
.entry-list {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  gap: 12px;
  padding: 16px;
}
.entry-item {
  background-color: var(--card-bg-color);
  border-radius: 6px;
  padding: 8px 16px;
  max-width: calc(50% - 6px);
  min-width: calc(50% - 6px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.content-list {
  list-style: none;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  .content-udpated-at {
    font-size: 12px;
  }
}
</style>
