<template>
  <c-dialog class="update-dialog" :title="`新的版本已发布`" :visible="visible" @close="visible=false">
    <markdown-viewer :markdown="newVersionInfo.changelog" class="markdown-changelog"></markdown-viewer>
    <div class="update-actions">
      <button class="btn" @click="visible=false">取消</button>
      <button class="btn primary-btn" @click="update">更新</button>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from "@/components/common/CDialog.vue";
import MarkdownViewer from "@/components/MarkdownViewer.vue";
import { bridge } from "@/register-sw";
import { showToast } from "@/utils";
import { onBeforeUnmount, ref } from "vue";
import { updateInterval } from '@/constant';
import { version } from '@/version';

const visible = ref(false)
const newVersionInfo = ref({
  version: '',
  changelog: ''
})

const checkUpdates = async ({ slient = false } = {}) => {
  if (!slient) showToast('正在检查更新')
  const r = await fetch(`https://qwertyyb.github.io/e-reader/releases.json?remote=true&_t=${Date.now()}`)
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
  const versions = curVersionIndex >= 0 ? releases.slice(0, curVersionIndex + 1) : releases.slice()
  const changelog = versions.map(item => `## v${item.version}\n${item.changelog.trim() || '暂无更新内容'}`).join('\n')
  newVersionInfo.value = {
    version: latest.version,
    changelog,
  }
  visible.value = true
}

const update = async () => {
  await bridge.invoke('deleteAllCache')
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
