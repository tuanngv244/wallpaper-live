<script setup lang="ts">
import { useMusicStore } from "../stores/musicStore";
import { ITrack } from "../types/music";

interface Props {
  isOpen: boolean;
}

interface Emits {
  (e: "close"): void;
  (e: "choose", data: ITrack): void;
}

const { isOpen } = defineProps<Props>();
const emit = defineEmits<Emits>();

const musicStore = useMusicStore();

const closeModal = () => {
  emit("close");
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeModal();
  }
};

const chooseMusic = (music: ITrack) => {
  emit("choose", music);
  closeModal();
};
</script>

<template>
  <!-- Modal Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click.self="closeModal"
  >
    <!-- Modal Card -->
    <div
      class="glass-panel rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl w-full max-w-md transform transition-all duration-300"
      @keydown="handleKeyPress"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="p-6 border-b border-white/10">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-white/80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1 13.5 2.5 16.17 5.33 10.5 11H6.5C5.67 11 5 11.67 5 12.5S5.67 14 6.5 14H7.5L9.5 16H17.5C18.33 16 19 15.33 19 14.5C19 13.67 18.33 13 17.5 13H15L13 11H14.83L19.5 6.33L21 7.83V9H21Z"
                />
              </svg>
            </div>
            <div>
              <h2 class="text-white text-lg font-semibold">Music List</h2>
              <p class="text-white/60 text-sm">Choose music to play</p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <svg
              class="w-4 h-4 text-white/80"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>
      <!-- List -->
      <div
        v-for="track in musicStore.tracks"
        :key="track.id"
        class="flex flex-col p-1"
      >
        <div
          class="flex flex-row items-center gap-2 group cursor-pointer p-1 hover:bg-white/10 transition-all duration-200 rounded-3xl"
          @click="chooseMusic(track)"
        >
          <div class="p-2">
            <div
              class="relative mx-auto w-[3rem] h-[3rem] rounded-full overflow-hidden shadow-2xl group-hover:animate-spin"
            >
              <img
                src="/wallpapers/bg-default.jpg"
                :alt="track?.title || 'No Track'"
                class="w-full h-full object-cover"
              />
            </div>
          </div>
          <div class="text-left">
            <h2 class="text-white text-[1rem] font-semibold mb-1 truncate">
              {{ track?.title || "No Track Playing" }}
            </h2>
            <p class="text-white/70 text-[0.875rem] font-medium truncate">
              {{ track?.artist || "Unknown Artist" }}
            </p>
          </div>
        </div>
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

/* Button hover effects */
.login-modal button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-modal button:active {
  transform: scale(0.95);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.glass-panel {
  animation: fadeIn 0.3s ease-out;
}

/* Input focus styling */
.login-modal input:focus {
  outline: none;
}

/* iOS-style text styling */
.login-modal h2 {
  font-weight: 600;
  letter-spacing: -0.02em;
}

.login-modal label {
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* Loading spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* OAuth button hover effects */
.login-modal button:hover svg {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Modal overlay fade in */
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fixed.inset-0 {
  animation: overlayFadeIn 0.2s ease-out;
}
</style>
