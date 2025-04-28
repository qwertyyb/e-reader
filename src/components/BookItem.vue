<template>
  <div class="book-item"
    :class="{
      'is-reading': book.reading,
      'downloaded': book.downloaded,
    }"
    :data-book-id="book.id"
    :data-book-trace="book.trace">
    <div class="book-cover" @click="onTap">
      <img class="book-cover-img" :src="book.cover" :alt="book.title" />
      <div class="download-progress-percent" v-if="book.downloading && book.downloadProgress">
        ({{ book.downloadProgress.percent }}%)
      </div>
    </div>
    <div class="book-title" v-if="!noTitle">
      <span class="material-symbols-outlined remote-icon" v-if="!book.downloaded">cloud</span>
      <span class="title">{{ book.title }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  book: IBookItem,
  noTitle?: boolean,
}>()
const emits = defineEmits<{
  download: [],
  onTap: [],
}>()

const onTap = () => {
  emits('onTap')
}

</script>

<style lang="scss" scoped>
.book-item {
  width: 100px;
  position: relative;
  opacity: 0.4;
  &.is-reading .book-cover {
    opacity: 0;
  }
}
.book-item.downloaded {
  filter: none;
  opacity: 1;
}
.book-item img {
  box-shadow: var(--mdc-protected-button-container-elevation, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12));
}
.book-item .book-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  height: 28px;
}
.book-item .book-title .remote-icon {
  font-size: 18px;
  margin-right: 6px;
}
.book-item .book-cover .download-progress-percent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
}
.book-item .book-title .title {
  width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-cover {
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  background: #fff;
  position: relative;
}
.book-cover img.book-cover-img {
  width: 100%;
  aspect-ratio: 3 / 4;
  vertical-align: top;
}
</style>
