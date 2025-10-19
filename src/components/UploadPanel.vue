<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallpaperStore } from "../stores/wallpaperStore";
import { useMusicStore } from "../stores/musicStore";
import { useUserStore } from "../stores/userStore";

const wallpaperStore = useWallpaperStore();
const musicStore = useMusicStore();
const userStore = useUserStore();

const activeTab = ref<"wallpaper" | "music">("wallpaper");
const wallpaperFile = ref<File | null>(null);
const musicFile = ref<File | null>(null);
const wallpaperTitle = ref("");
const wallpaperTags = ref("");
const musicTitle = ref("");
const musicArtist = ref("");
const isUploading = ref(false);

const isAuthenticated = computed(() => userStore.isAuthenticated);
const wallpaperFileInput = ref<HTMLInputElement>();
const musicFileInput = ref<HTMLInputElement>();

const handleWallpaperFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    wallpaperFile.value = file;
    if (!wallpaperTitle.value) {
      wallpaperTitle.value = file.name.split(".")[0];
    }
  }
};

const handleMusicFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    musicFile.value = file;
    if (!musicTitle.value) {
      musicTitle.value = file.name.split(".")[0];
    }
  }
};

const uploadWallpaper = async () => {
  if (!wallpaperFile.value || !wallpaperTitle.value.trim()) return;

  isUploading.value = true;

  const tags = wallpaperTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  const result = await wallpaperStore.uploadWallpaper(
    wallpaperFile.value,
    wallpaperTitle.value.trim(),
    tags
  );

  if (result.success) {
    // Clear form
    wallpaperFile.value = null;
    wallpaperTitle.value = "";
    wallpaperTags.value = "";
    if (wallpaperFileInput.value) {
      wallpaperFileInput.value.value = "";
    }
  }

  isUploading.value = false;
};

const uploadMusic = async () => {
  if (!musicFile.value || !musicTitle.value.trim()) return;

  isUploading.value = true;

  const result = await musicStore.uploadTrack(
    musicFile.value,
    musicTitle.value.trim(),
    musicArtist.value.trim() || undefined
  );

  if (result.success) {
    // Clear form
    musicFile.value = null;
    musicTitle.value = "";
    musicArtist.value = "";
    if (musicFileInput.value) {
      musicFileInput.value.value = "";
    }
  }

  isUploading.value = false;
};

const triggerWallpaperUpload = () => {
  wallpaperFileInput.value?.click();
};

const triggerMusicUpload = () => {
  musicFileInput.value?.click();
};

const removeWallpaperFile = () => {
  wallpaperFile.value = null;
  if (wallpaperFileInput.value) {
    wallpaperFileInput.value.value = "";
  }
};

const removeMusicFile = () => {
  musicFile.value = null;
  if (musicFileInput.value) {
    musicFileInput.value.value = "";
  }
};
</script>

