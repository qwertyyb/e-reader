<template>
  <section class="my-view">
    <div class="navigation-bar">
      <span v-if="isSmall" class="material-symbols-outlined pointer settings-icon"
        @click="$router.push({ name: 'preferences' })">tune</span>
    </div>
    <header class="my-info">
      <img :src="'./icons/icon128.png'" alt="" class="avatar">
      <p class="my-nick">昵称</p>
    </header>
    <main class="my-main">
      <ul class="my-list">
        <li class="my-item duration-item pointer" @click="$router.push({ name: 'readTimeState' })">
          <div class="item-bg-icon-wrapper">
            <svg t="1765687653105" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1691" width="200" height="200"><path d="M512 0a512 512 0 1 0 512 512 512.585143 512.585143 0 0 0-512-512z m0 938.715429A426.715429 426.715429 0 1 1 938.715429 512 427.154286 427.154286 0 0 1 512 938.715429z" p-id="1692"></path><path d="M701.44 615.497143L542.208 523.483429V272.530286a38.4 38.4 0 0 0-76.8 0V541.257143c0 14.189714 17.627429 26.185143 29.184 32.768 4.900571 5.12 10.825143 9.216 17.261714 12.214857l158.208 95.963429a34.304 34.304 0 0 0 48.786286-13.970286 39.643429 39.643429 0 0 0-17.554286-52.809143z" p-id="1693"></path></svg>
          </div>
          <h3 class="item-title">阅读时长</h3>
          <div class="item-desc" v-html="durationTotal"></div>
        </li>
        <li class="my-item notes-item pointer" @click="$router.push({ name: 'notesState' })">
          <div class="item-bg-icon-wrapper">
            <svg t="1765688455312" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="6411" width="200" height="200"><path d="M915.017956 0.193432H199.369387c-27.111063 0-53.122615 10.771124-72.292773 29.941283A102.275796 102.275796 0 0 0 97.125151 102.427488v107.34474H46.008124c-25.410894 0-46.006343 20.595449-46.006343 46.006343 0 25.410894 20.595449 46.006343 46.006343 46.006343H97.125151v163.582633H46.008124a45.999217 45.999217 0 0 0-39.836871 69.004424 45.987 45.987 0 0 0 39.836871 23.008262H97.125151v163.582633H46.008124c-25.410894 0-46.006343 20.595449-46.006343 46.006344s20.595449 46.006343 46.006343 46.006343H97.125151v107.34474c0 27.111063 10.771124 53.122615 29.941283 72.292773a102.248308 102.248308 0 0 0 72.292773 29.941282h715.648569c27.111063 0 53.122615-10.771124 72.292773-29.941282a102.248308 102.248308 0 0 0 29.941282-72.292773V102.427488c0-27.111063-10.771124-53.122615-29.941282-72.292773a102.189261 102.189261 0 0 0-72.282593-29.941283z m10.22137 920.126861A10.216279 10.216279 0 0 1 915.017956 930.541662H199.369387a10.216279 10.216279 0 0 1-10.221369-10.221369V812.965372h10.221369c25.410894 0 46.006343-20.595449 46.006343-46.006343s-20.595449-46.006343-46.006343-46.006343h-10.221369V557.380233h10.221369c25.410894 0 46.006343-20.595449 46.006343-46.006343 0-25.400714-20.595449-46.006343-46.006343-46.006343h-10.221369V301.795095h10.221369c25.410894 0 46.006343-20.595449 46.006343-46.006343 0-25.410894-20.595449-46.006343-46.006343-46.006343h-10.221369V102.427488c0-2.708052 1.079149-5.314298 2.99311-7.22826a10.190827 10.190827 0 0 1 7.228259-2.99311h715.648569c2.708052 0 5.314298 1.079149 7.22826 2.99311a10.174538 10.174538 0 0 1 2.99311 7.22826v817.892805zM638.979898 706.139845l46.006343 92.012686a16.867296 16.867296 0 0 0 30.674289 0l46.006343-92.012686V385.632721h-122.676794v320.507124z m61.338397-490.737719a61.287494 61.287494 0 0 0-43.369555 17.968841 61.330253 61.330253 0 0 0-17.968842 43.369556v61.338397h122.676794V276.740523c0-16.268674-6.464711-31.865425-17.968841-43.369556a61.312946 61.312946 0 0 0-43.369556-17.968841z m0 0" p-id="6412"></path></svg>
          </div>
          <h3 class="item-title">笔记</h3>
          <div class="item-desc" v-html="marksTotal"></div>
        </li>
      </ul>
    </main>
  </section>
</template>

<script setup lang="ts">
import { marks, readingStateStore } from '@/services/storage';
import { formatDuration } from '@/utils';
import { isSmall } from '@/utils/env';
import { ref } from 'vue';

const durationTotal = ref('')
const marksTotal = ref('')

const refreshDuration = async () => {
  const list = await readingStateStore.getList()
  const duration = list.reduce((acc, item) => acc + (item.duration ?? 0), 0)
  durationTotal.value = formatDuration(duration).replace(/(\d+)/g, `<span class="big-text">$1</span>`)
}

const refreshMarks = async () => {
  marksTotal.value = `<span class="big-text">${await marks.count()}</span>条笔记`
}

const refresh = () => {
  refreshDuration()
  refreshMarks()
}

refresh()
</script>

<style lang="scss" scoped>
@use "../styles/variables";

.my-view {
  padding: var(--sait) 16px 0 16px;
}
.navigation-bar {
  display: flex;
  justify-content: flex-end;
}
.settings-icon {
  padding: 6px;
  font-size: 24px;
}
.my-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0 30px 0;
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
  }
  .my-nick {
    margin-top: 12px;
    font-weight: 500;
    font-size: 14px;
  }
}
:deep(.big-text) {
  font-weight: bold;
  font-size: 28px;
  margin: 0 3px;
}
.my-list {
  list-style: none;
}
.my-item {
  background: var(--card-bg-color);
  border-radius: 4px;
  padding: 16px;
  position: relative;
  overflow: hidden;
  // background-image: linear-gradient(to top right, #e2e7e8, rgb(186, 221, 255));
  & + .my-item {
    margin-top: 12px;
  }
  .item-bg-icon-wrapper {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 16px;
    svg {
      width: 50px;
      height: 50px;
      fill: var(--theme-color);
      opacity: 0.2;
      vertical-align: middle;
    }
  }
  .item-desc {
    margin-top: 8px;
  }
  .item-more {
    transform: translateY(-50%);
    position: absolute;
    top: 50%;
    right: 16px;
    opacity: 0.7;
  }
  .item-title {
    font-size: 13px;
  }
}

@media (width > variables.$MAX_SMALL_WIDTH) {
  .my-main {
    display: flex;
  }
  .my-list {
    margin: auto;
    display: flex;
    gap: 12px;
  }
  .my-item {
    height: 100px;
    width: 300px;
    display: flex;
    flex-direction: column;
    & + .my-item {
      margin-top: 0;
    }
  }
}
</style>
