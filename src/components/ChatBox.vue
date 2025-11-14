<script setup lang="ts">
import { computed, onMounted, ref, nextTick, watch } from "vue";
import { useChatStore } from "../stores/chatStore";
import { useUserStore } from "../stores/userStore";

const chatStore = useChatStore();
const userStore = useUserStore();

const messageInput = ref("");
const messagesContainer = ref<HTMLElement>();
const isConnected = computed(() => chatStore.connected);
const messages = computed(() => chatStore.sortedMessages);
const currentUser = computed(() => userStore.user);

// New reactive state
const onlineCount = ref(3); // Fake online count
const showEmojiPicker = ref(false);
const selectedEmoji = ref("💬");
const showScrollButton = ref(false);

// Fake messages for testing - More messages to test scrolling
const fakeMessages = ref([
  {
    id: "fake-1",
    content: "Hey everyone! 👋 How's it going?",
    user: { username: "Alice", avatar_url: null },
    created_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
  },
  {
    id: "fake-2",
    content: "Just enjoying this beautiful wallpaper! The sunset is amazing 🌅",
    user: { username: "Bob", avatar_url: null },
    created_at: new Date(Date.now() - 540000).toISOString(), // 9 min ago
  },
  {
    id: "fake-3",
    content: "Does anyone know how to change the music? 🎵",
    user: { username: "Charlie", avatar_url: null },
    created_at: new Date(Date.now() - 480000).toISOString(), // 8 min ago
  },
  {
    id: "fake-4",
    content: "Love the glass effect on these chat bubbles! So smooth ✨",
    user: { username: "Diana", avatar_url: null },
    created_at: new Date(Date.now() - 420000).toISOString(), // 7 min ago
  },
  {
    id: "fake-5",
    content:
      "Anyone else here from the iOS community? This feels just like home 📱",
    user: { username: "Eve", avatar_url: null },
    created_at: new Date(Date.now() - 360000).toISOString(), // 6 min ago
  },
  {
    id: "fake-6",
    content: "The animations are so smooth! Love the glass morphism design �",
    user: { username: "Frank", avatar_url: null },
    created_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
  },
  {
    id: "fake-7",
    content:
      "Can we get more wallpapers? This one is stunning but variety would be nice �️",
    user: { username: "Grace", avatar_url: null },
    created_at: new Date(Date.now() - 240000).toISOString(), // 4 min ago
  },
  {
    id: "fake-8",
    content:
      "I'm working on uploading some nature sounds to match this vibe 🍃",
    user: { username: "Henry", avatar_url: null },
    created_at: new Date(Date.now() - 180000).toISOString(), // 3 min ago
  },
  {
    id: "fake-9",
    content:
      "This chat system is better than most apps I've used! Props to the developer �",
    user: { username: "Ivy", avatar_url: null },
    created_at: new Date(Date.now() - 120000).toISOString(), // 2 min ago
  },
  {
    id: "fake-10",
    content: "Just discovered the emoji picker! So many cute options 🎨",
    user: { username: "Jack", avatar_url: null },
    created_at: new Date(Date.now() - 60000).toISOString(), // 1 min ago
  },
]);

// Emoji options
const emojiOptions = [
  "💬",
  "😊",
  "❤️",
  "👍",
  "🔥",
  "⭐",
  "🎵",
  "🌟",
  "💫",
  "🎨",
  "🎭",
  "🎪",
];

// Combined messages (fake + real)
const allMessages = computed(() => {
  const combined = [...fakeMessages.value, ...messages.value];
  return combined.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
});

onMounted(async () => {
  await chatStore.initializeStore();
  chatStore.setVisibility(true);

  // Initial scroll to bottom
  nextTick(() => {
    scrollToBottom();
  });

  // Add a test message every 10 seconds to demonstrate scrolling
  setInterval(() => {
    addTestMessage();
  }, 10000);
});

watch(
  allMessages,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
);

const scrollToBottom = () => {
  if (messagesContainer.value) {
    // Use smooth scrolling for better UX
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: "smooth",
    });
  }
};

const sendMessage = async () => {
  if (!messageInput.value.trim()) return;

  // const result = await chatStore.sendMessage(messageInput.value);
  // if (result.success) {
  allMessages.value.push({
    id: "fake-3",
    content: messageInput.value,
    user: { username: "Cyan", avatar_url: null },
    created_at: new Date(Date.now() - 480000).toISOString(), // 8 min ago
  });
  messageInput.value = "";
  scrollToBottom();
  // }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const formatTime = (timestamp: string) => {
  return chatStore.formatMessageTime(timestamp);
};

const canDelete = (message: any) => {
  return (
    currentUser.value &&
    chatStore.canDeleteMessage(message, currentUser.value.id)
  );
};

const deleteMessage = async (messageId: string) => {
  await chatStore.deleteMessage(messageId);
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const addEmojiToMessage = (emoji: string) => {
  messageInput.value += emoji;
  showEmojiPicker.value = false;
};

// Add test messages periodically to see scrolling in action
const addTestMessage = () => {
  const testMessages = [
    "This scrolling is working perfectly! 🎉",
    "Love how smooth the chat feels ✨",
    "The glass effect is amazing! 🔮",
    "Can't stop scrolling through these messages 📜",
    "iOS vibes are strong with this one 📱",
  ];

  const randomMessage =
    testMessages[Math.floor(Math.random() * testMessages.length)];
  const newMessage = {
    id: `test-${Date.now()}`,
    content: randomMessage,
    user: { username: "TestUser", avatar_url: null },
    created_at: new Date().toISOString(),
  };

  fakeMessages.value.push(newMessage);
};

// Handle scroll to show/hide scroll-to-bottom button
const handleScroll = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
    showScrollButton.value = !isAtBottom;
  }
};
</script>

