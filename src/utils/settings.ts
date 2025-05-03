export const getSettings = (): ISettings => {
  const defaultSettings: ISettings = {
    fontFamily: 'SYST',
    fontSize: 24,
    fontWeight: 500,
    speed: 30, // 每秒滚动的像素
    lineHeight: 1.6,
    readSpeakRate: 1
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
