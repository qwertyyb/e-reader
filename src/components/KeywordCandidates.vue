<template>
  <div class="keyword-candidates" v-if="candidates.length > 0 || editable">
    <div class="candidate-list-header">
      <h3 class="candidate-list-title">搜索历史</h3>
      <span class="material-symbols-outlined remove-icon" @click="editable = true" v-if="!editable">delete</span>
      <p class="editable-btns" v-else>
        <span class="remove-all-btn" @click="removeAll">全部删除</span>
        <span class="complete-btn" @click="editable = false">完成</span>
      </p>
    </div>
    <ul class="candidate-list">
      <li class="candidate-item"
        v-for="candidate in candidates"
        :key="candidate.id"
        @click="emits('selected', candidate)"
      >
      <span class="candidate-keyword">{{ candidate.keyword }}</span>
      <span class="material-symbols-outlined close-icon" v-if="editable" @click.stop="remove(candidate)">close</span>
    </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { keywordsStore } from '@/services/storage';
import { ref } from 'vue';

const candidates = ref<IKeyword[]>([])

const props = defineProps<{
  bookId: string | number,
}>()

const emits = defineEmits<{
  selected: [IKeyword]
}>()

const editable = ref(false)

const refreshCandidates = async () => {
  const list = await keywordsStore.getListByBookId(Number(props.bookId))
  candidates.value = list
}

const removeAll = async () => {
  await keywordsStore.removeAllByBookId(Number(props.bookId))
  candidates.value = []
}

const remove = async (candidate: IKeyword) => {
  await keywordsStore.remove(candidate.id)
  candidates.value = candidates.value.filter(item => item.id !== candidate.id)
}

refreshCandidates()

</script>

<style lang="scss" scoped>
.keyword-candidates {
  display: flex;
  flex-direction: column;
}
.candidate-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  width: 100%;
  .remove-icon {
    font-size: 20px;
    color: #555;
    margin-left: auto;
    cursor: pointer;
  }
  .editable-btns {
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: #555;
    .remove-all-btn {
      cursor: pointer;
      color: #f00;
    }
    .complete-btn {
      cursor: pointer;
      position: relative;
      padding-left: 8px;
      &::before {
        content: "";
        display: block;
        width: 1px;
        height: 12px;
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        border-left: 1px solid #ccc;
        padding-left: 8px;
      }
    }
  }
}
.candidate-list-title {
  font-size: 16px;
  font-weight: 600;
  color: #555;
}
.candidate-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  list-style: none;
  font-size: 13px;
}
.candidate-item {
  padding: 0 12px;
  border-radius: 9999px;
  background: light-dark(var(--light-card-bg-color), var(--dark-card-bg-color));
  font-weight: 500;
  color: #444;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 30px;
  .close-icon {
    font-size: 20px;
    color: #999;
    margin-left: 4px;
    height: 100%;
    line-height: 30px;
  }
}
</style>
