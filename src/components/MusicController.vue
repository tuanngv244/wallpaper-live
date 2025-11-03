<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useMusicStore } from "../stores/musicStore";

const musicStore = useMusicStore();

// Reactive state
const volume = ref(80);
const isShuffled = ref(false);
const repeatMode = ref<"off" | "all" | "one">("off");

// Computed properties
const currentTrack = computed(() => musicStore.currentTrack);
const isPlaying = computed(() => musicStore.isPlaying);
const currentTime = computed(() => musicStore.currentTime);
const duration = computed(() => musicStore.duration);

// Methods

const togglePlay = async () => {
  if (isPlaying.value) {
    musicStore.pauseTrack();
  } else if (musicStore.isPaused) {
    await musicStore.resumeTrack();
  } else if (currentTrack.value) {
    await musicStore.playTrack(currentTrack.value);
  } else if (musicStore.tracks.length > 0) {
    await musicStore.playTrack(musicStore.tracks[0]);
  }
};

const previousTrack = () => {
  musicStore.previousTrack();
};

const nextTrack = () => {
  musicStore.nextTrack();
};

const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const seekTime = parseFloat(target.value);
  musicStore.seekTo(seekTime);
};

const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newVolume = parseInt(target.value);
  volume.value = newVolume;
  musicStore.setVolume(newVolume / 100);
};

const toggleShuffle = () => {
  isShuffled.value = !isShuffled.value;
  // Add shuffle logic to store if needed
};

const toggleRepeat = () => {
  switch (repeatMode.value) {
    case "off":
      repeatMode.value = "all";
      break;
    case "all":
      repeatMode.value = "one";
      break;
    case "one":
      repeatMode.value = "off";
      break;
  }
};

// Lifecycle
onMounted(async () => {
  await musicStore.initializeStore();
  musicStore.loadCurrentTrack();
});
</script>

<template>
  <div
    class="music-controller glass-panel rounded-3xl overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl w-[20rem] p-2"
  >
    <div class="flex flex-row items-center gap-2">
      <!-- Background -->
      <div class="p-2">
        <div
          class="relative mx-auto w-[4rem] h-[4rem] rounded-full overflow-hidden shadow-2xl animate-spin"
        >
          <img
            src="/wallpapers/bg-default.jpg"
            :alt="currentTrack?.title || 'No Track'"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
          ></div>
        </div>
      </div>
      <!-- Track Info -->
      <div class="text-center">
        <h2 class="text-white text-[1rem] font-semibold mb-1 truncate">
          {{ currentTrack?.title || "No Track Playing" }}
        </h2>
        <p class="text-white/70 text-[0.875rem] font-medium truncate">
          {{ currentTrack?.artist || "Unknown Artist" }}
        </p>
      </div>
    </div>

    <div class="flex flex-col">
      <!-- Progress Bar -->
      <div class="px-2">
        <div class="relative">
          <input
            type="range"
            :value="currentTime"
            @input="handleSeek"
            min="0"
            :max="duration"
            class="w-full h-[2px] bg-white/30 rounded-full appearance-none cursor-pointer slider"
          />
          <div class="flex justify-between text-white/60 text-sm font-medium">
            <span>{{ musicStore.formattedCurrentTime }}</span>
            <span>{{ musicStore.formattedDuration }}</span>
          </div>
        </div>
      </div>

      <!-- Control Buttons -->
      <div class="p-2 pt-0">
        <div class="flex items-center justify-center space-x-4">
          <!-- Previous Button -->
          <button
            @click="previousTrack"
            class="p-2 cursor-pointer rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <svg
              class="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <!-- Play/Pause Button -->
          <button
            @click="togglePlay"
            class="p-2 cursor-pointer rounded-full bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 transition-all duration-200 hover:scale-105 shadow-xl aspect-square"
          >
            <svg
              v-if="!isPlaying"
              class="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <svg
              v-else
              class="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>

          <!-- Next Button -->
          <button
            @click="nextTrack"
            class="p-2 cursor-pointer rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-105"
          >
            <svg
              class="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        <!-- Secondary Controls -->
        <div class="flex items-center justify-between gap-2 mt-3">
          <!-- Shuffle -->
          <button
            @click="toggleShuffle"
            :class="[
              'p-2 rounded-full  cursor-pointer  transition-all duration-200 hover:scale-105',
              isShuffled
                ? 'bg-white/30 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/100',
            ]"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
              />
            </svg>
          </button>

          <!-- Volume Control -->
          <div class="flex items-center gap-2 flex-1 max-w-full">
            <svg
              class="w-4 h-4 text-white/100"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 9v6h4l5 5V4l-5 5H7z" />
            </svg>
            <input
              type="range"
              v-model="volume"
              @input="handleVolumeChange"
              min="0"
              max="100"
              class="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer volume-slider"
            />
          </div>

          <!-- Repeat -->
          <button
            @click="toggleRepeat"
            :class="[
              'p-2 rounded-full transition-all cursor-pointer duration-200 hover:scale-105',
              repeatMode !== 'off'
                ? 'bg-white/30 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/100',
            ]"
          >
            <svg
              v-if="repeatMode === 'one'"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"
              />
              <text
                x="12"
                y="16"
                text-anchor="middle"
                class="text-xs font-bold"
              >
                1
              </text>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Progress bar slider */
.slider {
  background: linear-gradient(
    to right,
    white 0%,
    white var(--progress, 0%),
    rgba(255, 255, 255, 0.3) var(--progress, 0%),
    rgba(255, 255, 255, 0.3) 100%
  );
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

/* Volume slider */
.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

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
.music-controller button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.music-controller button:active {
  transform: scale(0.95);
}

/* Animations */
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

.music-controller {
  animation: fadeIn 0.6s ease-out;
}

/* iOS-style text styling */
.music-controller h2 {
  font-weight: 600;
  letter-spacing: -0.02em;
}

.music-controller p {
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* Progress bar track styling */
.slider {
  -webkit-appearance: none;
  appearance: none;
  height: 3px;
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
}

.slider::-moz-range-track {
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
}
</style>
