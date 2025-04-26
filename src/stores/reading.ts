import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useReadingStore = defineStore('reading', () => {
  const readingBookId = ref('')
  function setReadingBookId(id: string) {
    readingBookId.value = id
  }
  function clear() {
    readingBookId.value = ''
  }

  return { readingBookId, setReadingBookId, clear }
})
