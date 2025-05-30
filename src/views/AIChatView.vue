<template>
  <section class="container ai-chat-view">
    <header class="chat-header" v-if="!noHeader">
      <span class="material-symbols-outlined settings-icon" @click="aisettingsVisible=true">settings</span>
    </header>
    <main class="message-list-container start-page" v-if="startPage">
      <div class="start-page-logo-container">
        <img :src="'./icons/icon64.png'" alt="" class="start-page-logo">
        <h3 class="start-page-title">AI问书</h3>
      </div>
      <h4 class="start-page-subtitle">Hi，欢迎使用 AI问书</h4>
      <ul class="start-page-prompt-list">
        <li class="start-page-prompt"
          v-for="item in suggestions"
          :key="item.label"
          @click="onSubmit(item.label)"
        >{{ item.label }}</li>
      </ul>
    </main>
    <main class="message-list-container" v-else>
      <ul class="message-list">
        <li class="message-item"
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="[`role-${msg.from}`, msg.loading ? 'loading' : ''].filter(Boolean).join(' ')"
        >
          <div class="message-content" v-if="msg.from === 'user'">{{ msg.content }}</div>
          <div class="message-content markdown-content" :class="{'think-closed': msg.thinkClosed}" v-else>
            <div class="toggle-think-btn" v-if="msg.content.includes('<think>')" @click="msg.thinkClosed = !msg.thinkClosed">
              <span>已深度思考(用时{{msg.timeCost}}秒)</span>
              <span class="material-symbols-outlined toggle-icon transform-transition">keyboard_arrow_down</span>
            </div>
            <markdown-viewer :markdown="msg.content"></markdown-viewer>
            <span class="material-symbols-outlined loading-icon">progress_activity</span>
          </div>
        </li>
      </ul>
    </main>
    <footer class="chat-footer">
      <c-textarea
        class="text-input"
        v-model="inputValue"
        placeholder="针对本书提出你的问题"
      ></c-textarea>
      <button class="btn info-btn"
        v-if="isLoading"
        @click="stopLoading"
      ><span class="material-symbols-outlined">stop_circle</span></button>
      <button class="btn primary-btn"
        v-else
        @click="onSubmit(inputValue)"
      ><span class="material-symbols-outlined">arrow_upward</span></button>
    </footer>
    <a-i-prfs-dialog :visible="aisettingsVisible" @close="aisettingsVisible = false" />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import OpenAI from 'openai';
import CTextarea from '@/components/common/CTextarea.vue';
import AIPrfsDialog from '@/components/AIPrfsDialog.vue';
import type { Stream } from 'openai/streaming.mjs';
import { showToast } from '@/utils';
import MarkdownViewer from '@/components/MarkdownViewer.vue';
import { preferences } from '@/stores/preferences';

defineProps<{
  noHeader?: boolean
}>()

const aisettingsVisible = ref(!preferences.value.ai);

let client: OpenAI | null = null;

const createClient = () => {
  client = preferences.value.ai ? new OpenAI({
    apiKey: preferences.value.ai?.apiKey, // 模型APIKey
    baseURL: preferences.value.ai?.baseURL, // 模型API地址
    dangerouslyAllowBrowser: true,
  }) : null;
}

onMounted(createClient)

const startPage = ref(true);
const suggestions = [
  {
    label: '本章内容总结',
  },
  {
    label: '书籍内容总结',
    desc: '总结本书的内容',
  },
  {
    label: '书籍亮点',
    desc: '本书有什么亮点?',
  },
];
const inputValue = ref('');

interface IMessageItem {
  from: 'user' | 'assistant' | 'system',
  content: string,
  loading?: boolean,
  thinkClosed?: boolean,
  timeCost?: number,
}

const messages = ref<IMessageItem[]>([]);
let completion: Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
    _request_id?: string | null;
} | null = null
const isLoading = computed(() => messages.value[messages.value.length - 1]?.loading ?? false)

const onSubmit = (query: string) => {
  if (isLoading.value) {
    showToast('当前消息尚未结束')
    return
  }
  inputValue.value = '';
  startPage.value = false;
  // 用户发送消息
  messages.value.push({
    from: 'user',
    content: query,
  });

  fetchData(query);
};

