import { DarkMode } from "@/actions";
import { defaultPreferences, preferencesStorageKey } from "@/config";
import Logger from "js-logger";
import { ref, watch } from "vue";

const logger = Logger.get('preferences')

const getPreferences = () => {
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

export const preferences = ref<{
  screenKeepAlive: 'always' | 'reading' | 'never';
  darkMode: 'system' | 'light' | 'dark';
}>(getPreferences());

export const darkMode = new DarkMode({
  auto: preferences.value.darkMode === 'system',
  changeHandler: () => {}
})

if (preferences.value.darkMode === 'dark') {
  darkMode.enter()
}

watch(preferences, (newConfig) => {
  if (newConfig.darkMode === 'dark' && !darkMode.isActivated()) {
    darkMode.enter()
  } else if (newConfig.darkMode === 'light' && darkMode.isActivated()) {
    darkMode.exit()
  }
  darkMode.updateAuto(newConfig.darkMode === 'system')
  localStorage.setItem(preferencesStorageKey, JSON.stringify(newConfig));
}, { deep: true });
