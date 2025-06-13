import { DarkMode } from "@/actions";
import { defaultPreferences, preferencesStorageKey } from "@/config";
import * as wakeLock from "@/utils/wake-lock";
import Logger from "js-logger";
import { ref, watch } from "vue";

const logger = Logger.get('preferences')

const getPreferences = (): IPreferences => {
  try {
    return {
      ...defaultPreferences,
      ...JSON.parse(localStorage.getItem(preferencesStorageKey) || '{}')
    }
  } catch(err) {
    logger.error(err)
  }
  return { ...defaultPreferences }
}

export const preferences = ref<IPreferences>(getPreferences());

export const darkMode = new DarkMode({
  auto: preferences.value.darkMode === 'system',
  changeHandler: () => {}
})

if (preferences.value.darkMode === 'dark') {
  darkMode.enter()
}

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
    wakeLock.release()
  } else {
    wakeLock.release()
  }
}

watch(preferences, (newConfig) => {
  darkModeHandler(newConfig.darkMode)
  screenKeepAliveHandler(newConfig.screenKeepAlive)
  localStorage.setItem(preferencesStorageKey, JSON.stringify(newConfig));
}, { deep: true });
