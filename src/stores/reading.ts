import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useReadingStore = defineStore('reading', () => {
  const readingBookId = ref(-1)
  function setReadingBookId(id: number) {
    readingBookId.value = id
  }
  function clear() {
    readingBookId.value = -1
  }

  return { readingBookId, setReadingBookId, clear }
})
