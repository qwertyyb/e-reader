import { DarkMode } from "@/actions";
import { getDefaultPreferences } from "@/config";
import { PREFERENCES_STORAGE_KEY } from "@/constant";
import * as wakeLock from "@/utils/wake-lock";
import { clone, merge } from "es-toolkit";
import Logger from "js-logger";
import { ref, watch } from "vue";

const logger = Logger.get('preferences')

const getPreferences = (): IPreferences => {
  const defaultPrfs = getDefaultPreferences()
  try {
    const result = merge(
      clone({ ...defaultPrfs }),
      { ...JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')}
    )
    logger.info('preferences', result)
    return result;
  } catch(err) {
    logger.error(err)
  }
  return { ...defaultPrfs }
}

export const preferences = ref<IPreferences>(getPreferences());

export const darkMode = new DarkMode({
  auto: preferences.value.darkMode === 'system',
  changeHandler: () => {}
})

const darkModeHandler = (darkModeConfig: IPreferences["darkMode"]) => {
  if (darkModeConfig === 'dark' && !darkMode.isActivated()) {
    darkMode.enter()
  } else if (darkModeConfig === 'light' && darkMode.isActivated()) {
    darkMode.exit()
  }
  darkMode.updateAuto(darkModeConfig === 'system')
}

const screenKeepAliveHandler = (setting: IPreferences['screenKeepAlive']) => {
  if (setting === 'always') {
    wakeLock.request()
  } else {
    wakeLock.release()
  }
}

if (preferences.value.darkMode === 'dark') {
  darkMode.enter()
}

if (preferences.value.screenKeepAlive === 'always') {
  wakeLock.request()
}

watch(preferences, (newConfig) => {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newConfig));
}, { deep: true });

watch(() => preferences.value.darkMode, (val) => {
  darkModeHandler(val)
})
watch(() => preferences.value.screenKeepAlive, val => {
  screenKeepAliveHandler(val)
})
