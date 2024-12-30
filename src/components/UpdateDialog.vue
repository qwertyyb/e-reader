<template>
  <c-dialog class="update-dialog" :visible="visible" @close="visible=false">
    <div class="update-title">
      已检测到新的版本
    </div>
    <div class="version-info">
      最新版本: {{ newVersionInfo.version }} <br>
      当前版本: {{ version }}
    </div>
    <div class="changelog" v-if="false">
      更新内容: xxxx
    </div>
    <div class="update-actions">
      <button class="cancel-btn" @click="visible=false">取消</button>
      <button class="confirm-btn" @click="update">更新</button>
    </div>
  </c-dialog>
</template>

<script setup lang="ts">
import CDialog from "@/components/common/CDialog.vue";
import { bridge } from "@/register-sw";
import { showToast } from "@/utils";
import { onBeforeUnmount, ref } from "vue";
import { updateInterval } from '@/constant';

const visible = ref(false)
const version = ref('')
const newVersionInfo = ref({
  version: '',
  changelog: ''
})

const checkUpdates = async ({ slient = false } = {}) => {
  if (!slient) showToast('正在检查更新')
  const res = await bridge.invoke<{ version: string, changelog: string, hasUpdates: boolean }>('checkUpdates')
  if (res?.hasUpdates) {
    newVersionInfo.value = {
      version: res.version,
      changelog: res.changelog
    }
    visible.value = true
  } else {
    if (!slient) showToast('当前已是最新版本')
  }
}

const update = async () => {
  await bridge.invoke('deleteAllCache')
  location.reload()
}

const getVersion = async () => {
  const r = await fetch('./version.json')
  const json = await r.json()
  version.value = json.version
}

getVersion()

checkUpdates({ slient: true })

const interval = setInterval(() => {
  checkUpdates({ slient: true })
  // 每三个小时更新一次
}, updateInterval)

const checkUpdatesHandler = (event: CustomEvent<{ slient: boolean }>) => {
  checkUpdates({ slient: event.detail.slient })
}

document.addEventListener('app:checkupdates', checkUpdatesHandler)

onBeforeUnmount(() => {
  clearInterval(interval)
  document.removeEventListener('app:checkupdates', checkUpdatesHandler)
})

</script>

<style lang="scss" scoped>
.update-dialog .c-dialog-content {
  width: 100vw;
  box-sizing: border-box;
  padding: 20px 20px max(20px, env(safe-area-inset-bottom)) 20px;
}
.update-dialog .update-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
}
.update-dialog .version-info {
  font-size: 16px;
  margin-bottom: 12px;
}
.update-dialog .update-actions {
  display: flex;
  justify-content: space-between;
}
.update-dialog .update-actions button {
  border: none;
  font-size: 18px;
  flex: 1;
  padding: 6px 0;
}
.update-dialog .update-actions .confirm-btn {
  margin-left: 20px;
}
</style>