<template>
  <div
    class="chat-box glass-panel rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl w-80 h-full flex flex-col justify-between relative"
  >
    <!-- Header -->
    <div class="p-3 border-b border-white/10">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center"
          >
            <svg
              class="w-4 h-4 text-white/80"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-white text-sm font-semibold">Global Chat</h3>
            <div class="flex items-center gap-1">
              <div
                class="w-1.5 h-1.5 rounded-full"
                :class="isConnected ? 'bg-green-400' : 'bg-red-400'"
              ></div>
              <span class="text-xs text-white/60">{{
                isConnected ? "Online" : "Offline"
              }}</span>
            </div>
          </div>
        </div>
        <!-- Online Counter -->
        <div
          class="bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center rounded-full px-2 py-1"
        >
          <span class="text-xs text-white/80 font-medium"
            >{{ onlineCount }} online</span
          >
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div
      ref="messagesContainer"
      @scroll="handleScroll"
      class="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh_-_430px)] custom-scrollbar min-h-0"
    >
      <div
        v-if="allMessages.length === 0"
        class="text-center text-white/60 text-xs py-8"
      >
        <div
          class="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-white/40"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            />
          </svg>
        </div>
        <p>No messages yet</p>
        <p class="mt-1 text-white/40">Start the conversation!</p>
      </div>

      <div v-for="message in allMessages" :key="message.id" class="group">
        <!-- Message Bubble -->
        <div class="flex items-start gap-2 mb-3">
          <!-- Avatar -->
          <div
            class="w-7 h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0"
          >
            <img
              v-if="message.user?.avatar_url"
              :src="message.user.avatar_url"
              :alt="message.user?.username"
              class="w-full h-full rounded-full object-cover"
            />
            <span v-else class="text-xs text-white/70 font-medium">
              {{ message.user?.username?.charAt(0)?.toUpperCase() || "?" }}
            </span>
          </div>

          <!-- Message Content -->
          <div class="flex-1 min-w-0">
            <!-- Message Header -->
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-semibold text-white/90 truncate">
                {{ message.user?.username || "Unknown" }}
              </span>
              <span class="text-xs text-white/50">
                {{ formatTime(message.created_at) }}
              </span>
              <button
                v-if="canDelete(message)"
                @click="deleteMessage(message.id)"
                class="opacity-0 group-hover:opacity-100 transition-all duration-200 text-red-400 hover:text-red-300 hover:scale-110 ml-auto"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                  />
                </svg>
              </button>
            </div>

            <!-- Message Bubble -->
            <div
              class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3 py-2 shadow-lg"
            >
              <p class="text-xs text-white/90 break-words leading-relaxed">
                {{ message.content }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll to Bottom Button -->
    <div v-if="showScrollButton" class="absolute bottom-26 right-4 z-10">
      <button
        @click="scrollToBottom"
        class="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-200 hover:scale-105 shadow-lg"
      >
        <svg
          class="w-4 h-4 text-white/90"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </svg>
      </button>
    </div>

    <!-- Message Input -->
    <div class="p-3 border-t border-white/10 relative">
      <!-- Emoji Picker -->
      <div
        v-if="showEmojiPicker"
        class="absolute bottom-full left-4 mb-2 bg-black/70 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl z-50"
      >
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="emoji in emojiOptions"
            :key="emoji"
            @click="addEmojiToMessage(emoji)"
            class="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 text-lg"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <div class="flex gap-2 items-end">
        <!-- Emoji Button & Input Container -->
        <div class="flex-1 flex gap-2">
          <!-- Emoji Selector Button -->
          <button
            @click="toggleEmojiPicker"
            class="w-[2.5rem] h-[2.5rem] rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span class="text-lg">{{ selectedEmoji }}</span>
          </button>

          <!-- Input Field -->
          <div
            class="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl h-[2.5rem] shadow-lg"
          >
            <input
              v-model="messageInput"
              @keypress="handleKeyPress"
              placeholder="Message..."
              class="w-full h-[2.5rem] bg-transparent text-white placeholder-white/60 outline-none text-xs px-3"
            />
          </div>
        </div>

        <!-- Send Button -->
        <button
          @click="sendMessage"
          :disabled="!messageInput.trim() || !currentUser"
          class="w-[2.5rem] h-[2.5rem] rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
        >
          <svg
            class="w-4 h-4 text-white/90"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      <div v-if="!currentUser" class="text-xs text-white/60 mt-2 text-center">
        Please sign in to start chatting
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Glass panel base styling */
.glass-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Custom scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.8);
}

/* Button hover effects */
.chat-box button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-box button:active {
  transform: scale(0.95);
}

/* Message animations */
@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.group {
  animation: messageSlideIn 0.3s ease-out;
}

/* Fade in animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-box {
  animation: fadeIn 0.6s ease-out;
}

/* iOS-style text styling */
.chat-box h3 {
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Input focus styling */
.chat-box input:focus {
  outline: none;
}

/* Message bubble hover effect */
.group:hover .bg-white\/10 {
  background: rgba(255, 255, 255, 0.15);
}

/* Send button pulse effect when message is ready */
.chat-box button:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

/* Emoji picker animations */
@keyframes emojiPickerSlideUp {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.chat-box .absolute {
  animation: emojiPickerSlideUp 0.2s ease-out;
}

/* Emoji button hover effects */
.chat-box .grid button {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-box .grid button:active {
  transform: scale(0.9);
}

/* Online counter pulse effect */
@keyframes onlinePulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.chat-box .bg-white\/10:has(span:contains("online")) {
  animation: onlinePulse 3s ease-in-out infinite;
}

/* Scrollbar improvements */
.custom-scrollbar {
  scroll-behavior: smooth;
}
</style>
