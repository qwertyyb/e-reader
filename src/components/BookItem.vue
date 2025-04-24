<template>
  <div class="book-item"
    :class="{
      'is-reading': book.status === 'reading',
      'downloaded': book.status === 'downloaded' || book.status === 'reading'
    }"
    :data-book-id="book.id">
    <div class="book-cover" @click="onTap">
      <img class="book-cover-img" :src="book.cover" :alt="book.title" />
    </div>
    <div class="book-title">
      <span class="material-symbols-outlined remote-icon" v-if="book.status !== 'downloaded'">cloud</span>
      <div class="download-progress-percent" v-else-if="book.downloading">
        ({{ book.downloading.progress }})
      </div>
      <span class="title">{{ book.title }}</span>
    </div>
    <div class="action-mask"
      v-if="mode==='select' && book.status === 'downloaded'">
      <span class="material-symbols-outlined remove-icon" @click="$emit('remove')">delete</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  book: IBookListItem,
  mode: 'show' | 'select',
}>()
const emits = defineEmits<{
  read: [],
  remove: [],
  download: []
}>()

const onTap = () => {
  if (props.book.status === 'downloaded') {
    emits('read' )
  } else if (props.book.status === 'remote') {
    emits('download')
  }
}

</script>

<style lang="scss" scoped>
.book-item {
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
.book-item .book-title .download-progress-percent {
  font-size: 12px;
  color: gray;
  margin-right: 6px;
}
.book-item .book-title .title {
  width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.book-item .action-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .6);
}
.book-item .action-mask .remove-icon {
  color: #fff;
  font-size: 36px;
}
.book-item .action-label {
  color: #fff;
}
.book-item .action-label {
  white-space: pre-wrap;
  font-size: 10px;
  margin-top: 6px;
}

.book-cover {
  width: 100px;
  box-sizing: border-box;
  text-align: center;
  background: #fff;
  position: relative;
}
.book-cover img.book-cover-img {
  width: 100px;
  height: 133.33px;
  vertical-align: top;
}
</style>
