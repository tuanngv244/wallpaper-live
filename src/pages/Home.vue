<script setup lang="ts">
import { onMounted } from "vue";
import UploadPanel from "../components/UploadPanel.vue";
import { useWallpaperStore } from "../stores/wallpaperStore";
import { useMusicStore } from "../stores/musicStore";
import { useChatStore } from "../stores/chatStore";
import WallpaperPlayer from "../components/WallpaperPlayer.vue";
import MusicController from "../components/MusicController.vue";
import ChatBox from "../components/ChatBox.vue";
import UserProfile from "../components/UserProfile.vue";

const wallpaperStore = useWallpaperStore();
const musicStore = useMusicStore();
const chatStore = useChatStore();

onMounted(async () => {
  // Initialize all stores
  await Promise.all([
    wallpaperStore.initializeStore(),
    musicStore.initializeStore(),
    chatStore.initializeStore(),
  ]);
});
</script>

<template>
  <div class="home-container w-screen h-screen overflow-hidden relative">
    <!-- Background Wallpaper -->
    <WallpaperPlayer />

    <div class="h-screen flex flex-col gap-2 p-3">
      <!-- Music Board -->
      <div class="h-[280px]">
        <MusicController />
      </div>
      <!-- Chat Box -->
      <div class="h-[calc(100vh_-_312px)]">
        <ChatBox />
      </div>
    </div>

    <!-- User Profile -->
    <UserProfile />
  </div>
</template>

<style scoped>
.home-container {
  background: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
}

/* Add subtle animations */
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

.glass-panel {
  animation: fadeIn 0.6s ease-out;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
}
</style>
