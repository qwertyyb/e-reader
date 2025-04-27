import { ref } from "vue";

export const animData = ref({
  cover: '',
  title: '',
  trace: '',
})

export const setAnimData = (data: { cover: string, title: string, trace: string }) => {
  animData.value = data
  waits.waitOpen = Promise.withResolvers<void>()
  waits.waitClose = Promise.withResolvers<void>()
}

export const clearAnimData = () => {
  animData.value = { cover: '', title: '', trace: '' }
}


export const waits: {
  waitOpen: PromiseWithResolvers<void>,
  waitClose: PromiseWithResolvers<void>
} = {
  waitOpen: Promise.withResolvers<void>(),
  waitClose: Promise.withResolvers<void>()
}

export const setWait = (animWait: { waitOpen: Promise<void>, waitClose: Promise<void> }) => {
  animWait.waitOpen.then(waits.waitOpen.resolve)
  animWait.waitClose.then(waits.waitClose.resolve)
}





