<template>
  <slide-back class="prfs-view">
    <NavigationBar title="设置" :no-menu="true"/>

    <div class="prfs-item">
      <div class="prfs-label">保持屏幕激活</div>
      <c-select v-model="preferences.screenKeepAlive" class="prfs-control">
        <template #label>
          {{ {'always': '始终', 'reading': '自动阅读时', 'never': '从不'}[preferences.screenKeepAlive] }}
        </template>
        <c-option value="always">始终</c-option>
        <c-option value="reading">自动阅读时</c-option>
        <c-option value="never">从不</c-option>
      </c-select>
    </div>

    <div class="prfs-item">
      <div class="prfs-label">深色模式</div>
      <c-select v-model="preferences.darkMode" class="prfs-control">
        <template #label>
          {{ {'system': '跟随系统', 'light': '浅色', 'dark': '深色'}[preferences.darkMode] }}
        </template>
        <c-option value="system">跟随系统</c-option>
        <c-option value="light">浅色</c-option>
        <c-option value="dark">深色</c-option>
      </c-select>
    </div>


    <div class="prfs-item">
      <div class="prfs-label">调试模式</div>
      <div class="prfs-control">
        <c-switch v-model="preferences.debugMode"></c-switch>
      </div>
    </div>

    <div class="prfs-item" @click="clearCache">
      <div class="prfs-label">清除缓存</div>
    </div>
    <div class="prfs-item" @click="$router.push('/about')">
      <div class="prfs-label">关于E Reader</div>
      <div class="prfs-control">{{ version }}</div>
    </div>

  </slide-back>
</template>

<script lang="ts" setup>
import SlideBack from '@/components/SlideBack.vue';
import NavigationBar from '@/components/NavigationBar.vue';
import CSelect from '@/components/common/CSelect.vue';
import COption from '@/components/common/COption.vue';
import CSwitch from '@/components/common/CSwitch.vue';
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
}

.prfs-label {
  flex: 0 0 120px;
  font-size: 17px;
  font-weight: 500;
}

select {
  height: 32px;
  outline: none;
  border: none;
  width: fit-content;
  background: none;
}

input[type="checkbox"] {
  width: 24px;
  height: 24px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: 1px solid #c6c6c8;
  border-radius: 6px;
  background-color: #fff;
  position: relative;
}

input[type="checkbox"]:checked {
  background-color: #007aff;
  border-color: #007aff;
}

input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 8px;
  top: 4px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
</style>
