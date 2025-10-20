<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { WebSocketService } from '@/utils/websocket'

const messages = ref([])
const inputMessage = ref('')
const username = ref('user100')
const socket = ref(null)

onMounted(() => {
  socket.value = new WebSocketService('wss://chat.example.com')
  socket.value.connect()

  // 监听收到的消息
  socket.value.on('message', handleReceivedMessage)
})

/**
 * 组件卸载前清理资源
 */
onBeforeUnmount(() => {
  socket.value?.off('message', handleReceivedMessage)
  socket.value?.close()
})

/**
 * 处理接收到的消息
 * @param {string|object} data - 接收到的消息数据
 */
function handleReceivedMessage(data) {
  try {
    const message = typeof data === 'string' ? JSON.parse(data) : data
    // 标记为接收的消息（不是当前用户发送的）
    if (message.senderId !== username.value) {
      messages.value.push({
        ...message,
        isOwn: false, // 标记为他人发送的消息
      })
    }
  } catch (e) {
    console.error('消息解析错误:', e)
  }
}

/**
 * 发送消息
 */
function sendMessage() {
  const content = inputMessage.value.trim()
  if (!content) return

  // 构造消息对象
  const message = {
    content: content,
    senderId: username.value,
    timestamp: new Date().toISOString(),
    isOwn: true, // 标记为自己发送的消息
  }

  // 1. 立即将消息添加到列表（乐观更新）
  messages.value.push(message)

  // 2. 通过 WebSocket 发送消息
  socket.value.send(message)

  // 3. 清空输入框
  inputMessage.value = ''

  // 4. 滚动到最新消息
  setTimeout(() => {
    const chatContainer = document.querySelector('.messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, 50)
}
</script>

<template>
  <div class="chat-container">
    <!-- 消息展示区域 -->
    <div class="messages">
      <!-- 遍历所有消息 -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message"
        :class="{ 'own-message': msg.isOwn, 'other-message': !msg.isOwn }"
      >
        <!-- 消息元信息（发送者/时间） -->
        <div class="message-meta">
          <span class="sender">
            {{ msg.isOwn ? `${msg.senderId}` : `用户${msg.senderId?.substr(0, 4)}` }}
          </span>
          <span class="time">
            {{ new Date(msg.timestamp).toLocaleTimeString() }}
          </span>
        </div>
        <!-- 消息内容 -->
        <div class="content">
          {{ msg.content }}
        </div>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="input-area">
      <input v-model="inputMessage" @keyup.enter="sendMessage" placeholder="输入消息..." />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: white;
}

.message {
  margin-bottom: 15px;
  max-width: 80%;
}

.message-meta {
  font-size: 0.8em;
  color: #666;
  margin-bottom: 4px;
}

.sender {
  font-weight: bold;
  margin-right: 10px;
}

.time {
  color: #999;
}

.content {
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
}

/* 自己发送的消息样式 */
.own-message {
  margin-left: auto;
}

.own-message .content {
  background: #1890ff;
  color: white;
  border-top-right-radius: 0;
}

/* 他人发送的消息样式 */
.other-message {
  margin-right: auto;
}

.other-message .content {
  background: #f0f0f0;
  color: #333;
  border-top-left-radius: 0;
}

.input-area {
  display: flex;
  padding: 10px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.input-area input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
  outline: none;
}

.input-area button {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.input-area button:hover {
  background: #40a9ff;
}
</style>
