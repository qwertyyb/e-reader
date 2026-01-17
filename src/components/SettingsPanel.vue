<template>
  <ul class="tab-panel-list">
    <li class="tab-panel-item" v-if="tabName === 'basic'">
      <ul class="prfs-group">
        <li class="prfs-item">
          <div class="prfs-label">保持屏幕激活</div>
          <c-select
            title="保持屏幕激活"
            v-model="preferences.screenKeepAlive"
            class="prfs-control"
            :options="[
              { label: '始终', value: 'always' },
              { label: '阅读时', value: 'reading' },
              { label: '自动阅读时', value: 'autoPlay' },
              { label: '从不', value: 'never' }
            ]"
          >
          </c-select>
        </li>

        <li class="prfs-item">
          <div class="prfs-label">外观</div>
          <c-select
            title="深色模式"
            v-model="preferences.darkMode"
            class="prfs-control"
            :options="[
              { label: '跟随系统', value: 'system' },
              { label: '浅色', value: 'light' },
              { label: '深色', value: 'dark' }
            ]"
          >
          </c-select>
        </li>
        <li class="prfs-item">
          <div class="prfs-label">自动打开上次阅读</div>
          <div class="prfs-control">
            <c-switch v-model="preferences.autoOpenLastRead" />
          </div>
        </li>
        <li class="prfs-item">
          <div class="prfs-label">TTS 服务</div>
          <c-select
            title="选择 TTS 服务"
            v-model="preferences.tts"
            class="prfs-control"
            style="width:auto"
            :options="[
              { label: 'Edge TTS 服务', value: 'edge-tts', subtitle: '使用Microsoft Edge在线文字转语音服务(效果好，需联网)' },
              { label: '本机 TTS 服务', value: 'local', subtitle: '使用设备本身的文字转语音能力(效果差，无需联网)' },
            ]"
          >
          </c-select>
        </li>

        <li class="prfs-item" v-if="isSmall" @click="appRouter.push({ name: 'preferences', params: { name: 'services' } })">
          <div class="prfs-label">高级</div>
          <div class="prfs-control">
            <span class="material-symbols-outlined arrow-icon">chevron_right</span>
          </div>
        </li>
      </ul>

      <ul class="prfs-group">
        <li class="prfs-item" @click="clearCache">
          <div class="prfs-label">清除缓存</div>
        </li>
        <li class="prfs-item" @click="feedback">
          <div class="prfs-label">问题反馈</div>
          <div class="prfs-control">
            <span class="material-symbols-outlined arrow-icon">chevron_right</span>
          </div>
        </li>
        <li class="prfs-item" @click="$router.push('/about')">
          <div class="prfs-label">关于E Reader</div>
          <div class="prfs-control">
            {{ version }}
            <span class="material-symbols-outlined arrow-icon">chevron_right</span>
          </div>
        </li>
      </ul>
    </li>

    <li class="tab-panel-item" v-else-if="tabName === 'services'">
      <ul class="prfs-group">
        <li class="prfs-item">
          <div class="prfs-label">书架服务URL</div>
          <div class="prfs-control">
            <input type="text" class="text-input" v-model="preferences.shelfServerUrl">
          </div>
        </li>

        <li class="prfs-item">
          <div class="prfs-label">OPDS URL</div>
          <div class="prfs-control">
            <input type="text" class="text-input" v-model="preferences.opdsServerUrl">
          </div>
        </li>
      </ul>


      <div class="prfs-group-title">AI 服务</div>
      <ul class="prfs-group">
        <li class="prfs-item">
          <div class="prfs-label">baseURL</div>
          <div class="prfs-control">
            <input type="text" class="text-input" v-model="preferences.ai.baseURL">
          </div>
        </li>

        <li class="prfs-item">
          <div class="prfs-label">ApiKey</div>
          <div class="prfs-control">
            <input type="text" class="text-input" v-model="preferences.ai.apiKey">
          </div>
        </li>

        <li class="prfs-item">
          <div class="prfs-label">Model</div>
          <div class="prfs-control">
            <input type="text" class="text-input" v-model="preferences.ai.model">
          </div>
        </li>
      </ul>

      <ul class="prfs-group">
        <li class="prfs-item" @click="openSyncDialog">
          <div class="prfs-label">进度同步</div>
          <div class="prfs-control">
            <span class="material-symbols-outlined arrow-icon">chevron_right</span>
          </div>
        </li>
      </ul>
    </li>

    <li class="tab-panel-item" v-else-if="tabName === 'debug'">
      <ul class="prfs-group">
        <li class="prfs-item">
          <div class="prfs-label">显示控制台</div>
          <div class="prfs-control">
            <c-switch v-model="debugOptions.showConsole"></c-switch>
          </div>
        </li>

        <li class="prfs-item">
          <div class="prfs-label">无动画模式</div>
          <div class="prfs-control">
            <c-select v-model="debugOptions.noAnimation"
              :options="modeOptions"
              title="无动画模式"
            ></c-select>
          </div>
        </li>

        <li class="prfs-item">
          <div class="prfs-label">高对比模式</div>
          <div class="prfs-control">
            <c-select v-model="debugOptions.highContrast"
              :options="modeOptions"
              title="高对比模式"
            ></c-select>
          </div>
        </li>
      </ul>

      <ul class="prfs-group">
        <li class="prfs-item" @click="$router.push({ name: 'import' })">
          <div class="prfs-label">导入测试</div>
          <div class="prfs-control">
            <span class="material-symbols-outlined arrow-icon">chevron_right</span>
          </div>
        </li>

        <li class="prfs-item" @click="$router.push({ name: 'storage' })">
          <div class="prfs-label">储存空间</div>
          <div class="prfs-control">
            <span class="material-symbols-outlined arrow-icon">chevron_right</span>
          </div>
        </li>
      </ul>

      <ul class="prfs-group">
        <li class="prfs-item" @click="resetToDefault">
          <div class="prfs-label">恢复默认</div>
        </li>
      </ul>
    </li>

    <li class="tab-panel-item about" v-else-if="tabName === 'about'">
      <img class="logo" src="/icons/icon256.png" />
      <h3 class="name">E Reader</h3>
      <p class="version">v{{ version }}({{ buildVersion }})</p>
      <button class="check-update-btn btn primary-btn" @click="checkUpdates">检查版本更新</button>
    </li>

    <CDialog :visible="syncInfo.visible"
      height="95vh"
      title="进度同步设置"
      @close="syncInfo.visible = false"
    >
      <div class="status-info" :class="{connected: syncInfo.connected}">
        <p>当前状态：未连接</p>
      </div>
      <div class="form">
        <div class="form-item">
          <div class="form-value">设备: {{ preferences.sync.device }}({{ preferences.sync.deviceId }})</div>
        </div>
        <div class="form-item">
          <label for="sync-enabled">启用同步</label>
          <c-switch v-model="preferences.sync.enabled" @change="syncChangeHandler"></c-switch>
        </div>
        <div class="form-item">
          <label for="sync-server-input">服务器</label>
          <input type="text" class="form-input" id="sync-server-input" :disabled="!preferences.sync.enabled" v-model="preferences.sync.server">
        </div>
        <div class="form-item">
          <label for="sync-username-input">用户名</label>
          <input type="text" id="sync-username-input" class="form-input" :disabled="!preferences.sync.enabled" v-model="preferences.sync.username">
        </div>
        <div class="form-item">
          <label for="sync-password-input">密码</label>
          <input type="password" id="sync-password-input" class="form-input" :disabled="!preferences.sync.enabled" v-model="preferences.sync.password">
        </div>
        <div class="form-actions">
          <button class="btn primary-btn" @click="registerOrLogin" :disabled="!preferences.sync.enabled">注册或登录</button>
          <button class="btn" @click="resetSync">恢复默认</button>
        </div>
      </div>
    </CDialog>
  </ul>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CSelect from './common/CSelect.vue';
