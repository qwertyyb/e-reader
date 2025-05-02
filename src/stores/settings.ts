import { getSettings, saveAllSettings } from "@/utils/settings"
import { ref, watch } from "vue"

export const settings = ref(getSettings())

watch(settings, value => saveAllSettings(value), { deep: true })