const stopLoading = () => {
  const lastMessage = messages.value[messages.value.length - 1]
  if (lastMessage.loading) {
    completion?.controller.abort()
    lastMessage.loading = false
  }
}

const fetchData = async (query: string) => {
  messages.value.push({
    from: 'assistant',
    content: '',
    loading: true,
    timeCost: 0,
  });
  if (!client || !preferences.value.ai?.model) {
    const msg = '需要先配置AI参数才能使用AI问书功能'
    aisettingsVisible.value = true
    showToast(msg)
    messages.value[messages.value.length - 1].loading = false
    messages.value[messages.value.length - 1].content = msg
    throw new Error(msg)
  }
  completion = await client.chat.completions.create({
    model: preferences.value.ai.model, // 替换为自己的model名称
    messages: [{ role: 'user', content: query }],
    stream: true, // 为 true 则开启接口的流式返回
  });
  const startTime = Date.now()
  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    const lastMessage = messages.value[messages.value.length - 1]
    lastMessage.content += content;
    lastMessage.timeCost = Math.round((Date.now() - startTime) / 1000)
    nextTick(() => {
      const el = document.querySelector<HTMLElement>('.ai-chat-view .message-list-container')
      el?.scrollTo({
        top: el.scrollHeight
      });
    })
  }
  messages.value[messages.value.length - 1].loading = false
};
</script>

<style lang="scss" scoped>
.ai-chat-view {
  height: var(--page-height);
  gap: 8px;
}
.chat-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 16px;
  height: 32px;
  font-size: 24px;
  .settings-icon {
    cursor: pointer;
  }
}

.message-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  flex: 1;
  height: 0;
  min-height: 60vh;
  &.start-page {
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
}
.start-page-logo-container {
  display: flex;
  align-items: center;
  img {
    width: 44px;
    height: auto;
    margin-right: 8px;
  }
}
.start-page-prompt-list {
  list-style: none;
  gap: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-top: auto;
  font-size: 14px;
  padding: 0 16px;
  .start-page-prompt {
    padding: 4px 16px;
    border: 1px solid light-dark(#dadada, #333);
    border-radius: 10px;
    cursor: pointer;
  }
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  padding: 0 16px;
}
.message-item {
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 400;
  &.role-user {
    background-color: #c4e0fd;
    align-self: flex-end;
  }
  &.role-assistant {
    align-self: flex-start;
    background-color: #fff;
  }
  .loading-icon {
    display: none;
  }
  @keyframes rotate {
    0% {
      transform: rotate(0)
    }
    100% {
      transform: rotate(360deg)
    }
  }
  &.loading .loading-icon {
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: rotate 1.6s ease infinite;
  }
  .markdown-content {
    padding: 6px 0;
    &.think-closed {
      .toggle-think-btn {
        .toggle-icon {
          transform: rotate(180deg);
        }
      }
      &:deep(.mc-markdown-render think) {
        height: 0;
      }
    }
    .toggle-think-btn {
      margin-bottom: 12px;
      font-size: 14px;
      display: flex;
      align-items: center;
      cursor: pointer;
      width: fit-content;
      .toggle-icon {
        font-weight: 600;
      }
    }
    :deep(.mc-markdown-render) {
      pre {
        white-space: break-spaces;
      }
      think {
        border-left: 2px solid #ddd;
        display: block;
        padding-left: 12px;
        opacity: 0.6;
        font-weight: 400;
        interpolate-size: allow-keywords;
        transition: height .2s;
        overflow: hidden;
      }
    }
  }
}

.chat-footer {
  display: flex;
  align-items: flex-end;
  padding: 0 16px;
  .text-input {
    border-radius: 6px;
    flex: 1;
  }
  button {
    margin-left: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    height: 39px;
  }
}
.ai-chat-view {
  display: flex;
  flex-direction: column;
  &:deep() {
    .mc-header {
      .mc-header-logo {
        width: 32px;
        height: auto;
      }
      .mc-header-title {
        font-size: 16px;
      }
    }
    .mc-introduction .mc-introduction-logo-container {
      img {
        width: 44px;
        height: auto;
      }
      .mc-introduction-title {
        font-size: 16px;
      }
    }
  }
}
</style>
