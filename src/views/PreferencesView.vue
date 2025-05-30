<template>
  <slide-back class="prfs-view">
    <NavigationBar title="设置" :no-menu="true"/>

    <div class="prfs-item">
      <div class="prfs-label">保持屏幕激活</div>
      <c-select
        v-model="preferences.screenKeepAlive"
        class="prfs-control"
        :options="[
          { label: '始终', value: 'always' },
          { label: '自动阅读时', value: 'reading' },
          { label: '从不', value: 'never' }
        ]"
      >
      </c-select>
    </div>

    <div class="prfs-item">
      <div class="prfs-label">深色模式</div>
      <c-select
        v-model="preferences.darkMode"
        class="prfs-control"
        :options="[
          { label: '跟随系统', value: 'system' },
          { label: '浅色', value: 'light' },
          { label: '深色', value: 'dark' }
        ]"
      >
      </c-select>
    </div>

    <div class="prfs-item" @click="$router.push({ name: 'advancedPrfs' })">
      <div class="prfs-label">高级</div>
      <div class="prfs-control">
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </div>
    </div>

    <div class="prfs-item" @click="clearCache">
      <div class="prfs-label">清除缓存</div>
    </div>
    <div class="prfs-item" @click="$router.push('/about')">
      <div class="prfs-label">关于E Reader</div>
      <div class="prfs-control">
        {{ version }}
        <span class="material-symbols-outlined arrow-icon">chevron_right</span>
      </div>
    </div>

  </slide-back>
</template>

<script lang="ts" setup>
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import CSelect from '@/components/common/CSelect.vue';
import { preferences } from '@/stores/preferences';
import { bridge } from '@/register-sw';
import { showToast } from '@/utils';
import { version } from '@/version';

const clearCache = async () => {
  await bridge.invoke('deleteAllCache')
  showToast('缓存已清除')
}
</script>

<style lang="scss" scoped>
.prfs-view {
  max-width: 600px;
  height: var(--page-height);
}

.prfs-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e5ea;
}

.prfs-control {
  width: auto;
  margin-left: auto;
  font-size: 18px;
  display: flex;
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
