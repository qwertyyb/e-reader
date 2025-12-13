<template>
  <route-page class="prfs-view" tag="section">
    <NavigationBar title="设置" :no-menu="true"/>

    <main class="prfs-main">
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
          <div class="prfs-label">深色模式</div>
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

        <li class="prfs-item" @click="appRouter.push({ name: 'advancedPrfs' })">
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
    </main>
  </route-page>
</template>

<script lang="ts" setup>
import RoutePage from '@/components/RoutePage.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import CSelect from '@/components/common/CSelect.vue';
import { preferences } from '@/stores/preferences';
import { showToast } from '@/utils';
import { version } from '@/version';
import { clearAllCache } from '@/utils/cache';
import { env } from '@/utils/env';
import { appRouter } from '@/router';

const clearCache = async () => {
  await clearAllCache();
  showToast('缓存已清除')
}

const feedback = () => {
  const feedbackUrl = 'https://github.com/qwertyyb/e-reader/issues'
  window.open(env.isIOS() ? `x-safari-${feedbackUrl}` : feedbackUrl, '_blank')
}

</script>

<style lang="scss" scoped>
@import "../assets/_variables.scss";

.prfs-view {
  height: var(--page-height);
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

@media (width > $MAX_SMALL_WIDTH) {
  .prfs-view {
    height: auto;
    margin: auto;
    width: 480px;
    border-radius: 6px;
    overflow: hidden;
  }
}

.prfs-main {
  width: calc(100% - 32px);
  margin: 16px;
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

.prfs-control {
  width: auto;
  margin-left: auto;
  font-size: 16px;
  display: flex;
  align-items: center;
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
  flex: 0 0 120px;
  font-size: 17px;
  font-weight: 500;
}
</style>