import CSwitch from './common/CSwitch.vue';
import CDialog from './common/CDialog.vue';
import { preferences } from '@/stores/preferences';
import { version, buildVersion } from '@/version';
import { debugOptions, resetToDefault, modeOptions } from '@/stores/debug';
import { clearAllCache } from '@/utils/cache';
import { showToast } from '@/utils';
import { env, isSmall } from '@/utils/env';
import { appRouter } from '@/router';
import { getDefaultPreferences } from '@/config';
import Logger from 'js-logger';
import { authUser, createUser } from '@/services/sync';

const logger = Logger.get('SettingsPanel');

const tabName = defineModel<string>('name', { default: 'basic' })

const checkUpdates = async () => {
  document.dispatchEvent(new CustomEvent('app:checkupdates', { detail: { slient: false } }))
}

const clearCache = async () => {
  await clearAllCache();
  showToast('缓存已清除')
}

const feedback = () => {
  const feedbackUrl = 'https://github.com/qwertyyb/e-reader/issues'
  window.open(env.isIOS() ? `x-safari-${feedbackUrl}` : feedbackUrl, '_blank')
}

const syncInfo = ref({ device: '', deviceId: '', connected: false, visible: false })

const openSyncDialog = async () => {
  const { enabled, server, username, password } = preferences.value.sync;
  syncInfo.value = {
    ...syncInfo.value,
    visible: true,
    connected: false
  }
  syncInfo.value.connected = Boolean(enabled && server && username && password && await authUser({ server, username, password }).then(res => res.success))
}

