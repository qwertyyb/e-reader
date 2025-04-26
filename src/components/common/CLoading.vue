<template>
  <div class="c-loading">
    <span class="c-loading-icon material-symbols-outlined">progress_activity</span>
  </div>
</template>

<style lang="scss" scoped>
.c-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: rgb(238, 238, 238);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.c-loading-icon {
  font-size: 32px;
  color: var(--mdc-theme-primary);
  animation: loading 1s infinite linear;
}
@keyframes loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
