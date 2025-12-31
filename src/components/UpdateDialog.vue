<template>
  <c-dialog class="update-dialog"
    :title="`新的版本已发布`"
    :visible="visible"
    @close="visible=false"
    :position="isSmall ? 'bottom' : 'center'"
  >
    <markdown-viewer :markdown="newVersionInfo.changelog" class="markdown-changelog"></markdown-viewer>
    <div class="update-actions">
      <button class="btn" @click="visible=false">取消</button>
      <button class="btn primary-btn" @click="update">更新</button>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from "@/components/common/CDialog.vue";
import { disableCache, showToast } from "@/utils";
import { defineAsyncComponent, onBeforeUnmount, ref } from "vue";
import { updateInterval } from '@/constant';
import { version } from '@/version';
import { bridge } from "@/register-sw";
import { useWindowSize } from "@/hooks/windowSize";

const MarkdownViewer = defineAsyncComponent(() => import('@/components/MarkdownViewer.vue'))

const visible = ref(false)
const newVersionInfo = ref({
  version: '',
  changelog: ''
})

const { isSmall } = useWindowSize();

const checkUpdates = async ({ slient = false } = {}) => {
  if (!slient) showToast('正在检查更新')
  const r = await fetch(disableCache(`https://qwertyyb.github.io/e-reader/releases.json?_t=${Date.now()}`))
  if (!r.ok) {
    if (!slient) showToast('当前已是最新版本')
    return;
  }
  const json = await r.json()
  const releases = json.releases as { version: string, buildVersion: number, changelog: string }[] || []
  const latest = releases[0]
  console.log(latest, version)
  if (!latest || latest.version === version) {
    if (!slient) showToast('当前已是最新版本')
    return;
  }
  const curVersionIndex = releases.findIndex(item => item.version === version)
  const versions = curVersionIndex >= 0 ? releases.slice(0, curVersionIndex) : releases.slice()
  const changelog = versions.map(item => `## v${item.version}\n${item.changelog.trim() || '暂无更新内容'}`).join('\n')
  newVersionInfo.value = {
    version: latest.version,
    changelog,
  }
  visible.value = true
}

const update = async () => {
  showToast('开始更新...')
  await bridge.invoke('update').catch(err => {
    showToast('更新失败')
    throw err
  })
  showToast('更新成功，页面自动刷新中...')
  location.reload()
}

let interval: ReturnType<typeof setInterval>
if (import.meta.env.PROD) {
  checkUpdates({ slient: true })

  interval = setInterval(() => {
    checkUpdates({ slient: true })
    // 每三个小时更新一次
  }, updateInterval)
}

const checkUpdatesHandler = (event: CustomEvent<{ slient: boolean }>) => {
  checkUpdates({ slient: event.detail.slient })
}

document.addEventListener('app:checkupdates', checkUpdatesHandler)

onBeforeUnmount(() => {
  if (interval) {
    clearInterval(interval)
  }
  document.removeEventListener('app:checkupdates', checkUpdatesHandler)
})

</script>

<style lang="scss" scoped>
:global(.c-dialog.update-dialog) {
  z-index: 11;
}
.markdown-changelog {
  max-height: 60vh;
  overflow: auto;
  margin-bottom: 12px;
  margin-top: -12px;
}
.update-dialog .update-actions {
  display: flex;
  justify-content: space-between;
}
.update-dialog .update-actions button {
  font-size: 18px;
  flex: 1;
  padding: 6px 0;
}
</style>
