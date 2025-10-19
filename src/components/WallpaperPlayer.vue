<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useWallpaperStore } from "../stores/wallpaperStore";

const wallpaperStore = useWallpaperStore();

const currentWallpaper = computed(() => wallpaperStore.currentWallpaper);
const wallpapers = computed(() => wallpaperStore.wallpapers);

onMounted(async () => {
  await wallpaperStore.initializeStore();
  wallpaperStore.loadCurrentWallpaperFromStorage();
});

const getFileType = (url: string) => {
  const extension = url.split(".").pop()?.toLowerCase();
  if (["mp4", "webm", "ogg"].includes(extension || "")) return "video";
  if (["gif"].includes(extension || "")) return "gif";
  return "image";
};
</script>

<template>
  <div
    class="wallpaper-player w-screen h-screen fixed top-0 left-0 overflow-hidden"
  >
    <!-- Video wallpaper -->
    <video
      v-if="
        currentWallpaper && getFileType(currentWallpaper.file_url) === 'video'
      "
      :src="currentWallpaper.file_url"
      class="absolute inset-0 w-full h-full object-cover"
      autoplay
      loop
      muted
      playsinline
    />

    <!-- GIF wallpaper -->
    <img
      v-else-if="
        currentWallpaper && getFileType(currentWallpaper.file_url) === 'gif'
      "
      :src="currentWallpaper.file_url"
      :alt="currentWallpaper.title"
      class="absolute inset-0 w-full h-full object-cover"
    />

    <!-- Static image wallpaper -->
    <img
      v-else-if="currentWallpaper"
      :src="currentWallpaper.file_url"
      :alt="currentWallpaper.title"
      class="absolute inset-0 w-full h-full object-cover"
    />
  </div>
</template>