<template>
  <div class="upload-panel glass-panel p-6 rounded-2xl h-full flex flex-col">
    <!-- Header with Tabs -->
    <div class="mb-6">
      <div class="flex rounded-xl glass-panel p-1">
        <button
          @click="activeTab = 'wallpaper'"
          class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300"
          :class="
            activeTab === 'wallpaper'
              ? 'bg-white/20 text-white/90'
              : 'text-white/60 hover:text-white/80'
          "
        >
          Wallpaper
        </button>
        <button
          @click="activeTab = 'music'"
          class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300"
          :class="
            activeTab === 'music'
              ? 'bg-white/20 text-white/90'
              : 'text-white/60 hover:text-white/80'
          "
        >
          Music
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <!-- Wallpaper Upload -->
      <div v-if="activeTab === 'wallpaper'" class="space-y-4">
        <!-- File Upload Area -->
        <div class="space-y-4">
          <input
            ref="wallpaperFileInput"
            type="file"
            accept="image/*,video/*,.gif"
            @change="handleWallpaperFileSelect"
            class="hidden"
          />

          <div
            @click="triggerWallpaperUpload"
            class="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-all duration-300"
          >
            <div v-if="!wallpaperFile" class="space-y-3">
              <svg
                class="w-12 h-12 text-white/60 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p class="text-white/80 font-medium">Upload Wallpaper</p>
                <p class="text-white/60 text-sm">
                  Drag & drop or click to select
                </p>
                <p class="text-white/50 text-xs mt-1">
                  Supports: JPG, PNG, GIF, MP4, WebM
                </p>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div class="flex items-center justify-center gap-3">
                <svg
                  class="w-8 h-8 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <span class="text-white/90 font-medium">{{
                  wallpaperFile.name
                }}</span>
                <button
                  @click.stop="removeWallpaperFile"
                  class="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2"
              >Title</label
            >
            <input
              v-model="wallpaperTitle"
              type="text"
              placeholder="Enter wallpaper title"
              class="w-full glass-panel p-3 rounded-xl bg-transparent text-white placeholder-white/60 outline-none text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2"
              >Tags (comma separated)</label
            >
            <input
              v-model="wallpaperTags"
              type="text"
              placeholder="nature, abstract, minimal"
              class="w-full glass-panel p-3 rounded-xl bg-transparent text-white placeholder-white/60 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Music Upload -->
      <div v-if="activeTab === 'music'" class="space-y-4">
        <!-- File Upload Area -->
        <div class="space-y-4">
          <input
            ref="musicFileInput"
            type="file"
            accept="audio/*"
            @change="handleMusicFileSelect"
            class="hidden"
          />

          <div
            @click="triggerMusicUpload"
            class="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/40 transition-all duration-300"
          >
            <div v-if="!musicFile" class="space-y-3">
              <svg
                class="w-12 h-12 text-white/60 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <div>
                <p class="text-white/80 font-medium">Upload Music</p>
                <p class="text-white/60 text-sm">
                  Drag & drop or click to select
                </p>
                <p class="text-white/50 text-xs mt-1">
                  Supports: MP3, WAV, OGG, M4A
                </p>
              </div>
            </div>

            <div v-else class="space-y-3">
              <div class="flex items-center justify-center gap-3">
                <svg
                  class="w-8 h-8 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <span class="text-white/90 font-medium">{{
                  musicFile.name
                }}</span>
                <button
                  @click.stop="removeMusicFile"
                  class="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2"
              >Title</label
            >
            <input
              v-model="musicTitle"
              type="text"
              placeholder="Enter song title"
              class="w-full glass-panel p-3 rounded-xl bg-transparent text-white placeholder-white/60 outline-none text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2"
              >Artist</label
            >
            <input
              v-model="musicArtist"
              type="text"
              placeholder="Enter artist name"
              class="w-full glass-panel p-3 rounded-xl bg-transparent text-white placeholder-white/60 outline-none text-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Button -->
    <div class="mt-6 pt-4 border-t border-white/10">
      <button
        v-if="activeTab === 'wallpaper'"
        @click="uploadWallpaper"
        :disabled="
          !wallpaperFile ||
          !wallpaperTitle.trim() ||
          isUploading ||
          !isAuthenticated
        "
        class="w-full glass-button py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div v-if="isUploading" class="flex items-center justify-center gap-2">
          <div
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
          <span>Uploading...</span>
        </div>
        <span v-else>Upload Wallpaper</span>
      </button>

      <button
        v-if="activeTab === 'music'"
        @click="uploadMusic"
        :disabled="
          !musicFile || !musicTitle.trim() || isUploading || !isAuthenticated
        "
        class="w-full glass-button py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div v-if="isUploading" class="flex items-center justify-center gap-2">
          <div
            class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></div>
          <span>Uploading...</span>
        </div>
        <span v-else>Upload Music</span>
      </button>

      <p v-if="!isAuthenticated" class="text-xs text-white/60 text-center mt-2">
        Please sign in to upload content
      </p>
    </div>
  </div>
</template>
