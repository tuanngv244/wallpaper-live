<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/userStore";
import { useWallpaperStore } from "../stores/wallpaperStore";
import { useMusicStore } from "../stores/musicStore";
import { useChatStore } from "../stores/chatStore";

const router = useRouter();
const userStore = useUserStore();
const wallpaperStore = useWallpaperStore();
const musicStore = useMusicStore();
const chatStore = useChatStore();

const isAuthenticated = computed(() => userStore.isAuthenticated);
const wallpapers = computed(() => wallpaperStore.wallpapers);
const tracks = computed(() => musicStore.tracks);
const messages = computed(() => chatStore.messages);

const goHome = () => {
  router.push("/");
};

const deleteWallpaper = async (id: string) => {
  if (confirm("Are you sure you want to delete this wallpaper?")) {
    await wallpaperStore.deleteWallpaper(id);
  }
};

const deleteTrack = async (id: string) => {
  if (confirm("Are you sure you want to delete this track?")) {
    await musicStore.deleteTrack(id);
  }
};
</script>

<template>
  <div class="admin-page min-h-screen bg-black text-white p-6">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl mb-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-white/90">Admin Dashboard</h1>
        <button
          @click="goHome"
          class="glass-button px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-300"
        >
          Back to Home
        </button>
      </div>
    </div>

    <div
      v-if="!isAuthenticated"
      class="glass-panel p-6 rounded-2xl text-center"
    >
      <p class="text-white/60">Please sign in to access the admin dashboard.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Wallpapers Management -->
      <div class="glass-panel p-6 rounded-2xl">
        <h2 class="text-xl font-semibold text-white/90 mb-4">
          Wallpapers ({{ wallpapers.length }})
        </h2>
        <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="wallpaper in wallpapers"
            :key="wallpaper.id"
            class="flex items-center justify-between p-3 glass-panel rounded-xl"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white/90 truncate">
                {{ wallpaper.title }}
              </p>
              <p class="text-xs text-white/60">
                by {{ wallpaper.uploader?.username }}
              </p>
            </div>
            <button
              @click="deleteWallpaper(wallpaper.id)"
              class="text-red-400 hover:text-red-300 text-sm px-2"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Music Management -->
      <div class="glass-panel p-6 rounded-2xl">
        <h2 class="text-xl font-semibold text-white/90 mb-4">
          Music Tracks ({{ tracks.length }})
        </h2>
        <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="track in tracks"
            :key="track.id"
            class="flex items-center justify-between p-3 glass-panel rounded-xl"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white/90 truncate">
                {{ track.title }}
              </p>
              <p class="text-xs text-white/60">
                {{ track.artist || "Unknown Artist" }}
              </p>
            </div>
            <button
              @click="deleteTrack(track.id)"
              class="text-red-400 hover:text-red-300 text-sm px-2"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
        <h2 class="text-xl font-semibold text-white/90 mb-4">
          Recent Chat Messages ({{ messages.length }})
        </h2>
        <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          <div
            v-for="message in messages.slice(-50)"
            :key="message.id"
            class="p-3 glass-panel rounded-xl"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="text-sm font-medium text-white/90">
                  {{ message.user?.username || "Unknown" }}
                </p>
                <p class="text-sm text-white/80 mt-1">{{ message.content }}</p>
              </div>
              <span class="text-xs text-white/60">
                {{ new Date(message.created_at).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
