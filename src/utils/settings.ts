export const getSettings = (): ISettings => {
  const defaultSettings = {
    fontFamily: 'SYST',
    fontSize: 24,
    fontWeight: 500,
    autoPlayDuration: 24, // 24s
  }
  const settings = JSON.parse(localStorage.getItem('settings') || '{}')

  return {
    ...defaultSettings,
    ...settings,
  }
}

export const saveSettings = <K extends keyof ISettings>(name: K, value: ISettings[K]) => {
  localStorage.setItem('settings', JSON.stringify({
    ...getSettings(),
    [name]: value,
  }))
}

export const saveAllSettings = (settings: Partial<ISettings>) => {
  localStorage.setItem('settings', JSON.stringify({
    ...getSettings(),
    ...settings,
  }))
}
