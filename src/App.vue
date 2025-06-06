<script setup lang="ts">
import UpdateDialog from '@/components/UpdateDialog.vue'
import CRouterView from '@/components/common/CRouterView.vue'
</script>

<template>
  <div class="root-app">
    <c-router-view></c-router-view>

    <update-dialog></update-dialog>
  </div>
</template>

<style lang="scss">
.root-app {
  min-height: var(--page-height);
  background-color: var(--bg-color);
  touch-action: none;
  display: flex;
  & > * {
    width: 100%;
    flex-shrink: 0;
  }
}
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 16px;
  border: 1px solid var(--border-color);
  font-weight: 500;
  &.primary-btn {
    background: var(--primary-btn-color);
    color: #fff;
    border: none;
  }
  &.text-btn {
    color: var(--primary-btn-color);
    border: none;
  }
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
  & + .btn {
    margin-left: 12px;
  }
}
</style>