const registerOrLogin = async () => {
  const { server, username, password } = preferences.value.sync
  if (!server || !username || !password) {
    showToast('请输入完整信息')
    return;
  }

  try {
    const res = await createUser({ server, username, password })
    logger.info('createUser Response', res)
  } catch (err) {
    logger.error('创建同步用户失败', err)
    showToast('创建同步用户失败,' + ((err as Error)?.message ?? err))
    throw err;
  }

  syncInfo.value.connected = await authUser({ server, username, password }).then(res => {
    showToast('登录成功')
    return res.success
  }).catch(err => {
    showToast('连接服务器失败,' + err)
    return false;
  })
}

const resetSync = () => {
  const defaultPrfs = getDefaultPreferences()
  preferences.value.sync = { ...defaultPrfs.sync }
  syncInfo.value = { ...syncInfo.value, ...defaultPrfs.sync, visible: false, connected: false }
}

const syncChangeHandler = (value: boolean) => {
  if (!value) {
    syncInfo.value.connected = false
    return
  }
  const { server, username, password } = preferences.value.sync
  if (!server || !username || !password) {
    return;
  }
  registerOrLogin()
}


</script>

<style lang="scss" scoped>
.tab-panel-item {
  &.about {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    .logo {
      width: 128px;
      height: 128px;
      margin: 16px auto;
    }
    .version {
      margin: 16px 0;
    }
    .check-update-btn {
      margin-bottom: 16px;
    }
  }
}

.prfs-group {
  background: var(--card-bg-color);
  border-radius: 6px;
  & + .prfs-group {
    margin-top: 8px;
  }
}
.prfs-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 16px;
  padding: 16px 0;
  & + .prfs-item {
    border-top: 1px solid var(--card-border-color);
  }
}
.prfs-group-title {
  margin-top: 16px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  opacity: 0.6;
}
.prfs-control {
  margin-left: auto;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  &:deep(.c-select-label) {
    font-size: 16px;
  }
  p {
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 16px;
  }
  .arrow-icon {
    font-size: 24px;
  }
}

.prfs-label {
  flex: 0 0 140px;
  font-size: 17px;
  font-weight: 500;
}

.text-input {
  font-size: 16px;
  border: none;
  outline: none;
  text-align: right;
  // field-sizing: content;
  padding: 4px 0 4px 6px;
  background: transparent;
}

.status-info {
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.6;
  position: relative;
  padding-left: 12px;
  --color: red;
  color: var(--color);
  * {
    color: var(--color);
  }
  &::before {
    content: " ";
    display: block;
    width: 6px;
    height: 6px;
    background: var(--color);
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 999px;
  }
  &.connected {
    --color: green;
  }
}

.form-item {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  margin-top: 16px;
  label {
    opacity: 0.8;
  }
  .form-input {
    margin-top: 6px;
    font-size: 16px;
    padding: 6px 8px;
    outline: none;
    border: none;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--card-bg-color);
    &[disabled] {
      opacity: 0.6;
    }
  }
}
.form-actions {
  margin-top: 16px;
}

</style>
